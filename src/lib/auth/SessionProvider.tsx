"use client";

/**
 * Session state for the whole app.
 *
 * The access token is held in memory only — never localStorage, never a
 * readable cookie — so an XSS bug cannot walk away with a durable session. The
 * durable half is the backend's httpOnly refresh cookie, which JavaScript
 * cannot read at all.
 *
 * The consequence is that a page reload has no token, so the provider silently
 * calls /auth/refresh on mount. That request carries the cookie and returns a
 * new access token, restoring the session without the user noticing.
 *
 * This is convenience, not security. Every role and every client-data scope is
 * enforced by the backend; what lives here only decides what to render.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

import * as authApi from "@/lib/api/auth";
import type { MeOut, Permission, UserOut } from "@/lib/api/auth";
import { ApiError, setAccessToken } from "@/lib/api/client";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextValue {
  status: SessionStatus;
  user: UserOut | null;
  client: MeOut["client"] | null;
  /** What this account may do, as the server reports it. */
  permissions: readonly Permission[];
  /**
   * Whether the caller holds a permission.
   *
   * Used to decide what to put in the navigation, so a Manager is not offered
   * a section that would only refuse them. It is not a security boundary —
   * the API authorises every request on its own.
   */
  can: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<UserOut>;
  signOut: () => Promise<void>;
  /** Adopt a session returned by the invite-acceptance endpoint. */
  adoptSession: (accessToken: string, user: UserOut) => void;
  reload: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<UserOut | null>(null);
  const [client, setClient] = useState<MeOut["client"] | null>(null);
  const [permissions, setPermissions] = useState<readonly Permission[]>([]);

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setClient(null);
    setPermissions([]);
    setStatus("anonymous");
  }, []);

  const loadProfile = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me.user);
    setClient(me.client ?? null);
    setPermissions(me.permissions ?? []);
    setStatus("authenticated");
  }, []);

  // Restore the session on mount. A 401 here is the normal "not signed in"
  // case, not an error worth surfacing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(session.access_token);
        await loadProfile();
      } catch {
        if (!cancelled) clear();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clear, loadProfile]);

  // Refresh shortly before the access token expires so a long session does not
  // break mid-action.
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(
      async () => {
        try {
          const session = await authApi.refresh();
          setAccessToken(session.access_token);
        } catch {
          clear();
        }
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [status, clear]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login(email, password);
      setAccessToken(session.access_token);
      setUser(session.user);
      try {
        await loadProfile();
      } catch (error) {
        // Signing in succeeded; only the profile fetch failed.
        if (!(error instanceof ApiError)) throw error;
        setStatus("authenticated");
      }
      return session.user;
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const adoptSession = useCallback(
    (accessToken: string, nextUser: UserOut) => {
      setAccessToken(accessToken);
      setUser(nextUser);
      setStatus("authenticated");
      // The accept response carries the user but not what they may do, and a
      // new Manager lands straight in the staff portal — without this their
      // navigation would be empty until the next page load.
      void loadProfile().catch(() => undefined);
    },
    [loadProfile],
  );

  const can = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions],
  );

  const value = useMemo(
    () => ({
      status, user, client, permissions, can,
      signIn, signOut, adoptSession, reload: loadProfile,
    }),
    [status, user, client, permissions, can, signIn, signOut, adoptSession, loadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return context;
}
