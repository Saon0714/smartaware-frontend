"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";
import { useSession } from "@/lib/auth/SessionProvider";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Shared shell for the Customer Portal and Admin Portal.
 *
 * The navigation it receives is chosen per-portal by the caller. That is a
 * presentation decision only — the backend authorises every request
 * independently, so a hidden link is not a permission.
 */
export function AppShell({
  title,
  navItems,
  children,
}: {
  title: string;
  navItems: readonly NavItem[];
  children: ReactNode;
}) {
  const { user, client, signOut } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="text-primary">Smart</span>
              <span className="text-accent">AWARE</span>
            </Link>
            <span aria-hidden className="text-border">|</span>
            <span className="text-sm text-muted">{title}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.full_name ?? user?.email}</p>
              <p className="text-xs text-muted">
                {client?.company_name ?? user?.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <nav aria-label={title} className="hidden w-56 shrink-0 md:block">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-surface font-medium text-primary"
                        : "text-text hover:bg-surface"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <ChatWidgetSlot />
    </div>
  );
}
