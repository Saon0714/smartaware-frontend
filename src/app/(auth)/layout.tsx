import type { ReactNode } from "react";

import { LogoLink } from "@/components/brand/Logo";
import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <LogoLink variant="wordmark" height={38} priority />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <ChatWidgetSlot />
    </div>
  );
}
