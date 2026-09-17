"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { Icon } from "@/components/brand/Icon";
import { LogoLink } from "@/components/brand/Logo";
import { Monogram } from "@/components/brand/Monogram";
import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";
import { loginPathForTarget } from "@/lib/auth/destinations";
import { useSession } from "@/lib/auth/SessionProvider";

export interface NavItem {
  href: string;
  label: string;
  /** Key into the icon set. Sections without one still work; they look poorer. */
  icon?: string;
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
 * Shared shell for the Customer Portal and the staff portal.
 *
 * It carries the public site's language — the brand gradient, the same card and
 * surface treatment, the same typography — without its motion. Entrance
 * animation belongs on a page someone visits once, not on a list they refresh
 * forty times a day, which is what `sa-workspace` switches off.
 *
 * The page sits on the tinted surface and panels are white on top of it. The
 * other way round, a white panel on a white page has only its border to say it
 * is a panel, and the whole interface reads flat.
 *
 * From the sidebar breakpoint up, the shell fills the viewport and the sidebar
 * and the content each scroll on their own, so the wheel moves whichever one
 * the pointer is over. Below it there is no sidebar to scroll, so the page
 * scrolls as a whole and the header and section chips stay stuck to the top.
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
  const main = useRef<HTMLElement>(null);

  // The browser restores scroll on the window, which no longer moves once the
  // content is its own scroller. Without this, leaving a long client list
  // opens the next section already scrolled halfway down it.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const displayName = client?.company_name ?? user?.full_name ?? user?.email ?? "";

  async function handleSignOut() {
    const login = loginPathForTarget(pathname);
    await signOut();
    router.replace(login);
  }

  return (
    <div className="sa-workspace flex min-h-screen flex-col bg-surface md:h-screen md:min-h-0 md:overflow-hidden">
      {/* Sticky: these pages run long, and losing the way out of a section
          halfway down a task list is a small cruelty. */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-bg/85 backdrop-blur">
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "var(--sa-gradient-brand)", opacity: 0.45 }}
        />
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoLink variant="wordmark" height={32} priority />
            <span
              className="hidden rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted sm:inline"
            >
              {title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">
                {user?.full_name ?? user?.email}
              </p>
              <p className="text-xs capitalize text-muted">
                {client?.company_name ?? user?.role}
              </p>
            </div>
            <Monogram of={displayName} />
            <button
              type="button"
              onClick={handleSignOut}
              className="sa-press rounded-md border border-border bg-bg px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Below the sidebar's breakpoint there was no navigation at all: the
          portal was reachable on a phone and then impossible to move around.
          A scrolling row of the same sections, which needs no script and no
          menu to open. */}
      <nav
        aria-label={`${title} sections`}
        className="sticky top-16 z-30 shrink-0 border-b border-border bg-bg/85 backdrop-blur md:hidden"
      >
        <ul className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 ${
                    active
                      ? "border-primary/40 bg-primary/5 font-medium text-primary"
                      : "border-border text-muted"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 sm:px-6 md:min-h-0">
        {/* A panel in its own right, not a column of links floating on the
            page. The frame stays put and the list scrolls inside it, so the
            border still reads as an edge on a short window. */}
        <nav
          aria-label={title}
          className="hidden w-60 shrink-0 py-8 md:flex md:min-h-0 md:flex-col"
        >
          {/* Sized to its own list rather than stretched down the window: six
              sections in the Client Portal should not leave a column of empty
              panel beneath them. It shrinks and the list scrolls when the
              window is too short for all of them. */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-[var(--sa-shadow-sm)]">
            <ul className="min-h-0 divide-y divide-border overflow-y-auto overscroll-contain [scrollbar-color:var(--sa-color-border)_transparent] [scrollbar-width:thin]">
              {navItems.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 py-2.5 pl-4 pr-3 text-sm transition-colors duration-200 ${
                        active
                          ? "bg-primary/6 font-medium text-primary"
                          : "text-muted hover:bg-surface hover:text-text"
                      }`}
                    >
                      {/* The current section is marked on the edge of the
                          panel, where it cannot be mistaken for a hover. */}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-1"
                          style={{ background: "var(--sa-gradient-brand)" }}
                        />
                      )}
                      <span
                        aria-hidden
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ${
                          active
                            ? "text-white"
                            : "bg-surface text-muted group-hover:text-primary"
                        }`}
                        style={
                          active ? { background: "var(--sa-gradient-brand)" } : undefined
                        }
                      >
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <main
          ref={main}
          className="min-w-0 flex-1 py-8 md:overflow-y-auto md:overscroll-contain"
        >
          {children}
        </main>
      </div>

      <ChatWidgetSlot />
    </div>
  );
}
