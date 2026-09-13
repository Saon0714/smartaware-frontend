"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Region } from "@/lib/api/services";
import { writeRegionCookie } from "@/lib/region/cookie";

interface RegionContextValue {
  regions: Region[];
  active: Region | null;
  select: (slug: string) => void;
  /** See RegionScope. Null means "the current page is not about one service". */
  setScope: (slugs: string[] | null) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

/**
 * Holds the visitor's chosen market.
 *
 * Seeded from the server so the first render already matches the cookie —
 * there is no flash of the wrong country. Choosing a market writes the cookie
 * and, when the current page is itself country-scoped, moves to the equivalent
 * page for the new one. Everywhere else the choice is simply remembered, since
 * silently navigating away from what someone is reading would be hostile.
 */
export function RegionProvider({
  regions,
  initial,
  children,
}: {
  regions: Region[];
  initial: Region | null;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<Region | null>(initial);
  // The markets that offer the service currently being read, when one is.
  const [scope, setScope] = useState<string[] | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const select = useCallback(
    (slug: string) => {
      const next = regions.find((region) => region.slug === slug);
      if (!next || next.slug === active?.slug) return;

      setActive(next);
      writeRegionCookie(next.slug);

      // /services/<region>[/<service>] -> the same place in the new market.
      const parts = pathname.split("/").filter(Boolean);
      if (parts[0] === "services" && parts[1] && regions.some((r) => r.slug === parts[1])) {
        // A service page only exists in the markets that offer that service, so
        // carrying the slug across blindly would land on a 404 for anything a
        // market does not provide — CIS, for one, is UK-only. When the market
        // does not offer it, fall back to that market's service list, which is
        // the nearest page that answers "what do you do here?".
        if (parts[2] && scope && !scope.includes(next.slug)) {
          router.push(`/services/${next.slug}`);
          return;
        }
        parts[1] = next.slug;
        router.push(`/${parts.join("/")}`);
        return;
      }
      // Otherwise keep the reader where they are, but let the server rebuild
      // links that depend on the market.
      router.refresh();
    },
    [regions, active, pathname, router, scope],
  );

  const value = useMemo(
    () => ({ regions, active, select, setScope }),
    [regions, active, select],
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error("useRegion must be used inside a RegionProvider");
  }
  return context;
}

/**
 * Declares which markets offer the service on the current page.
 *
 * Rendered by the service detail page, which is the only place that knows. The
 * selector is in the site header, above every page, so it cannot work this out
 * for itself; this hands it down rather than making the header fetch a
 * catalogue it has no other use for.
 */
export function RegionScope({ slugs }: { slugs: string[] }) {
  const { setScope } = useRegion();
  // Depend on the contents, not the array identity: the parent is a server
  // component and hands down a fresh array on every render.
  const key = slugs.join(",");

  useEffect(() => {
    setScope(key ? key.split(",") : []);
    return () => setScope(null);
  }, [key, setScope]);

  return null;
}
