"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * Load data once, with an awaitable reload for use after a mutation.
 *
 * Admin screens read-then-write constantly, and refetching after each change
 * keeps the view honest — including any normalisation the server applied, such
 * as a slug derived from a name.
 *
 * The loader is held in a ref rather than a dependency so `reload` stays stable
 * across renders. Callers pass a `key` when the thing being loaded changes
 * (a route parameter, a filter), which is what actually triggers a refetch.
 */
export function useAsync<T>(loader: () => Promise<T>, key = "") {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  // Deliberately does not flip `loading` back on for a refetch. The initial
  // state already covers the first load, and keeping the previous data on
  // screen while a reload runs avoids a flash of "Loading…" after every save.
  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current());
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, key]);

  return { data, error, loading, reload, setError };
}
