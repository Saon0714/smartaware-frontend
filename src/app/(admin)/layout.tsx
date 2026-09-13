"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/layout/AppShell";
import type { Permission } from "@/lib/api/auth";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The staff area, shared by Admins and Managers.
 *
 * Each section names the permission it needs, and the navigation is filtered by
 * what the server says this account actually holds. That is not a security
 * control — the API refuses every one of these independently — it is so a
 * Manager is not offered Settings or Website Content only to be turned away.
 *
 * Permissions rather than roles, because two of them are a runtime setting: an
 * Admin can grant Managers content and FAQ access from the Settings screen, and
 * a role-based list here would not notice.
 *
 * The same table also decides what is reachable. Filtering the navigation alone
 * left a Manager who typed an address straight into a page that rendered its
 * heading and description and then an authorisation error — which reads as a
 * broken screen rather than one that was never theirs. One table, so the two
 * cannot disagree.
 */
const NAV: readonly (NavItem & { needs?: Permission })[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/clients", label: "Clients", needs: "client:view" },
  { href: "/admin/staff", label: "Team", needs: "user:manage" },
  { href: "/admin/invites", label: "Invitations", needs: "invite:manage" },
  { href: "/admin/tasks", label: "Tasks", needs: "task:view" },
  // Invoices are deliberately absent: Section 12's payment flow is on hold
  // until SmartAWARE supplies the Wise payment link, and the page does not
  // exist yet. A navigation entry pointing at a 404 is worse than no entry.
  { href: "/admin/documents", label: "Documents", needs: "document:view" },
  { href: "/admin/notes", label: "Client Notes", needs: "note:view" },
  { href: "/admin/enquiries", label: "Enquiries", needs: "enquiry:view" },
  { href: "/admin/services", label: "Services", needs: "content:manage" },
  { href: "/admin/regions", label: "Markets", needs: "content:manage" },
  { href: "/admin/faq", label: "FAQ (Smart AI)", needs: "faq:manage" },
  { href: "/admin/chat-logs", label: "Smart AI Transcripts", needs: "chat_logs:view" },
  { href: "/admin/content", label: "Website Content", needs: "content:manage" },
  { href: "/admin/settings", label: "Settings", needs: "settings:manage" },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["admin", "manager"]}>
      <StaffShell>{children}</StaffShell>
    </RequireAuth>
  );
}

function StaffShell({ children }: { children: ReactNode }) {
  const { user, can } = useSession();
  const pathname = usePathname();

  const items = NAV.filter((item) => !item.needs || can(item.needs));

  // The most specific entry covering this path — "/admin" prefixes everything,
  // so the longest match is the one that describes where we actually are.
  const section = NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];

  const permitted = !section?.needs || can(section.needs);

  return (
    <AppShell
      title={user?.role === "admin" ? "Admin Portal" : "Staff Portal"}
      navItems={items}
    >
      {permitted ? children : <NotAvailable />}
    </AppShell>
  );
}

function NotAvailable() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-xl font-semibold">Not available</h1>
      <p className="mt-2 text-sm text-muted">
        Your account does not have access to this section. If you need it, ask a
        SmartAWARE administrator.
      </p>
    </div>
  );
}
