"use client";

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

      <p className="mt-8 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        Tasks, documents, invoices and notes arrive in later chunks.
      </p>
    </div>
  );
}
