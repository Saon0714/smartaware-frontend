"use client";

/**
 * Chunk 0 scaffold page — a connectivity smoke test, replaced by the real
 * marketing homepage in Chunk 3. It exists to prove the cross-origin contract
 * end to end: generated types, CORS allowlist and credentialed fetch.
 */

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { getHealth, type HealthResponse } from "@/lib/api/health";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => {
        if (!cancelled) setState({ kind: "ok", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiError
            ? error.detail
            : "Could not reach the API. Is smartaware-backend running on port 8000?";
        setState({ kind: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">SmartAWARE</h1>
        <p className="mt-2 text-muted">
          Frontend scaffold. The marketing site lands in Chunk 3.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Backend connectivity
        </h2>
        <div className="mt-3 text-sm">
          {state.kind === "loading" && <p className="text-muted">Checking…</p>}
          {state.kind === "ok" && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium text-success">{state.data.status}</dd>
              <dt className="text-muted">Environment</dt>
              <dd className="font-medium">{state.data.environment}</dd>
              <dt className="text-muted">Version</dt>
              <dd className="font-medium">{state.data.version}</dd>
            </dl>
          )}
          {state.kind === "error" && <p className="text-danger">{state.message}</p>}
        </div>
      </section>
    </main>
  );
}
