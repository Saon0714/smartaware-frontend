"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import {
  Badge, Checkbox, EmptyState, PageHeader, Select, Textarea,
} from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { listClients } from "@/lib/api/admin";
import { createNote, deleteNote, listNotes, updateNote } from "@/lib/api/profile";

/**
 * Client notes — spec Section 5.3.G.
 *
 * A note is visible to the client as soon as it is published, so the control
 * that decides that is prominent rather than buried, and drafts are clearly
 * marked.
 */
export default function NotesAdminPage() {
  const [clientFilter, setClientFilter] = useState("");
  const notes = useAsync(() => listNotes(clientFilter || undefined), clientFilter);
  const clients = useAsync(() => listClients(), "clients");

  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    client_id: "", title: "", content: "", is_visible_to_client: true,
  });

  const rows = notes.data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    notes.setError(null);
    try {
      await action();
      await notes.reload();
      return true;
    } catch (err) {
      notes.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Client notes"
        description="Information shared with clients in their portal."
        actions={
          <Button onClick={() => setCreating((v) => !v)} disabled={busy}>
            New note
          </Button>
        }
      />

      {notes.error && (
        <div className="mt-4">
          <FormBanner tone="error">{notes.error}</FormBanner>
        </div>
      )}

      {creating && (
        <form
          className="mt-6 sa-card rounded-lg border border-border bg-surface p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() => createNote(form));
            if (ok) {
              setForm({
                client_id: "", title: "", content: "", is_visible_to_client: true,
              });
              setCreating(false);
            }
          }}
        >
          <h2 className="font-medium">New note</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="client">
                Client<span className="text-danger"> *</span>
              </Label>
              <Select
                id="client"
                required
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              >
                <option value="">Choose a client…</option>
                {(clients.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name ?? c.user_email} ({c.client_ref})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">
                Note<span className="text-danger"> *</span>
              </Label>
              <Textarea
                id="content"
                required
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="rounded-md border border-border bg-bg p-4">
              <Checkbox
                label="Visible to the client"
                checked={form.is_visible_to_client}
                onChange={(e) =>
                  setForm({ ...form, is_visible_to_client: e.target.checked })
                }
              />
              <p className="mt-2 text-xs text-muted">
                {form.is_visible_to_client
                  ? "The client will see this in their portal as soon as it is saved."
                  : "Saved as a draft. The client will not see it until you publish it."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={busy} disabled={!form.client_id || !form.content}>
              Save note
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 max-w-sm">
        <Label htmlFor="filter">Filter by client</Label>
        <Select
          id="filter"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">All clients</option>
          {(clients.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name ?? c.user_email}
            </option>
          ))}
        </Select>
      </div>

      {notes.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!notes.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>No notes yet.</EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {rows.map((note) => (
          <li key={note.id} className="sa-card rounded-lg border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {note.title && <p className="font-medium">{note.title}</p>}
                  <Badge tone={note.is_visible_to_client ? "success" : "neutral"}>
                    {note.is_visible_to_client ? "Visible to client" : "Draft"}
                  </Badge>
                  <Badge>{note.client_company_name ?? note.client_ref}</Badge>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                  {note.content}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {note.author_name ?? "—"} ·{" "}
                  {new Date(note.created_at).toLocaleString("en-GB")}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      updateNote(note.id, {
                        is_visible_to_client: !note.is_visible_to_client,
                      }),
                    )
                  }
                >
                  {note.is_visible_to_client ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Delete this note? This cannot be undone.")) {
                      void run(() => deleteNote(note.id));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
