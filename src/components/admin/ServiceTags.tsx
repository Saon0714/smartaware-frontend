import type { ClientService } from "@/lib/api/admin";

/**
 * A client's services, all on the one row they belong to.
 *
 * A client commonly takes several, and the list must never repeat a client per
 * service — that is enforced in the query, and this is the other half of it.
 *
 * An archived service still appears: it is a record of what the client is
 * engaged for, not a live catalogue. It is marked so nobody reads it as still
 * on sale.
 */
export function ServiceTags({
  services,
  limit,
}: {
  services: readonly ClientService[] | null | undefined;
  /** Show at most this many, then a count. Omit to show all. */
  limit?: number;
}) {
  const all = services ?? [];
  if (all.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const shown = limit ? all.slice(0, limit) : all;
  const hidden = all.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((service) => (
        <li
          key={service.id}
          title={service.is_archived ? `${service.name} (archived service)` : service.name}
          className={`rounded-full border px-2 py-0.5 text-xs ${
            service.is_archived
              ? "border-dashed border-border text-muted"
              : "border-primary/25 bg-primary/5 text-primary"
          }`}
        >
          {service.name}
          {service.is_archived && <span className="ml-1 opacity-70">(archived)</span>}
        </li>
      ))}
      {hidden > 0 && (
        <li
          title={all.slice(shown.length).map((s) => s.name).join(", ")}
          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
        >
          +{hidden} more
        </li>
      )}
    </ul>
  );
}
