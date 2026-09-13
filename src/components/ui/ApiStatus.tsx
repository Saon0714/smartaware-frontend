"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { getHealth, type HealthResponse } from "@/lib/api/health";

/**
 * Development-only backend connectivity indicator.
 *
 * Keeps the Chunk 0 cross-origin smoke test available while the real pages are
 * built. It renders nothing in production, so it cannot leak infrastructure
 * detail to visitors.
 */

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => {
        if (!cancelled) setState({ kind: "ok", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.detail
              : "Could not reach the API. Is smartaware-backend running on port 8000?",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="mt-10 rounded-lg border border-dashed border-border bg-bg p-4 text-sm">
      <p className="font-medium text-muted">Development — backend connectivity</p>
      <p className="mt-1">
        {state.kind === "loading" && <span className="text-muted">Checking…</span>}
        {state.kind === "ok" && (
          <span className="text-success">
            Connected · {state.data.environment} · v{state.data.version}
          </span>
        )}
        {state.kind === "error" && <span className="text-danger">{state.message}</span>}
      </p>
    </div>
  );
}
