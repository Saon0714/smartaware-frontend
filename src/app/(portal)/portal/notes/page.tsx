"use client";

import { useAsync } from "@/components/admin/useAsync";
import { EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { listMyNotes } from "@/lib/api/profile";

/**
 * Notes from SmartAWARE — spec Section 5.3.G.
 *
 * Read-only, with no reply control: these are notes SmartAWARE shares, not a
 * conversation, and the API has no route that would accept one.
 */
export default function MyNotesPage() {
  const notes = useAsync(listMyNotes, "notes");
  const rows = notes.data ?? [];

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Information shared with you by the SmartAWARE team."
      />

      {notes.error && (
        <div className="mt-4">
          <FormBanner tone="error">{notes.error}</FormBanner>
        </div>
      )}
      {notes.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!notes.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            No notes yet. Anything the team wants to share with you will appear
            here.
          </EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {rows.map((note) => (
          <li key={note.id} className="sa-card rounded-lg border border-border p-5">
            {note.title && <h2 className="font-medium">{note.title}</h2>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
              {note.content}
            </p>
            <p className="mt-3 text-xs text-muted">
              {note.author_name ? `${note.author_name} · ` : ""}
              {new Date(note.created_at).toLocaleString("en-GB")}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted">
        To reply or ask a question, please contact your manager directly.
      </p>
    </div>
  );
}
