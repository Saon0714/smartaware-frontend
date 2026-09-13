/**
 * A section divider echoing the wave in the SmartAWARE mark.
 *
 * Decorative, so it is hidden from assistive technology. The gradient is the
 * brand green flowing into the brand blue, matching the logo's own movement.
 *
 * On arrival the wave travels and settles, then stops. Three details make that
 * read as water rather than as a sliding image:
 *
 *   - The path is periodic and three viewports wide, and the travel distance is
 *     exactly four wavelengths. Nothing can slide into view or leave a gap, and
 *     the resting position is indistinguishable from the starting one.
 *   - Travel decelerates rather than ending abruptly, so the motion dies away
 *     like momentum in water instead of being switched off.
 *   - Two layers move at different speeds and opposite phase. Parallax is what
 *     gives a flat gradient the impression of depth.
 *
 * It runs once. A permanently rolling wave would pull attention away from the
 * page for as long as someone stayed on it.
 */
export function BrandWave({
  className = "",
  animate = true,
}: {
  className?: string;
  /** Opt out where a still divider is wanted. */
  animate?: boolean;
}) {
  return (
    <div aria-hidden className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="h-10 w-full sm:h-14"
        role="presentation"
      >
        <defs>
          <linearGradient id="sa-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--sa-green-500)" />
            <stop offset="55%" stopColor="var(--sa-green-600)" />
            <stop offset="100%" stopColor="var(--sa-blue-500)" />
          </linearGradient>
        </defs>

        {/* Back layer: slower and deeper, so it lags behind the crest line. */}
        <g className={animate ? "sa-wave-travel-slow" : undefined}>
          <g className={animate ? "sa-wave-settle-slow" : undefined}>
            <path d="M0 40 q90 40 180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 L4320 80 L0 80 Z" fill="url(#sa-wave)" opacity="0.10" />
          </g>
        </g>

        {/* Front layer: the crest line the eye actually follows. */}
        <g className={animate ? "sa-wave-travel" : undefined}>
          <g className={animate ? "sa-wave-settle" : undefined}>
            <path
              d="M0 48 q90 -28 180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0"
              fill="none"
              stroke="url(#sa-wave)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * A small gradient tile standing in for a service icon.
 *
 * The taxonomy carries an `icon_key` that has never been rendered. Rather than
 * invent an icon set, this derives a consistent two-letter mark from the
 * service name — visual variety that cannot ever be wrong about what a service
 * is.
 */
export function ServiceGlyph({ name }: { name: string }) {
  const initials = name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-[var(--sa-shadow-sm)] transition-transform duration-300 group-hover:scale-105"
      style={{ background: "var(--sa-gradient-brand)" }}
    >
      {initials || "SA"}
    </span>
  );
}
