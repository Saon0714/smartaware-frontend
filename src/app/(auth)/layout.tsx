import type { ReactNode } from "react";

import { LogoLink } from "@/components/brand/Logo";
import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sa-workspace relative flex min-h-screen flex-col overflow-hidden bg-surface">
      {/* The same wash the public pages open with, so signing in does not feel
          like leaving the site. */}
      <div aria-hidden className="sa-hero-wash opacity-70" />
      <header className="relative border-b border-border bg-bg">
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "var(--sa-gradient-brand)", opacity: 0.45 }}
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <LogoLink variant="wordmark" height={38} priority />
        </div>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <ChatWidgetSlot />
    </div>
  );
}
