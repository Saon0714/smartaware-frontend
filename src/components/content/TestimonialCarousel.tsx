"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { HomePage } from "@/lib/api/content";

type Testimonial = HomePage["testimonials"][number];

const ADVANCE_MS = 7000;

/**
 * The testimonials slider.
 *
 * Every quote is in the DOM from the first render and the track is moved with a
 * transform, rather than swapping one slide in at a time. These pages are
 * server-rendered for search, and a carousel that mounts a single slide shows a
 * crawler one testimonial out of however many there are.
 *
 * It advances on its own, and stops doing so the moment anyone shows an
 * interest — hover, focus, or a press of the controls. An animation a reader is
 * fighting is worse than none, and a quote that slides away mid-sentence is
 * exactly that.
 *
 * `source` is carried through from the API because these are placeholders until
 * Trustpilot is connected, and a sample review that looks like a real one is
 * the thing to avoid. When real reviews arrive they carry a link back, which
 * Trustpilot's terms require, and the same markup renders it.
 */
export function TestimonialCarousel({ items }: { items: readonly Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement | null>(null);

  const count = items.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    // Honoured here as well as in CSS: a transform that never animates still
    // changes what is on screen, and this is the part that does that.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      ADVANCE_MS,
    );
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <div
      ref={regionRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="What our clients say"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1);
        if (event.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="overflow-hidden">
        <ul
          className="sa-slide-track flex"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {items.map((quote, position) => (
            <li
              key={quote.id}
              className="w-full shrink-0 px-1"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${count}`}
              // Read out of the flow when off-screen, so a screen reader or a
              // find-in-page does not wander into a quote nobody can see.
              aria-hidden={position === index ? undefined : true}
            >
              <figure className="sa-card mx-auto max-w-3xl rounded-xl border border-border bg-bg p-8 text-center sm:p-10">
                {quote.rating ? <Stars rating={quote.rating} /> : null}
                <blockquote className="mt-5 text-lg leading-relaxed text-muted">
                  &ldquo;{quote.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-medium">{quote.author_name}</span>
                  {quote.author_region ? (
                    <span className="text-muted"> · {quote.author_region}</span>
                  ) : null}
                  {quote.author_company ? (
                    <p className="mt-1 text-xs text-muted">{quote.author_company}</p>
                  ) : null}
                  {quote.source_url ? (
                    <p className="mt-2 text-xs">
                      <a
                        href={quote.source_url}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="text-primary underline underline-offset-4"
                      >
                        Read the review
                      </a>
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Arrow label="Previous testimonial" onClick={() => go(index - 1)}>
            ‹
          </Arrow>
          <ul className="flex items-center gap-2">
            {items.map((quote, position) => (
              <li key={quote.id}>
                <button
                  type="button"
                  onClick={() => go(position)}
                  aria-label={`Show testimonial ${position + 1}`}
                  aria-current={position === index ? "true" : undefined}
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    position === index
                      ? "w-6 bg-primary"
                      : "w-2 bg-border hover:bg-muted"
                  }`}
                />
              </li>
            ))}
          </ul>
          <Arrow label="Next testimonial" onClick={() => go(index + 1)}>
            ›
          </Arrow>
        </div>
      )}

      {/* Announced rather than shown: a sighted reader can see the quote
          change, a screen reader user cannot. */}
      <p className="sr-only" aria-live="polite">
        Testimonial {index + 1} of {count}
      </p>
    </div>
  );
}

function Arrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="sa-press flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-lg leading-none hover:border-primary hover:text-primary"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  const whole = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p className="flex justify-center gap-0.5" aria-label={`Rated ${whole} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={i < whole ? "text-primary" : "text-border"}
        >
          ★
        </span>
      ))}
    </p>
  );
}
