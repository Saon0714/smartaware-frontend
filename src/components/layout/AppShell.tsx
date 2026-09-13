"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { LogoLink } from "@/components/brand/Logo";
import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";
import { loginPathForTarget } from "@/lib/auth/destinations";
import { useSession } from "@/lib/auth/SessionProvider";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * The navigation entry a path belongs to, or null.
 *
 * The longest match wins. Every section sits under the portal's own root, so a
 * plain prefix test marks "Overview" active on every page in the portal —
 * `/admin/staff` starts with `/admin`. Matching on a trailing slash keeps
 * `/admin/clients` from claiming `/admin/clients-archive`, and comparing
 * lengths picks the most specific entry rather than the first one listed.
 */
export function activeNavHref(
  pathname: string,
  items: readonly NavItem[],
): string | null {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).href;
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
  const activeHref = activeNavHref(pathname, navItems);

  async function handleSignOut() {
    const login = loginPathForTarget(pathname);
    await signOut();
    router.replace(login);
  }

  return (
    // `sa-workspace` switches off entrance animation for the interfaces staff
    // and clients actually work in, while keeping hover feedback.
    <div className="sa-workspace flex min-h-screen flex-col">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoLink variant="wordmark" height={34} priority />
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
              className="sa-press rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
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
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-md px-3 py-2 text-sm transition-all duration-200 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-[image:var(--sa-gradient-brand)] before:transition-transform before:duration-200 before:content-[''] ${
                      active
                        ? "bg-surface font-medium text-primary before:scale-y-100"
                        : "text-text before:scale-y-0 hover:bg-surface hover:pl-4 hover:before:scale-y-100"
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
