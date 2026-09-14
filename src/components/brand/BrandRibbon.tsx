import type { CSSProperties } from "react";

/**
 * The brand ribbon that closes each page heading.
 *
 * These two paths are the logo's own outlines, read off the supplied artwork
 * rather than drawn by eye — see scripts/trace-logo-ribbons.py, which
 * regenerates them if SmartAWARE supplies new artwork.
 * Hand-approximating it produced a pair of pinstripes — the mark's green ribbon
 * is 44% of its height at the thickest, and guessing put it nearer 20%, which
 * is the difference between the logo and a hairline.
 *
 * Each ribbon keeps its own colour, as in the mark. A single gradient across
 * the whole band turned the green ribbon teal at its tip and started the blue
 * one green, which reads as neither. The gradient within each is slight — the
 * "gradient touch", not a colour change.
 *
 * The band is wider relative to its height than the mark is, so the curves are
 * gentler than the original. That is unavoidable for something spanning a page,
 * and it is the proportional thickness and the crossing that carry the
 * identity; a narrow screen, being closer to the mark's own proportions,
 * naturally shows it closer to true.
 *
 * Decorative, so it is hidden from assistive technology.
 *
 * It sits in normal flow rather than pinned to the section's bottom edge: a
 * pinned decoration draws over whatever is beneath it, and staying clear of the
 * heading then depends on reserving the right amount of padding. In flow it
 * takes its own height and cannot cross the text at any width or text size.
 */
/**
 * How strong the ribbon rests. Stated here rather than in CSS so it can also be
 * the element's inline opacity: an inline style applies while the HTML is being
 * parsed, before any stylesheet, whereas a class rule does not. Without it the
 * ribbon is briefly at full strength — invisible in production, where the
 * stylesheet blocks the first paint, but exactly the flash of a foreground logo
 * that this is meant not to be. An animation outranks an inline style, so the
 * fade still runs.
 */
const RESTING_OPACITY = 0.22;

