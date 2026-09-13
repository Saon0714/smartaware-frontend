/**
 * The visitor's chosen market.
 *
 * Stored in a cookie rather than localStorage so server-rendered pages can read
 * it too. Public pages are assembled on the server, and links like "our
 * services" should already point at the right country in the HTML rather than
 * being corrected after hydration.
 *
 * It is a display preference, never an authorisation input — nothing decides
 * what a visitor may see based on this value.
 */
export const REGION_COOKIE = "sa_region";
export const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

/** Reads the preference on the client. Returns null when nothing is chosen. */
export function readRegionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${REGION_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function writeRegionCookie(slug: string): void {
  if (typeof document === "undefined") return;
  document.cookie =
    `${REGION_COOKIE}=${encodeURIComponent(slug)}; path=/; ` +
    `max-age=${REGION_COOKIE_MAX_AGE}; samesite=lax`;
}
