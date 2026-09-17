/**
 * Initials on a brand-gradient disc, standing in for a photograph.
 *
 * Used where a person or company needs an anchor and there is no image to use —
 * the signed-in user in the portal header, the attribution on a testimonial.
 * Deriving initials from the name means it is never wrong about who it depicts,
 * which a stock avatar would be.
 */
export function Monogram({
  of,
  className = "h-9 w-9 text-xs",
}: {
  of: string | null | undefined;
  className?: string;
}) {
  const letters = (of ?? "")
    .replace(/[^a-zA-Z ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[var(--sa-shadow-sm)] ${className}`}
      style={{ background: "var(--sa-gradient-brand)" }}
    >
      {letters || "SA"}
    </span>
  );
}
