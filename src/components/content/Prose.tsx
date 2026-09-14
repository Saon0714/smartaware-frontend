/**
 * Renders a content block's body.
 *
 * Bodies are stored as plain text with blank-line paragraph breaks, and are
 * rendered as text nodes rather than HTML. Admin-authored content is trusted,
 * but rendering it as markup would turn any future compromise of an editor
 * account into stored XSS on every visitor's browser.
 */
export function Prose({
  body,
  className = "",
}: {
  body: string | null | undefined;
  className?: string;
}) {
  if (!body) return null;

  const paragraphs = body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-muted">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

// `items` is optional in the generated schema because the backend field has
// a default, so accept undefined rather than asserting at every call site.
export function BulletList({ items }: { items?: readonly string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-muted">
          <span
            aria-hidden
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: "var(--sa-gradient-brand)" }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Section({
  title,
  subtitle,
  children,
  tone = "default",
}: {
  title?: string | null;
  subtitle?: string | null;
  children: React.ReactNode;
  /**
   * `brand` is a softly tinted band — green fading through the surface colour
   * to blue. It exists so a section can hold white cards: on the plain surface
   * a white card has only its border to separate it from the page, which reads
   * as no card at all.
   */
  tone?: "default" | "surface" | "brand";
}) {
  return (
    <section
      className={
        tone === "surface"
          ? "border-y border-border bg-surface"
          : tone === "brand"
            ? "relative overflow-hidden border-y border-border"
            : ""
      }
    >
      {tone === "brand" && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg," +
              " color-mix(in srgb, var(--sa-green-500) 9%, var(--sa-color-surface)) 0%," +
              " var(--sa-color-surface) 48%," +
              " color-mix(in srgb, var(--sa-blue-500) 10%, var(--sa-color-surface)) 100%)",
          }}
        />
      )}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        {title && (
          <div className="sa-rise">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            <span aria-hidden className="sa-accent-bar mt-3" />
          </div>
        )}
        {subtitle && <p className="sa-rise mt-3 max-w-2xl text-lg text-muted">{subtitle}</p>}
        <div className={title || subtitle ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}
