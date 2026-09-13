"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { describeError } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Controls";
import { setClientStatus } from "@/lib/api/admin";

const LABELS: Record<string, string> = {
  active: "Active",
  hold: "On hold",
  deactive: "Deactivated",
};

const HELP: Record<string, string> = {
  active: "The client can sign in and work proceeds as usual.",
  hold: "Signs the client out immediately and blocks work on the account. A pause, not a termination.",
  deactive: "Blocks access exactly as hold does — it records that the relationship has ended.",
};

/**
 * Account status, changeable from the client list.
 *
 * Section 6.2 makes this Admin's decision alone, taken after speaking to the
 * client, so the reason is asked for here rather than inferred — it is what
 * later distinguishes a pause from a departure in the account's history, and
 * the API refuses the change without it.
 *
 * Editing expands the row rather than opening a floating panel: the table
 * scrolls sideways inside its own container, which would clip one.
 *
 * A Manager sees the badge and nothing else. That is a convenience, not the
 * boundary — the endpoint is Admin-only regardless of what is rendered.
 */
export function StatusCell({
  clientId,
  status,
  canEdit,
  onChanged,
}: {
  clientId: string;
  status: string;
  canEdit: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setChoice("");
    setNote("");
    setError(null);
  }

  if (!canEdit) return <StatusBadge status={status} />;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left hover:bg-bg"
        aria-label={`Change status — currently ${LABELS[status] ?? status}`}
      >
        <StatusBadge status={status} />
        <span
          aria-hidden
          className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          Change
        </span>
      </button>
    );
  }

  return (
    <form
      className="w-64 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await setClientStatus(clientId, choice, note);
          await onChanged();
          close();
        } catch (err) {
          setError(describeError(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Select
        aria-label="New status"
        required
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="">Change to…</option>
        {["active", "hold", "deactive"]
          .filter((option) => option !== status)
          .map((option) => (
            <option key={option} value={option}>
              {LABELS[option]}
            </option>
          ))}
      </Select>

      {choice && <p className="text-xs text-muted">{HELP[choice]}</p>}

      <Textarea
        aria-label="Reason"
        required
        minLength={3}
        rows={2}
        placeholder="Why is this changing? Recorded against the account."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={busy} disabled={!choice}>
          Save
        </Button>
        <button
          type="button"
          onClick={close}
          className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
