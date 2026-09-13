"use client";

import { useMemo, useState } from "react";

import { describeError } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Controls";
import { setClientServices, type ClientService } from "@/lib/api/admin";

/**
 * Change what a client is engaged for.
 *
 * The ticks are local until Save. An earlier version wrote on every click and
 * drove each box from the server's answer, which meant a click did nothing
 * visible for the length of a round trip and then appeared to spring back —
 * indistinguishable from a control that does not work. It also dropped clicks
 * while a save was in flight, and a second click before the first returned was
 * computed from stale state and undid it.
 *
 * Editing locally and sending the whole set once removes all of that: every
 * click is immediate, and the request that lands is the set on screen.
 *
 * A client never sees this. What they are engaged for is decided when they are
 * invited and changed here afterwards — there is no client-facing route to it.
 */
export function ServicesEditor({
  clientId,
  services,
  options,
  onSaved,
  onCancel,
  cancelLabel = "Cancel",
  compact = false,
}: {
  clientId: string;
  /** What the client currently has, as the server last reported it. */
  services: readonly ClientService[] | null | undefined;
  /** The full catalogue to choose from. */
  options: readonly ClientService[];
  onSaved: () => void | Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
  /** One column, for the narrow space inside a table cell. Two columns there
   *  wrap the longer names over three lines each. */
  compact?: boolean;
}) {
  const saved = useMemo(
    () => (services ?? []).map((service) => service.id),
    [services],
  );
  const [draft, setDraft] = useState<string[]>(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed when the record changes underneath — after a save, or when the
  // parent loads a different client. Adjusted during render rather than in an
  // effect, which would render once with the stale draft and then again to
  // correct it. Keyed on the contents rather than the array identity, so an
  // ordinary re-render does not discard an edit in progress.
  const savedKey = saved.join(",");
  const [seenKey, setSeenKey] = useState(savedKey);
  if (seenKey !== savedKey) {
    setSeenKey(savedKey);
    setDraft(savedKey ? savedKey.split(",") : []);
  }

  const dirty =
    draft.length !== saved.length || draft.some((id) => !saved.includes(id));

  // An archived service is offered only to a client who already has it, so it
  // can be taken away but never newly sold.
  const choices = options.filter(
    (service) => !service.is_archived || saved.includes(service.id),
  );

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await setClientServices(clientId, draft);
          await onSaved();
        } catch (err) {
          setError(describeError(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={compact ? "" : "grid gap-x-6 sm:grid-cols-2"}>
        {choices.map((service) => (
          <Checkbox
            key={service.id}
            id={`service-${clientId}-${service.id}`}
            label={service.is_archived ? `${service.name} (archived)` : service.name}
            checked={draft.includes(service.id)}
            // Refused rather than silently dropped. The response re-seeds the
            // draft from the server, so a tick made mid-save would vanish when
            // it lands — the same "my click did nothing" confusion this editor
            // exists to remove. The window is brief and the button shows why.
            disabled={busy}
            onChange={(event) =>
              setDraft((current) =>
                event.target.checked
                  ? [...current, service.id]
                  : current.filter((existing) => existing !== service.id),
              )
            }
          />
        ))}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" loading={busy} disabled={!dirty}>
          Save services
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary"
          >
            {cancelLabel}
          </button>
        )}
        {dirty && !busy && (
          <span className="text-xs text-muted">Unsaved changes</span>
        )}
      </div>
    </form>
  );
}