export function BrandRibbon({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`sa-ribbon-band pointer-events-none select-none ${className}`}
      style={
        {
          "--sa-ribbon-alpha": RESTING_OPACITY,
          opacity: RESTING_OPACITY,
        } as CSSProperties
      }
    >
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="block h-20 w-full sm:h-28"
        role="presentation"
      >
        <defs>
          {/* userSpaceOnUse, not the default: a bounding-box gradient is
              measured against each path's own extent, which would make both
              ribbons run the same sweep over different stretches of the band. */}
          <linearGradient
            id="sa-ribbon-green"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1440"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--sa-green-500)" />
            <stop offset="100%" stopColor="var(--sa-green-600)" />
          </linearGradient>
          <linearGradient
            id="sa-ribbon-blue"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1440"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--sa-blue-500)" />
            <stop offset="100%" stopColor="var(--sa-blue-600)" />
          </linearGradient>
        </defs>

        <path d="M4.7 119.3 Q38.0 122.5 54.6 124.2 Q71.2 125.8 87.8 126.8 Q104.4 127.9 121.0 128.9 Q137.6 130.0 154.2 130.6 Q170.8 131.1 187.4 131.6 Q204.0 132.2 220.6 132.2 Q237.2 132.2 253.8 131.6 Q270.4 131.1 287.0 130.6 Q303.7 130.0 320.3 128.9 Q336.9 127.9 353.5 126.8 Q370.1 125.8 386.7 124.2 Q403.3 122.5 419.9 120.3 Q436.5 118.2 453.1 115.6 Q469.7 112.9 486.3 110.2 Q502.9 107.5 519.5 104.3 Q536.1 101.1 552.8 97.3 Q569.4 93.6 586.0 89.3 Q602.6 85.0 619.2 80.2 Q635.8 75.3 652.4 71.0 Q669.0 66.7 685.6 61.9 Q702.2 57.1 718.8 52.8 Q735.4 48.5 752.0 44.2 Q768.6 39.9 785.2 36.7 Q801.8 33.5 818.5 30.2 Q835.1 27.0 851.7 24.4 Q868.3 21.7 884.9 19.5 Q901.5 17.4 918.1 15.8 Q934.7 14.1 951.3 13.6 Q967.9 13.1 984.5 12.6 Q1001.1 12.0 1017.7 12.6 Q1034.3 13.1 1050.9 14.1 Q1067.5 15.2 1084.2 16.8 Q1100.8 18.4 1117.4 21.6 Q1134.0 24.9 1139.9 25.9 Q1145.8 27.0 1145.8 28.1 Q1145.8 29.2 1139.9 29.2 Q1134.0 29.2 1117.4 30.8 Q1100.8 32.4 1084.2 34.0 Q1067.5 35.6 1050.9 37.8 Q1034.3 39.9 1017.7 42.6 Q1001.1 45.3 984.5 48.5 Q967.9 51.7 951.3 56.0 Q934.7 60.3 918.1 64.6 Q901.5 68.9 884.9 73.7 Q868.3 78.5 851.7 83.3 Q835.1 88.2 818.5 93.6 Q801.8 98.9 785.2 104.8 Q768.6 110.7 752.0 116.1 Q735.4 121.5 718.8 127.4 Q702.2 133.3 685.6 138.1 Q669.0 142.9 652.4 147.8 Q635.8 152.6 619.2 156.9 Q602.6 161.2 586.0 164.4 Q569.4 167.6 552.8 170.8 Q536.1 174.0 519.5 176.7 Q502.9 179.4 486.3 181.0 Q469.7 182.6 453.1 184.2 Q436.5 185.9 419.9 186.4 Q403.3 186.9 386.7 187.4 Q370.1 188.0 353.5 187.4 Q336.9 186.9 320.3 186.4 Q303.7 185.9 287.0 184.8 Q270.4 183.7 253.8 181.6 Q237.2 179.4 220.6 176.7 Q204.0 174.0 187.4 171.3 Q170.8 168.7 154.2 164.9 Q137.6 161.2 121.0 156.9 Q104.4 152.6 87.8 147.8 Q71.2 142.9 54.6 137.6 Q38.0 132.2 21.4 126.8 Q38.0 132.2 4.7 121.5 Z" fill="url(#sa-ribbon-green)" />
        <path d="M688.0 171.9 Q721.2 163.3 737.8 158.5 Q754.4 153.7 771.0 148.3 Q787.6 142.9 804.2 137.6 Q820.8 132.2 837.4 126.3 Q854.0 120.4 870.6 115.1 Q887.2 109.7 903.9 104.3 Q920.5 98.9 937.1 94.1 Q953.7 89.3 970.3 84.4 Q986.9 79.6 1003.5 75.3 Q1020.1 71.0 1036.7 67.2 Q1053.3 63.5 1069.9 60.8 Q1086.5 58.1 1103.1 56.0 Q1119.7 53.9 1136.3 52.2 Q1152.9 50.6 1169.6 50.1 Q1186.2 49.6 1202.8 49.0 Q1219.4 48.5 1236.0 49.0 Q1252.6 49.6 1269.2 50.7 Q1285.8 51.7 1302.4 52.8 Q1319.0 53.9 1335.6 55.5 Q1352.2 57.1 1368.8 59.8 Q1385.4 62.4 1402.0 65.1 Q1418.6 67.8 1429.3 69.9 Q1440.0 72.1 1440.0 72.7 Q1440.0 73.2 1429.3 72.1 Q1418.6 71.0 1402.0 70.5 Q1385.4 70.0 1368.8 69.5 Q1352.2 68.9 1335.6 68.9 Q1319.0 68.9 1302.4 69.5 Q1285.8 70.0 1269.2 71.6 Q1252.6 73.2 1236.0 74.8 Q1219.4 76.4 1202.8 79.1 Q1186.2 81.8 1169.6 85.0 Q1152.9 88.2 1136.3 92.0 Q1119.7 95.7 1103.1 100.6 Q1086.5 105.4 1069.9 110.8 Q1053.3 116.1 1036.7 122.0 Q1020.1 127.9 1003.5 134.4 Q986.9 140.8 970.3 147.2 Q953.7 153.7 937.1 159.6 Q920.5 165.5 903.9 170.3 Q887.2 175.1 870.6 178.3 Q854.0 181.6 837.4 182.6 Q820.8 183.7 804.2 184.2 Q787.6 184.8 771.0 184.2 Q754.4 183.7 737.8 181.6 Q721.2 179.4 704.6 176.7 Q721.2 179.4 688.0 174.0 Z" fill="url(#sa-ribbon-blue)" />
      </svg>
    </div>
  );
}
