"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { getProfile, updateProfile } from "@/lib/api/profile";

/**
 * The client's own profile — spec Section 5.3.A.
 *
 * Rendered by the same DynamicForm that drives the enquiry form: both are
 * described by database rows, so neither names a field in the frontend and a
 * field added in the Admin Portal appears here on the next load.
 */
export default function MyProfilePage() {
  const profile = useAsync(getProfile, "profile");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (profile.loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!profile.data) {
    return (
      <FormBanner tone="error">
        {profile.error ?? "Your profile could not be loaded."}
      </FormBanner>
    );
  }

  const record = profile.data;

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your business details, as SmartAWARE holds them."
      />

      {profile.error && (
        <div className="mt-4">
          <FormBanner tone="error">{profile.error}</FormBanner>
        </div>
      )}
      {saved && (
        <div className="mt-4">
          <FormBanner tone="info">Your details have been saved.</FormBanner>
        </div>
      )}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sa-card rounded-xl border border-border bg-bg p-4 shadow-[var(--sa-shadow-sm)]">
          <dt className="text-xs text-muted">Client reference</dt>
          <dd className="mt-1 font-mono">{record.client_ref}</dd>
        </div>
        <div className="sa-card rounded-xl border border-border bg-bg p-4 shadow-[var(--sa-shadow-sm)]">
          <dt className="text-xs text-muted">Onboarding</dt>
          <dd className="mt-1">
            {record.onboarding_completed_at
              ? `Completed ${new Date(record.onboarding_completed_at).toLocaleDateString("en-GB")}`
              : "Not yet completed"}
          </dd>
        </div>
      </dl>

      <div className="mt-8 max-w-2xl">
        {/* The form definition is reused as-is; only the current values are
            injected, so a new field arrives already populated. */}
        <DynamicForm
          definition={{
            key: "client_profile",
            name: "Profile",
            description: null,
            fields: record.fields,
          }}
          initialValues={record.values}
          showHoneypot={false}
          submitLabel="Save changes"
          busy={busy}
          onSubmit={async (values) => {
            setBusy(true);
            setSaved(false);
            profile.setError(null);
            try {
              await updateProfile(values);
              await profile.reload();
              setSaved(true);
            } catch (err) {
              profile.setError(describeError(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}
