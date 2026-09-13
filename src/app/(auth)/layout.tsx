import Link from "next/link";
import type { ReactNode } from "react";

import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight">
            <span className="text-lg text-primary">Smart</span>
            <span className="text-lg text-accent">AWARE</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <ChatWidgetSlot />
    </div>
  );
}
