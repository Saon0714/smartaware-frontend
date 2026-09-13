"use client";

import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireAuth } from "@/lib/auth/RequireAuth";

/**
 * Sections come from spec 5.3. Pages arrive in later chunks; the navigation is
 * present now so the shape of the portal is settled.
 */
const NAV: readonly NavItem[] = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/profile", label: "Profile" },
  { href: "/portal/tasks", label: "Tasks" },
  { href: "/portal/manager", label: "My Manager" },
  { href: "/portal/invoices", label: "Payments & Invoices" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/notes", label: "Notes" },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["client"]}>
      <AppShell title="Client Portal" navItems={NAV}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
