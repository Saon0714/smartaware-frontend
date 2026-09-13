/**
 * A section divider echoing the wave in the SmartAWARE mark.
 *
 * Decorative, so it is hidden from assistive technology. The gradient is the
 * brand green flowing into the brand blue, matching the logo's own movement —
 * it gives a section boundary some character without adding another animation.
 */
export function BrandWave({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
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
        <path
          d="M0 44c180-34 340 22 520 22s300-56 480-56 260 40 440 30v40H0z"
          fill="url(#sa-wave)"
          opacity="0.10"
        />
        <path
          d="M0 54c200-30 320 18 540 18s320-48 500-48 240 34 400 26"
          fill="none"
          stroke="url(#sa-wave)"
          strokeWidth="2"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}
