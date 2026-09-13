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
 * The bottom padding is generous on purpose: the wave is absolutely positioned
 * along the bottom edge and stands 40-56px tall, so content needs to clear it.
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
  const top = size === "large" ? "pt-20 sm:pt-24" : "pt-14 sm:pt-16";

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div aria-hidden className="sa-hero-wash" />
      <div className={`relative mx-auto ${width} px-4 pb-28 sm:px-6 sm:pb-32 ${top}`}>
        {children}
      </div>
      <BrandWave className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
