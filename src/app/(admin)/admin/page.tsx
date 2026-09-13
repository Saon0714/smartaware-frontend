"use client";

import Link from "next/link";

import { useAsync } from "@/components/admin/useAsync";
import { EmptyState } from "@/components/ui/Controls";
import { listClients } from "@/lib/api/admin";
import type { Permission } from "@/lib/api/auth";
import { getTaskCounts, listTasks } from "@/lib/api/tasks";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The staff landing page.
 *
 * Admins and Managers arrive here, and they want different things. An Admin is
 * running the firm, so the shortcuts matter. A Manager is working a book of
 * clients, so their own numbers matter — and being shown a grid of sections the
 * API will refuse them is worse than useless.
 *
 * Both the numbers and the shortcuts come from what the account may actually
 * do, not from its role name: two permissions are a runtime setting.
 */

const SHORTCUTS: readonly { href: string; title: string; description: string; needs?: Permission }[] = [
  {
    href: "/admin/clients",
    title: "Clients",
    description: "Accounts, the services they take, their manager and status.",
    needs: "client:view",
  },
  {
    href: "/admin/tasks",
    title: "Tasks",
    description: "Work in progress across your clients, and completion records.",
    needs: "task:view",
  },
  {
    href: "/admin/staff",
    title: "Team",
    description: "Managers, and the clients each of them covers.",
    needs: "user:manage",
  },
  {
    href: "/admin/invites",
    title: "Invitations",
    description: "Invite a client to the portal, or a manager to the staff portal.",
    needs: "invite:manage",
  },
  {
    href: "/admin/documents",
    title: "Documents",
    description: "Files clients have sent in, and documents shared with them.",
    needs: "document:view",
  },
  {
    href: "/admin/notes",
    title: "Client Notes",
    description: "Information shared with clients in their portal.",
    needs: "note:view",
  },
  {
    href: "/admin/enquiries",
    title: "Enquiries",
    description: "Submissions from the website contact form.",
    needs: "enquiry:view",
  },
  {
    href: "/admin/content",
    title: "Website Content",
    description: "About Us copy, values, milestones, contact details and legal pages.",
    needs: "content:manage",
  },
  {
    href: "/admin/services",
    title: "Services",
    description: "The service catalogue, sub-services and which markets offer what.",
    needs: "content:manage",
  },
  {
    href: "/admin/regions",
    title: "Markets",
    description: "Countries with their own services page.",
    needs: "content:manage",
  },
  {
    href: "/admin/faq",
    title: "FAQ (Smart AI)",
    description: "The knowledge the chatbot answers from, and its index status.",
    needs: "faq:manage",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Notification recipients, Smart AI tuning, access rules and payments.",
    needs: "settings:manage",
  },
];

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="sa-card sa-interactive block rounded-lg border border-border bg-bg p-5"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="sa-gradient-text mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </Link>
  );
}

export default function StaffHomePage() {
  const { user, can } = useSession();
  const isAdmin = user?.role === "admin";

  const clients = useAsync(() => listClients(), "clients");
  const counts = useAsync(() => getTaskCounts(), "counts");
  const overdue = useAsync(() => listTasks({ overdue: true }), "overdue");

  const myClients = clients.data ?? [];
  const tasks = counts.data;
  const shortcuts = SHORTCUTS.filter((item) => !item.needs || can(item.needs));

  const open = tasks ? tasks.pending + tasks.in_progress : 0;
  const onHold = myClients.filter((c) => c.status !== "active").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {isAdmin ? "Admin Portal" : "Staff Portal"}
      </h1>
      <p className="mt-2 text-muted">
        {isAdmin
          ? `Signed in as ${user?.email}.`
          : `Signed in as ${user?.email}. You see the clients you have been tagged to.`}
      </p>

      {can("client:view") && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Your clients" value={myClients.length} href="/admin/clients" />
          <Stat label="Open tasks" value={open} href="/admin/tasks" />
          <Stat label="Overdue" value={(overdue.data ?? []).length} href="/admin/tasks" />
          <Stat
            label="Not active"
            value={onHold}
            href="/admin/clients?status=hold"
          />
        </div>
      )}

      {/* A manager with nothing tagged to them would otherwise see four zeroes
          and no explanation of why. */}
      {!isAdmin && !clients.loading && myClients.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            You have not been tagged to any clients yet. An administrator
            assigns them on the Team page, and they will appear here.
          </EmptyState>
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium text-muted">Where to go</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="sa-card sa-interactive group rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <h3 className="font-medium transition-colors duration-200 group-hover:text-primary">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
