/**
 * Logos for the social profiles SmartAWARE links to.
 *
 * Kept apart from the general icon set: these are filled brand marks drawn at
 * the proportions their owners publish, not the stroked 24px glyphs everything
 * else uses, and they must not be redrawn to match.
 *
 * Matched on the platform name from the database, which an editor types. An
 * unrecognised one falls back to a generic link mark rather than disappearing —
 * a profile SmartAWARE adds should still be reachable before anyone gets round
 * to adding its logo here.
 */

const MARKS: Record<string, { label: string; path: string; viewBox?: string }> = {
  linkedin: {
    label: "LinkedIn",
    path:
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 " +
      "1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 " +
      "3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 " +
      "01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 " +
      "0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 " +
      "24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  facebook: {
    label: "Facebook",
    path:
      "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 " +
      "10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 " +
      "4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 " +
      "1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
};

const FALLBACK =
  "M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7M14 11a5 5 0 00-7.5-.5l-3 3a5 5 " +
  "0 007 7l1.7-1.7";

export function SocialIcon({
  platform,
  className = "h-4 w-4",
}: {
  platform: string;
  className?: string;
}) {
  const mark = MARKS[platform.trim().toLowerCase()];

  if (!mark) {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        role="presentation"
      >
        <path d={FALLBACK} />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox={mark.viewBox ?? "0 0 24 24"}
      fill="currentColor"
      className={className}
      role="presentation"
    >
      <path d={mark.path} />
    </svg>
  );
}
