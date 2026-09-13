"use client";

import { useSession } from "@/lib/auth/SessionProvider";

export default function AdminHomePage() {
  const { user } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
      <p className="mt-2 text-muted">
        Signed in as {user?.email} ({user?.role}).
      </p>

      <p className="mt-8 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        Client management, tasks, invoices and content editing arrive in later
        chunks. Invitations are available now.
      </p>
    </div>
  );
}
