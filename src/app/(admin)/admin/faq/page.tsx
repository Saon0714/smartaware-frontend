"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, EmptyState, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createFaq, deleteFaq, getFaqIndexStatus, listFaq, restoreFaq, updateFaq,
  type FaqEntry,
} from "@/lib/api/admin";

/**
 * FAQ management.
 *
 * This is the chatbot's entire knowledge source, so the screen is explicit
 * about indexing: an edited entry is not searchable until the nightly job
 * re-embeds it, and an administrator should be able to see that rather than
 * wonder why the bot still gives the old answer.
 */
export default function FaqAdminPage() {
  const [showDeleted, setShowDeleted] = useState(false);
  const entries = useAsync(() => listFaq(showDeleted), String(showDeleted));
  const status = useAsync(getFaqIndexStatus, String(showDeleted));

  const [editing, setEditing] = useState<FaqEntry | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = entries.data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    entries.setError(null);
    try {
      await action();
      await Promise.all([entries.reload(), status.reload()]);
      return true;
    } catch (err) {
      entries.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const pending = status.data?.pending ?? 0;

  return (
    <div>
      <PageHeader
        title="FAQ"
        description="The knowledge Smart AI answers from. Nothing else is used."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleted((v) => !v)}>
              {showDeleted ? "Hide deleted" : "Show deleted"}
            </Button>
            <Button onClick={() => setEditing("new")} disabled={busy}>
              Add entry
            </Button>
          </>
        }
      />

      {entries.error && (
        <div className="mt-4">
          <FormBanner tone="error">{entries.error}</FormBanner>
        </div>
      )}

      {status.data && (
        <div className="mt-4 sa-card rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium">Search index</p>
          <p className="mt-1 text-muted">
            {status.data.indexed} of {status.data.total} entries indexed.
            {pending > 0 ? (
              <>
                {" "}
                <strong className="text-text">
                  {pending} waiting to be indexed
                </strong>{" "}
                — Smart AI will not find {pending === 1 ? "it" : "them"} until the
                nightly job runs at 02:30 UTC.
              </>
            ) : (
              " Everything is searchable."
            )}
          </p>
        </div>
      )}

      {editing && (
        <div className="mt-6">
          <FaqForm
            entry={editing === "new" ? null : editing}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const ok = await run(() =>
                editing === "new" ? createFaq(values) : updateFaq(editing.id, values),
              );
              if (ok) setEditing(null);
            }}
          />
        </div>
      )}

      {entries.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!entries.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            No FAQ entries yet. Smart AI will refer every question to the contact
            page until some exist.
          </EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {rows.map((entry) => {
          const stale =
            !entry.is_deleted &&
            entry.is_published &&
            (!entry.indexed_at || entry.updated_at > entry.indexed_at);
          return (
            <li key={entry.id} className="sa-card rounded-xl border border-border bg-bg p-4 shadow-[var(--sa-shadow-sm)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{entry.question}</p>
                    {entry.is_deleted && <Badge tone="danger">Deleted</Badge>}
                    {!entry.is_deleted && !entry.is_published && (
                      <Badge tone="neutral">Hidden</Badge>
                    )}
                    {stale && <Badge tone="warning">Awaiting indexing</Badge>}
                    {entry.category && <Badge>{entry.category}</Badge>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                    {entry.answer}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {entry.is_deleted ? (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void run(() => restoreFaq(entry.id))}
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setEditing(entry)}
                        disabled={busy}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this entry? Smart AI will stop using it after the next index run. It can be restored.",
                            )
                          ) {
                            void run(() => deleteFaq(entry.id));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FaqForm({
  entry,
  busy,
  onSubmit,
  onCancel,
}: {
  entry: FaqEntry | null;
  busy: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    question: entry?.question ?? "",
    answer: entry?.answer ?? "",
    category: entry?.category ?? "",
    is_published: entry?.is_published ?? true,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          question: form.question,
          answer: form.answer,
          category: form.category || null,
          is_published: form.is_published,
        });
      }}
      className="sa-card rounded-xl border border-border bg-bg p-6 shadow-[var(--sa-shadow-sm)]"
    >
      <h2 className="font-medium">{entry ? "Edit entry" : "Add an FAQ entry"}</h2>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="question">
            Question<span className="text-danger"> *</span>
          </Label>
          <Input
            id="question"
            required
            minLength={3}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted">
            Phrase it the way a client would ask. The question is matched against
            what visitors type.
          </p>
        </div>
        <div>
          <Label htmlFor="answer">
            Answer<span className="text-danger"> *</span>
          </Label>
          <Textarea
            id="answer"
            rows={6}
            required
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted">
            Smart AI answers only from this text. If it is not written here, the
            bot will refer the visitor to the contact page.
          </p>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <Checkbox
          label="Available to Smart AI"
          checked={form.is_published}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="submit" loading={busy}>
          {entry ? "Save changes" : "Create"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
