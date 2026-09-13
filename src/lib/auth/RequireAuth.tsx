"use client";

/**
 * Client-side route guard.
 *
 * A convenience that avoids rendering a page the user cannot use, and nothing
 * more. Every permission and every client-data scope is enforced by the
 * backend; bypassing this component reveals no data, because the API would
 * refuse the requests the page makes.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import type { UserRole } from "@/lib/api/auth";
import { loginPathForTarget } from "@/lib/auth/destinations";
import { useSession } from "@/lib/auth/SessionProvider";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly UserRole[];
}) {
  const { status, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !roles || (user ? roles.includes(user.role) : false);

  useEffect(() => {
    if (status === "anonymous") {
      const login = loginPathForTarget(pathname);
      router.replace(`${login}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // A signed-in account bootstrapped by an administrator must set its own
    // password before it can do anything else.
    if (status === "authenticated" && user?.must_change_password) {
      router.replace("/change-password");
    }
  }, [status, user, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (status === "anonymous") return null;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Not available</h1>
        <p className="mt-2 text-sm text-muted">
          Your account does not have access to this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
