"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { askSmartAi } from "@/lib/api/chat";

/**
 * Smart AI — the floating chat widget.
 *
 * Spec Section 4 requires it on every public page and every portal page, so it
 * lives in the shared shells rather than being added per page.
 *
 * The session token is kept in sessionStorage so a conversation survives
 * navigation within a tab but does not outlive it. It is an opaque server-issued
 * identifier for a transcript, not a credential — the bot answers from the FAQ
 * only and can reach no account data, so it grants nothing if read.
 */

const SESSION_KEY = "smartaware.chat.session";

interface Message {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Hello, I'm Smart AI. I can answer general questions about SmartAWARE's services from our FAQ. What would you like to know?",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    sessionToken.current = sessionStorage.getItem(SESSION_KEY);
  }, []);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: "end" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  // Escape closes the panel, as expected of any overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setError(null);
    setBusy(true);

    try {
      const reply = await askSmartAi(question, sessionToken.current);
      sessionToken.current = reply.session_token;
      sessionStorage.setItem(SESSION_KEY, reply.session_token);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply.answer, escalated: reply.escalated },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "You've sent a lot of messages. Please wait a moment before asking again."
          : "Smart AI is unavailable right now. Please contact us and the team will help.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="smart-ai-panel"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        <span aria-hidden>{open ? "✕" : "💬"}</span>
        {open ? "Close" : "Ask Smart AI"}
      </button>

      {open && (
        <div
          id="smart-ai-panel"
          role="dialog"
          aria-label="Smart AI assistant"
          className="fixed bottom-20 right-5 z-50 flex h-[min(32rem,75vh)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-2xl"
        >
          <header className="border-b border-border bg-surface px-4 py-3">
            <p className="text-sm font-medium">Smart AI</p>
            <p className="text-xs text-muted">
              Answers general questions from our FAQ
            </p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
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
                {message.escalated && (
                  <p className="mt-1.5 text-xs">
                    <Link
                      href="/contact"
                      className="text-primary underline underline-offset-4"
                      onClick={() => setOpen(false)}
                    >
                      Contact SmartAWARE →
                    </Link>
                  </p>
                )}
              </div>
            ))}

            {busy && (
              <p className="text-left text-sm text-muted" aria-live="polite">
                Smart AI is typing…
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Your question"
                maxLength={1000}
                className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Smart AI cannot see your account, invoices or documents.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
