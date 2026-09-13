"use client";

import Link from "next/link";

import { useSession } from "@/lib/auth/SessionProvider";

export default function PortalHomePage() {
  const { user, client } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome{user?.full_name ? `, ${user.full_name}` : ""}
      </h1>
      <p className="mt-2 text-muted">
        {client?.company_name ?? "Your SmartAWARE client portal."}
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-5">
          <dt className="text-sm text-muted">Client reference</dt>
          <dd className="mt-1 font-medium">{client?.client_ref ?? "—"}</dd>
        </div>
        <div className="rounded-lg border border-border p-5">
          <dt className="text-sm text-muted">Account status</dt>
          <dd className="mt-1 font-medium capitalize">{client?.status ?? "—"}</dd>
        </div>
        <div className="rounded-lg border border-border p-5">
          <dt className="text-sm text-muted">Onboarding</dt>
          <dd className="mt-1 font-medium">
            {client?.onboarding_completed_at ? "Complete" : "Not started"}
          </dd>
        </div>
      </dl>

      <div className="mt-8 rounded-lg border border-border p-5">
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

      <div className="mt-4 rounded-lg border border-border p-5">
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
            className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.text}</p>
          </Link>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        Payments and invoices arrive in a later chunk.
      </p>
    </div>
  );
}
