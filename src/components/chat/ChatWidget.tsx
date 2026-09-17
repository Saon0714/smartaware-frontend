"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { askSmartAi } from "@/lib/api/chat";
import { enquiryHref } from "@/lib/enquiry/prefill";

/**
 * Smart AI — the floating chat widget.
 *
 * Spec Section 4 requires it on every public page and every portal page, so it
 * lives in the shared shells rather than being added per page.
 *
 * The conversation is held here and nowhere else. Nothing said to Smart AI is
 * recorded server-side, so the earlier turns travel back with each question to
 * give the model context, and closing the tab ends the conversation for good.
 *
 * When it cannot answer, it offers the contact form carrying the question — the
 * one route by which SmartAWARE sees what was asked, taken deliberately, with
 * the wording in front of the person before they send it.
 */

interface Message {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
  /** The question this answer failed to cover, offered to the contact form. */
  asked?: string;
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
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
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

    // The greeting is ours, not something the person said, so it is not sent.
    const history = messages
      .filter((message) => message !== GREETING)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setError(null);
    setBusy(true);

    try {
      const reply = await askSmartAi(question, history);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply.answer,
          escalated: reply.escalated,
          asked: question,
        },
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
        className="sa-press fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white shadow-[var(--sa-shadow-brand)]"
        style={{ background: "var(--sa-gradient-brand)" }}
      >
        <span
          aria-hidden
          className="inline-block transition-transform duration-300 ease-out"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          {open ? "✕" : "💬"}
        </span>
        {open ? "Close" : "Ask Smart AI"}
      </button>

      {open && (
        <div
          id="smart-ai-panel"
          role="dialog"
          aria-label="Smart AI assistant"
          className="sa-panel-in fixed bottom-20 right-5 z-50 flex h-[min(32rem,75vh)] w-[min(24rem,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-[var(--sa-shadow-lg)]"
        >
          <header className="relative border-b border-border bg-surface px-4 py-3">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: "var(--sa-gradient-brand)" }}
            />
            <p className="text-sm font-medium">Smart AI</p>
            <p className="text-xs text-muted">Answers general questions from our FAQ</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`sa-panel-in ${message.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-[var(--sa-shadow-xs)] ${
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm border border-border bg-surface"
                  }`}
                >
                  {message.content}
                </div>
                {message.escalated && (
                  <p className="mt-1.5 text-xs">
                    <Link
                      href={enquiryHref({ question: message.asked })}
                      className="sa-link sa-arrow text-primary"
                      onClick={() => setOpen(false)}
                    >
                      Ask the team instead{" "}
                      <span className="sa-arrow-mark" aria-hidden>→</span>
                    </Link>
                  </p>
                )}
              </div>
            ))}

            {busy && (
              <p
                className="flex items-center gap-1.5 text-left text-sm text-muted"
                aria-live="polite"
              >
                Smart AI is typing
                {/* Three dots easing in turn: it communicates waiting more
                    honestly than a static label, and stops the moment the
                    answer arrives. */}
                <span className="inline-flex gap-0.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1 w-1 rounded-full bg-muted"
                      style={{
                        animation: "sa-fade 900ms ease-in-out infinite alternate",
                        animationDelay: `${dot * 160}ms`,
                      }}
                    />
                  ))}
                </span>
              </p>
            )}
            {error && (
              <p role="alert" className="sa-panel-in text-sm text-danger">
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
                className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary focus:ring-4 focus:ring-primary/12"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="sa-press rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
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
