"use client";

import Link from "next/link";

import { Icon } from "@/components/brand/Icon";
import { PageHeader } from "@/components/ui/Controls";
import { useSession } from "@/lib/auth/SessionProvider";

export default function PortalHomePage() {
  const { user, client } = useSession();

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.full_name ? `, ${user.full_name}` : ""}`}
        description={client?.company_name ?? "Your SmartAWARE client portal."}
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <Fact icon="receipt" label="Client reference" value={client?.client_ref ?? "—"} />
        <Fact
          icon="shield"
          label="Account status"
          value={client?.status ?? "—"}
          capitalise
        />
        <Fact
          icon="clipboard"
          label="Onboarding"
          value={client?.onboarding_completed_at ? "Complete" : "Not started"}
        />
      </dl>

      <div className="mt-8 sa-card rounded-lg border border-border p-5">
        <h2 className="font-medium">Work status</h2>
        <p className="mt-1 text-sm text-muted">
          See what SmartAWARE is working on for you and what has been completed.
        </p>
        <Link
          href="/portal/tasks"
          className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
        >
          View my tasks
        </Link>
      </div>

      <div className="mt-4 sa-card rounded-lg border border-border p-5">
        <h2 className="font-medium">Documents</h2>
        <p className="mt-1 text-sm text-muted">
          Send documents to SmartAWARE and download what they have shared with
          you.
        </p>
        <Link
          href="/portal/documents"
          className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
        >
          View my documents
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { href: "/portal/profile", title: "Profile", text: "Your business details." },
          { href: "/portal/manager", title: "My manager", text: "Your point of contact." },
          { href: "/portal/notes", title: "Notes", text: "Information shared with you." },
          {
            href: "/portal/onboarding",
            title: "Onboarding",
            text: "Tell us about your business.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="sa-card sa-interactive rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)] transition-colors hover:border-primary"
          >
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.text}</p>
          </Link>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        Payments and invoices are not available here yet. SmartAWARE will let
        you know when they are.
      </p>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  capitalise = false,
}: {
  icon: string;
  label: string;
  value: string;
  capitalise?: boolean;
}) {
  return (
    <div className="sa-card rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)]">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </dt>
      <dd className={`mt-2 font-medium ${capitalise ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
