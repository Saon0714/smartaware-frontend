"use client";

import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireAuth } from "@/lib/auth/RequireAuth";

/**
 * Sections come from spec 5.3. Pages arrive in later chunks; the navigation is
 * present now so the shape of the portal is settled.
 */
const NAV: readonly NavItem[] = [
  { href: "/portal", icon: "chart", label: "Overview" },
  { href: "/portal/profile", icon: "user", label: "Profile" },
  { href: "/portal/tasks", icon: "clipboard", label: "Tasks" },
  { href: "/portal/manager", icon: "user-check", label: "My Manager" },
  { href: "/portal/invoices", icon: "receipt", label: "Invoices" },
  { href: "/portal/documents", icon: "file", label: "Documents" },
  { href: "/portal/notes", icon: "message", label: "Notes" },
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
