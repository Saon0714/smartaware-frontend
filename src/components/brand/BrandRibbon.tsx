/**
 * The brand ribbon that closes each page heading.
 *
 * The SmartAWARE mark is two tapered ribbons — a green one leading, a blue one
 * following, crossing once with a sliver of white between them. This is that
 * idiom drawn the width of the page rather than the logo stretched to fit:
 * squashing a 4:1 mark into a 25:1 band would flatten the curves into straight
 * lines and lose the thing that makes it recognisable. The ribbons taper to a
 * point the way the mark's do, and one gradient runs green to blue across the
 * whole width, so the band reads left to right exactly as the logo does.
 *
 * Decorative, so it is hidden from assistive technology.
 *
 * It sits in normal flow rather than pinned to the section's bottom edge: a
 * pinned decoration draws over whatever is beneath it, and staying clear of the
 * heading then depends on reserving the right amount of padding. In flow it
 * takes its own height and cannot cross the text at any width or text size.
 */
export function BrandRibbon({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-16"
        role="presentation"
      >
        <defs>
          {/* userSpaceOnUse, not the default: a bounding-box gradient is
              measured against each path's own extent, so every ribbon would run
              its own green-to-blue sweep and the band would read green at the
              start of each one. Anchored to the viewBox instead, one gradient
              crosses the whole width — green on the left, blue on the right —
              which is how the mark itself reads. */}
          <linearGradient
            id="sa-ribbon"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1440"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--sa-green-500)" />
            <stop offset="40%" stopColor="var(--sa-green-600)" />
            <stop offset="85%" stopColor="var(--sa-blue-500)" />
            <stop offset="100%" stopColor="var(--sa-blue-500)" />
          </linearGradient>
        </defs>

        {/* Leading ribbon: enters with body at the left, tapers to a tip. */}
        <path
          className="sa-ribbon-reveal"
          d="M-60 58 C 200 26, 420 14, 640 22 C 880 31, 1080 44, 1330 50
             C 1080 62, 880 51, 640 44 C 420 36, 200 52, -60 84 Z"
          fill="url(#sa-ribbon)"
        />

        {/* Following ribbon: begins as a point, thickens, runs off the edge. */}
        <path
          className="sa-ribbon-reveal-late"
          d="M300 84 C 520 70, 700 62, 920 58 C 1120 54, 1320 44, 1500 26
             L1500 50 C 1320 68, 1120 78, 920 82 C 700 86, 520 90, 300 84 Z"
          fill="url(#sa-ribbon)"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
