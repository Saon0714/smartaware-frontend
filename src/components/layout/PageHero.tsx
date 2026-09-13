import type { ReactNode } from "react";

import { BrandWave } from "@/components/brand/BrandWave";

/**
 * The top of a public page.
 *
 * The homepage and About Us had a brand wash and a wave divider; every other
 * page opened on flat grey. Rather than copy that decoration onto each one —
 * where the next page added would miss it again, as the services and contact
 * pages did — it lives here and every public page uses it.
 *
 * The wave sits in normal flow, after the content, rather than being pinned to
 * the section's bottom edge. Pinned, it drew over whatever was underneath, and
 * keeping it clear meant reserving enough bottom padding to cover the tallest
 * it could ever be — a promise that holds only until a heading wraps, a button
 * row grows, or someone enlarges their text. In flow it takes its own height at
 * the foot of the section and cannot cross the content at any width, zoom or
 * font size. It looks the same; it just cannot go wrong.
 */
export function PageHero({
  children,
  /** The homepage opens taller, since it is the one with nothing above it. */
  size = "default",
  /** Matches the width of the content below, so the two line up. */
  width = "max-w-6xl",
}: {
  children: ReactNode;
  size?: "default" | "large";
  width?: string;
}) {
  const padding =
    size === "large" ? "pt-20 pb-16 sm:pt-24 sm:pb-20" : "pt-14 pb-12 sm:pt-16 sm:pb-14";

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div aria-hidden className="sa-hero-wash" />
      <div className={`relative mx-auto ${width} px-4 sm:px-6 ${padding}`}>
        {children}
      </div>
      <BrandWave className="relative block" />
    </section>
  );
}
