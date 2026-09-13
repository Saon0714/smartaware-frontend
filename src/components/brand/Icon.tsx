/**
 * Icons for the `icon_key` values the content model has carried since Chunk 1
 * and never rendered.
 *
 * Drawn as inline strokes rather than pulled from an icon library: there are
 * only a handful, the whole set is well under the weight of a dependency, and
 * they inherit currentColor so a gradient tile can own the colour.
 *
 * An unknown key falls back to a neutral mark. Editors can type anything into
 * that field, and a missing icon should never be a blank space or a crash.
 */

const PATHS: Record<string, string> = {
  scale: "M12 3v18M5 7h14M7 7l-3 6a3 3 0 006 0zM17 7l-3 6a3 3 0 006 0z",
  briefcase: "M3 8h18v12H3zM8 8V5a2 2 0 012-2h4a2 2 0 012 2v3M3 13h18",
  target: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 11.5a.5.5 0 100 1 .5.5 0 000-1z",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3.5 2",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 018 0v4",
  "trending-up": "M3 17l6-6 4 4 8-8M15 7h6v6",
  shield: "M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  building: "M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M14 21V11h4a2 2 0 012 2v8M8 7h2M8 11h2M8 15h2",
  book: "M4 5a2 2 0 012-2h14v16H6a2 2 0 00-2 2zM8 7h8M8 11h6",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20a7 7 0 0114 0M17 11a3 3 0 100-6M18 20a6 6 0 00-2-4.5",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z",
  puzzle: "M4 8h3a2 2 0 114 0h3v3a2 2 0 100 4v3H4z",
  plus: "M12 5v14M5 12h14",
  "hard-hat": "M4 16a8 8 0 0116 0zM3 16h18v3H3zM9 8a3 3 0 016 0v3",
  clipboard: "M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4",
  chart: "M4 20V10M10 20V4M16 20v-7M4 20h16",
};

const FALLBACK = "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v4M12 16h.01";

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null;
  className?: string;
}) {
  const d = (name && PATHS[name]) || FALLBACK;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="presentation"
    >
      <path d={d} />
    </svg>
  );
}

/** The icon on a brand-gradient tile, as used across the marketing pages. */
export function IconTile({
  name,
  size = "h-11 w-11",
  iconSize,
  className = "",
}: {
  name?: string | null;
  /** Tailwind height/width pair. A separate prop rather than something to
   *  override through `className`: two competing size utilities on one element
   *  are resolved by stylesheet order, not by the order they appear in the
   *  attribute, so appending a size would win only by coincidence. */
  size?: string;
  iconSize?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-xl text-white shadow-[var(--sa-shadow-sm)] transition-transform duration-300 ${className}`}
      style={{ background: "var(--sa-gradient-brand)" }}
    >
      <Icon name={name} className={iconSize ?? "h-5 w-5"} />
    </span>
  );
}

/**
 * The mark on a "key strength" card.
 *
 * Key strengths carry an optional `icon_key` that nothing has ever filled in,
 * so falling back to the generic icon would print the same neutral circle on
 * every card — worse than no icon at all. The position in the list is used
 * instead, which at least differs per card and reads as a sequence. If an
 * editor later sets an icon, that wins.
 */
export function StrengthMark({
  iconKey,
  index,
}: {
  iconKey?: string | null;
  index: number;
}) {
  if (iconKey) return <IconTile name={iconKey} />;
  return (
    <span
      aria-hidden
      className="sa-gradient-text block text-3xl font-semibold tabular-nums leading-none"
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}
