"use client";

import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireAuth } from "@/lib/auth/RequireAuth";

/**
 * Admin and Manager share this shell. Managers are refused several of these
 * sections by the API regardless of what the navigation shows — the backend
 * decides, not this list.
 */
const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/invites", label: "Invitations" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/regions", label: "Markets" },
  { href: "/admin/content", label: "Website Content" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["admin", "manager"]}>
      <AppShell title="Admin Portal" navItems={NAV}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
