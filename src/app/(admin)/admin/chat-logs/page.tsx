"use client";

import { useState } from "react";

import { useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { getChatSession, listChatSessions, type ChatSessionDetail } from "@/lib/api/admin";

/**
 * Smart AI transcripts.
 *
 * Visibility is a setting (Section 13 item 8), defaulted to Admin only, and
 * enforced by the API — a Manager reaching this page gets a 403 rather than
 * data, whatever the navigation shows.
 *
 * The escalated filter is the useful one: those are the questions the FAQ could
 * not answer, which is the best available list of what to write next.
 */
export default function ChatLogsPage() {
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const sessions = useAsync(
    () => listChatSessions(escalatedOnly),
    String(escalatedOnly),
  );
  const [detail, setDetail] = useState<ChatSessionDetail | null>(null);

  const rows = sessions.data ?? [];

  return (
    <div>
      <PageHeader
        title="Smart AI Transcripts"
        description="Conversations with the chatbot. Retained for the configured window, then deleted automatically."
        actions={
          <Button variant="secondary" onClick={() => setEscalatedOnly((v) => !v)}>
            {escalatedOnly ? "Show all" : "Show unanswered only"}
          </Button>
        }
      />

      {sessions.error && (
        <div className="mt-4">
          <FormBanner tone="error">{sessions.error}</FormBanner>
        </div>
      )}
      {sessions.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!sessions.loading && rows.length === 0 && !sessions.error && (
        <div className="mt-6">
          <EmptyState>
            {escalatedOnly
              ? "No unanswered questions. Smart AI matched every question to the FAQ."
              : "No conversations yet."}
          </EmptyState>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <ul className="space-y-2">
          {rows.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() =>
                  void getChatSession(session.id).then(setDetail).catch(() => {})
                }
                className={`w-full rounded-lg border p-4 text-left transition-colors hover:border-primary ${
                  detail?.id === session.id ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={session.surface === "portal" ? "success" : "neutral"}>
                    {session.surface === "portal" ? "Signed in" : "Public site"}
                  </Badge>
                  <Badge>{session.message_count} messages</Badge>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {new Date(session.created_at).toLocaleString("en-GB")}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {detail && (
          <div className="sa-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-medium text-muted">Transcript</h2>
            <ul className="mt-4 space-y-3">
              {(detail.messages ?? []).map((message) => (
                <li
                  key={message.id}
                  className={message.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "border border-border bg-surface"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "assistant" && (
                    <p className="mt-1 text-xs text-muted">
                      {message.escalated ? "Not answered from the FAQ" : "Answered"}
                      {message.top_similarity !== null
                        ? ` · best match ${(message.top_similarity * 100).toFixed(0)}%`
                        : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
