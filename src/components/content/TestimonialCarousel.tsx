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
 * It advances on its own and keeps going. It used to stop while the pointer was
 * anywhere over it, which sounds considerate and is not: the card is wide and
 * centred, so a reader scrolling down the page leaves the cursor sitting on it
 * and the carousel silently never moves. It reads as broken.
 *
 * Keyboard focus still pauses it — being yanked to another slide mid-tab is a
 * real problem rather than a theoretical one — and the arrows and dots are
 * there for anyone who wants to stop or steer, which is what WCAG 2.2.2 asks
 * for.
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
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1);
        if (event.key === "ArrowRight") go(index + 1);
      }}
    >
      {/* Padded, so the card's shadow is not sliced off by the overflow clip
          that keeps the other slides out of sight. */}
      <div className="-mx-2 overflow-hidden px-2 py-2">
        <ul
          className="sa-slide-track flex"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {items.map((quote, position) => (
            <li
              key={quote.id}
              className="flex w-full shrink-0 px-2"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${count}`}
              // Read out of the flow when off-screen, so a screen reader or a
              // find-in-page does not wander into a quote nobody can see.
              aria-hidden={position === index ? undefined : true}
            >
              {/* h-full against a stretched flex row: the quotes differ in
                  length, and without it the carousel resizes on every slide. */}
              <figure className="relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-bg p-8 shadow-[var(--sa-shadow-lg)] sm:p-10">
                {/* The brand edge the other cards on this page carry. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "var(--sa-gradient-brand)" }}
                />
                <div className="flex items-start justify-between gap-4">
                  {quote.rating ? <Stars rating={quote.rating} /> : <span />}
                  {/* Ornament rather than punctuation: large, faint, and sized
                      to sit inside the card rather than be clipped by it. */}
                  <span
                    aria-hidden
                    className="sa-gradient-text pointer-events-none -mt-2 select-none text-6xl font-semibold leading-none opacity-20"
                  >
                    &rdquo;
                  </span>
                </div>

                <blockquote className="mt-4 text-lg leading-relaxed text-text sm:text-xl sm:leading-relaxed">
                  {quote.quote}
                </blockquote>

                <figcaption className="mt-auto flex items-center gap-4 pt-8">
                  <Initials of={quote.author_company ?? quote.author_name} />
                  <div>
                    <p className="text-sm font-medium">{quote.author_name}</p>
                    <p className="text-sm text-muted">
                      {quote.author_company}
                      {quote.author_company && quote.author_region ? " · " : ""}
                      {quote.author_region}
                    </p>
                    {quote.source_url ? (
                      <a
                        href={quote.source_url}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="mt-1 inline-block text-xs text-primary underline underline-offset-4"
                      >
                        Read the review
                      </a>
                    ) : null}
                  </div>
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
                      ? "w-7"
                      : "w-2 bg-border hover:bg-muted"
                  }`}
                  style={
                    position === index
                      ? { background: "var(--sa-gradient-brand)" }
                      : undefined
                  }
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
      className="sa-press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg text-lg leading-none shadow-[var(--sa-shadow-sm)] hover:border-primary hover:text-primary"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  const whole = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p className="flex gap-1 text-lg" aria-label={`Rated ${whole} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden className={i < whole ? "text-primary" : "text-border"}>
          ★
        </span>
      ))}
    </p>
  );
}

/**
 * A monogram standing in for a photograph.
 *
 * Testimonials look unanchored without a face beside them, and these have no
 * photographs — nor will the Trustpilot ones, which carry a display name and
 * nothing else. Initials give the attribution something to sit against without
 * inventing a likeness.
 */
function Initials({ of }: { of: string }) {
  const letters = of
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-[var(--sa-shadow-sm)]"
      style={{ background: "var(--sa-gradient-brand)" }}
    >
      {letters || "SA"}
    </span>
  );
}
