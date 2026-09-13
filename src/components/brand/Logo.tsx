import Image from "next/image";
import Link from "next/link";

import logoFull from "@/../public/brand/logo-full.png";
import logoMark from "@/../public/brand/logo-mark.png";
import logoWordmark from "@/../public/brand/logo-wordmark.png";

/**
 * The SmartAWARE logo.
 *
 * Three variants are derived from the single supplied artwork:
 *
 *   full      wave + wordmark + "Promoting Financial Healing." Use where there
 *             is vertical room: footers, sign-in cards, hero areas.
 *   wordmark  wave + wordmark only. Use in the 64px application headers, where
 *             the tagline would render around 8px tall and be unreadable.
 *   mark      the wave alone, for favicons and very tight spaces.
 *
 * The source was an opaque JPEG; these are transparent PNGs cropped to their
 * artwork, so they sit correctly on the off-white surfaces used across the app.
 * If SmartAWARE supplies official variants (ideally SVG), replacing the files
 * in public/brand is the only change needed.
 */

const VARIANTS = {
  full: { src: logoFull, alt: "SmartAWARE — Promoting Financial Healing" },
  wordmark: { src: logoWordmark, alt: "SmartAWARE" },
  mark: { src: logoMark, alt: "" },
} as const;

export type LogoVariant = keyof typeof VARIANTS;

interface LogoProps {
  variant?: LogoVariant;
  /** Rendered height in pixels; width follows the artwork's aspect ratio. */
  height?: number;
  className?: string;
  /** Load eagerly. Set on the header logo, which is above the fold. */
  priority?: boolean;
}

export function Logo({
  variant = "wordmark",
  height = 36,
  className = "",
  priority = false,
}: LogoProps) {
  const { src, alt } = VARIANTS[variant];
  const ratio = src.width / src.height;

  return (
    <Image
      src={src}
      alt={alt}
      height={height}
      width={Math.round(height * ratio)}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}

/**
 * The logo as a link home.
 *
 * The image already carries the company name, so the link needs no visible
 * text — but an empty-alt `mark` would leave it unlabelled, hence the explicit
 * accessible name.
 */
export function LogoLink({
  href = "/",
  variant = "wordmark",
  height = 36,
  priority = false,
}: LogoProps & { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="SmartAWARE — home"
      className="inline-flex items-center transition-transform duration-300 ease-out hover:scale-[1.03]"
    >
      <Logo variant={variant} height={height} priority={priority} />
    </Link>
  );
}
