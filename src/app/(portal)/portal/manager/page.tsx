"use client";

import Link from "next/link";

import { useAsync } from "@/components/admin/useAsync";
import { EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { getProfile } from "@/lib/api/profile";

/**
 * The client's assigned manager — spec Section 5.3.C.
 *
 * Display only: assignment is controlled entirely from the Admin Portal and a
 * client has no say in it, so there is nothing to change here.
 */
export default function MyManagerPage() {
  const profile = useAsync(getProfile, "profile");

  if (profile.loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!profile.data) {
    return (
      <FormBanner tone="error">
        {profile.error ?? "Your account details could not be loaded."}
      </FormBanner>
    );
  }

  const manager = profile.data.assigned_manager;

  return (
    <div>
      <PageHeader
        title="My manager"
        description="Your point of contact at SmartAWARE."
      />

      <div className="mt-6 max-w-xl">
        {manager ? (
          <div className="sa-card rounded-lg border border-border p-6">
            <p className="text-lg font-medium">{manager.full_name ?? manager.email}</p>
            <p className="mt-1 text-sm text-muted">Your assigned manager</p>
            <a
              href={`mailto:${manager.email}`}
              className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
            >
              {manager.email}
            </a>
            <p className="mt-4 text-xs text-muted">
              Quote your client reference when you get in touch:{" "}
              <span className="font-mono">{profile.data.client_ref}</span>
            </p>
          </div>
        ) : (
          <>
            <EmptyState>
              A manager has not been assigned to your account yet.
            </EmptyState>
            <p className="mt-4 text-sm text-muted">
              In the meantime, please{" "}
              <Link href="/contact" className="text-primary underline underline-offset-4">
                contact SmartAWARE
              </Link>{" "}
              and the team will help. Your client reference is{" "}
              <span className="font-mono">{profile.data.client_ref}</span>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
