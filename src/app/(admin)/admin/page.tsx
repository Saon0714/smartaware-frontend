"use client";

import Link from "next/link";

import { useAsync } from "@/components/admin/useAsync";
import { Icon, IconTile } from "@/components/brand/Icon";
import { EmptyState, PageHeader } from "@/components/ui/Controls";
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

const SHORTCUTS: readonly {
  href: string;
  title: string;
  description: string;
  icon: string;
  needs?: Permission;
}[] = [
  {
    href: "/admin/clients",
    icon: "building",
    title: "Clients",
    description: "Accounts, the services they take, their manager and status.",
    needs: "client:view",
  },
  {
    href: "/admin/tasks",
    icon: "clipboard",
    title: "Tasks",
    description: "Work in progress across your clients, and completion records.",
    needs: "task:view",
  },
  {
    href: "/admin/staff",
    icon: "users",
    title: "Team",
    description: "Managers, and the clients each of them covers.",
    needs: "user:manage",
  },
  {
    href: "/admin/invites",
    icon: "mail",
    title: "Invitations",
    description: "Invite a client to the portal, or a manager to the staff portal.",
    needs: "invite:manage",
  },
  {
    href: "/admin/documents",
    icon: "file",
    title: "Documents",
    description: "Files clients have sent in, and documents shared with them.",
    needs: "document:view",
  },
  {
    href: "/admin/notes",
    icon: "message",
    title: "Client Notes",
    description: "Information shared with clients in their portal.",
    needs: "note:view",
  },
  {
    href: "/admin/enquiries",
    icon: "inbox",
    title: "Enquiries",
    description: "Submissions from the website contact form.",
    needs: "enquiry:view",
  },
  {
    href: "/admin/content",
    icon: "briefcase",
    title: "Website Content",
    description: "About Us copy, values, milestones, contact details and legal pages.",
    needs: "content:manage",
  },
  {
    href: "/admin/services",
    icon: "layers",
    title: "Services",
    description: "The service catalogue, sub-services and which markets offer what.",
    needs: "content:manage",
  },
  {
    href: "/admin/regions",
    icon: "globe",
    title: "Markets",
    description: "Countries with their own services page.",
    needs: "content:manage",
  },
  {
    href: "/admin/faq",
    icon: "help",
    title: "FAQ (Smart AI)",
    description: "The knowledge the chatbot answers from, and its index status.",
    needs: "faq:manage",
  },
  {
    href: "/admin/settings",
    icon: "settings",
    title: "Settings",
    description: "Notification recipients, Smart AI tuning, access rules and payments.",
    needs: "settings:manage",
  },
];

function Stat({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="sa-card sa-interactive group block rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span
          aria-hidden
          className="text-muted transition-colors duration-200 group-hover:text-primary"
        >
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="sa-gradient-text mt-2 text-3xl font-semibold tabular-nums">{value}</p>
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
      <PageHeader
        title={isAdmin ? "Admin Portal" : "Staff Portal"}
        description={
          isAdmin
            ? `Signed in as ${user?.email}.`
            : `Signed in as ${user?.email}. You see the clients you have been tagged to.`
        }
      />

      {can("client:view") && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Your clients"
            value={myClients.length}
            href="/admin/clients"
            icon="building"
          />
          <Stat label="Open tasks" value={open} href="/admin/tasks" icon="clipboard" />
          <Stat
            label="Overdue"
            value={(overdue.data ?? []).length}
            href="/admin/tasks"
            icon="clock"
          />
          <Stat
            label="Not active"
            value={onHold}
            href="/admin/clients?status=hold"
            icon="shield"
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
            className="sa-card sa-interactive group rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)] transition-colors hover:border-primary"
          >
            <IconTile
              name={item.icon}
              size="h-10 w-10"
              iconSize="h-[18px] w-[18px]"
              className="transition-transform group-hover:scale-105"
            />
            <h3 className="mt-4 font-medium transition-colors duration-200 group-hover:text-primary">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
