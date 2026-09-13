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
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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
  tone?: "default" | "surface";
}) {
  return (
    <section className={tone === "surface" ? "border-y border-border bg-surface" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {title && (
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        )}
        {subtitle && <p className="mt-2 max-w-2xl text-lg text-muted">{subtitle}</p>}
        <div className={title || subtitle ? "mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}
