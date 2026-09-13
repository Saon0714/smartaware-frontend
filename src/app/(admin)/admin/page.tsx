"use client";

import Link from "next/link";

import { useSession } from "@/lib/auth/SessionProvider";

const AVAILABLE = [
  {
    href: "/admin/clients",
    title: "Clients",
    description: "Client accounts, their assigned manager and account status.",
  },
  {
    href: "/admin/content",
    title: "Website Content",
    description: "About Us copy, team, values, milestones, contact details and legal pages.",
  },
  {
    href: "/admin/services",
    title: "Services",
    description: "The service catalogue, sub-services and which markets offer what.",
  },
  {
    href: "/admin/regions",
    title: "Markets",
    description: "Countries with their own services page.",
  },
  {
    href: "/admin/tasks",
    title: "Tasks",
    description: "Work in progress across your clients, and completion records.",
  },
  {
    href: "/admin/faq",
    title: "FAQ (Smart AI)",
    description: "The knowledge the chatbot answers from, and its index status.",
  },
  {
    href: "/admin/enquiries",
    title: "Enquiries",
    description: "Submissions from the website contact form.",
  },
  {
    href: "/admin/documents",
    title: "Documents",
    description: "Files clients have sent in, and documents shared with them.",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Notification recipients, Smart AI tuning, access rules and payments.",
  },
  {
    href: "/admin/invites",
    title: "Invitations",
    description: "Invite clients to the portal.",
  },
];

export default function AdminHomePage() {
  const { user } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
      <p className="mt-2 text-muted">
        Signed in as {user?.email} ({user?.role}).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {AVAILABLE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        Client management, tasks, documents and invoices arrive in later chunks.
      </p>
    </div>
  );
}
