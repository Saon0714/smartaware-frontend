import { cookies } from "next/headers";

import { listRegions, type Region } from "@/lib/api/services";
import { REGION_COOKIE } from "@/lib/region/cookie";

/**
 * Resolve the market to use for a server-rendered page.
 *
 * Falls back to the first published region — the primary market — so links are
 * always valid even before anyone has chosen. A stale or unknown cookie value
 * is ignored rather than trusted, since a market can be unpublished at any time.
 */
export async function resolveRegion(): Promise<{
  regions: Region[];
  active: Region | null;
}> {
  const [regions, store] = await Promise.all([
    listRegions().catch(() => [] as Region[]),
    cookies(),
  ]);

  const chosen = store.get(REGION_COOKIE)?.value;
  const active =
    regions.find((region) => region.slug === chosen) ?? regions[0] ?? null;

  return { regions, active };
}
