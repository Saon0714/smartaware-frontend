"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox, PageHeader, Select } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { listSettings, updateSetting, type Setting } from "@/lib/api/admin";

/**
 * Runtime settings.
 *
 * Each row renders the control its type calls for, described by the API rather
 * than decided here — adding a setting server-side makes it editable without a
 * frontend change.
 *
 * Settings that widen access or destroy data carry a confirmation string, shown
 * before the change is sent.
 */
export default function SettingsPage() {
  const groups = useAsync(listSettings, "settings");
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(setting: Setting, value: unknown) {
    setError(null);
    setSaved(null);
    if (setting.confirm && !window.confirm(`${setting.confirm}\n\nContinue?`)) {
      return false;
    }
    try {
      await updateSetting(setting.key, value);
      await groups.reload();
      setSaved(setting.label ?? setting.key);
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Values SmartAWARE can change without a developer. Each takes effect immediately."
      />

      {(error || groups.error) && (
        <div className="mt-4">
          <FormBanner tone="error">{error ?? groups.error}</FormBanner>
        </div>
      )}
      {saved && (
        <div className="mt-4">
          <FormBanner tone="info">“{saved}” saved.</FormBanner>
        </div>
      )}

      {groups.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <div className="mt-6 space-y-10">
        {(groups.data ?? []).map((group) => (
          <section key={group.group}>
            <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
            <div className="mt-4 space-y-4">
              {group.settings.map((setting) => (
                <SettingRow key={setting.key} setting={setting} onSave={save} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: Setting;
  onSave: (setting: Setting, value: unknown) => Promise<boolean>;
}) {
  const assumed = setting.description?.includes("ASSUMED DEFAULT");

  return (
    <div className="sa-card rounded-lg border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`setting-${setting.key}`}>{setting.label}</Label>
          {setting.hint && <p className="mt-1 text-sm text-muted">{setting.hint}</p>}
          {assumed && (
            <p className="mt-2 text-xs text-muted">
              This value was assumed during the build and is awaiting
              SmartAWARE&apos;s confirmation.
            </p>
          )}
          <p className="mt-2 font-mono text-xs text-muted">{setting.key}</p>
        </div>

        <div className="w-full sm:w-72">
          <SettingControl setting={setting} onSave={onSave} />
        </div>
      </div>
    </div>
  );
}

function SettingControl({
  setting,
  onSave,
}: {
  setting: Setting;
  onSave: (setting: Setting, value: unknown) => Promise<boolean>;
}) {
  const id = `setting-${setting.key}`;

  if (!setting.is_editable) {
    return <p className="text-sm text-muted">Not editable here.</p>;
  }

  if (setting.control === "toggle") {
    return (
      <Checkbox
        id={id}
        label={setting.value ? "Enabled" : "Disabled"}
        checked={Boolean(setting.value)}
        onChange={(e) => void onSave(setting, e.target.checked)}
      />
    );
  }

  if (setting.control === "choice") {
    return (
      <Select
        id={id}
        value={String(setting.value ?? "")}
        onChange={(e) => void onSave(setting, e.target.value)}
      >
        {setting.choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </Select>
    );
  }

  if (setting.control === "email_list") {
    return <EmailListControl setting={setting} onSave={onSave} />;
  }

  return <ValueControl setting={setting} onSave={onSave} />;
}

function ValueControl({
  setting,
  onSave,
}: {
  setting: Setting;
  onSave: (setting: Setting, value: unknown) => Promise<boolean>;
}) {
  const numeric = setting.control === "number";
  const [draft, setDraft] = useState(
    typeof setting.value === "object"
      ? JSON.stringify(setting.value)
      : String(setting.value ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const dirty = draft !== String(setting.value ?? "");

  return (
    <form
      className="flex gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await onSave(setting, numeric ? Number(draft) : draft);
        setBusy(false);
      }}
    >
      <Input
        id={`setting-${setting.key}`}
        type={numeric ? "number" : "text"}
        step={numeric ? "any" : undefined}
        min={setting.minimum ?? undefined}
        max={setting.maximum ?? undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button type="submit" variant="secondary" disabled={busy || !dirty}>
        Save
      </Button>
    </form>
  );
}

function EmailListControl({
  setting,
  onSave,
}: {
  setting: Setting;
  onSave: (setting: Setting, value: unknown) => Promise<boolean>;
}) {
  const current: string[] = Array.isArray(setting.value)
    ? (setting.value as string[])
    : [];
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);

  async function commit(next: string[]) {
    setBusy(true);
    const ok = await onSave(setting, next);
    if (ok) setEntry("");
    setBusy(false);
  }

  return (
    <div>
      {current.length === 0 ? (
        <p className="text-sm text-muted">
          No recipients — nothing is emailed for this event.
        </p>
      ) : (
        <ul className="space-y-1">
          {current.map((address) => (
            <li
              key={address}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1 text-sm"
            >
              <span className="truncate">{address}</span>
              <button
                type="button"
                disabled={busy}
                aria-label={`Remove ${address}`}
                onClick={() => void commit(current.filter((a) => a !== address))}
                className="shrink-0 text-muted hover:text-danger"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (entry.trim()) void commit([...current, entry.trim()]);
        }}
      >
        <Input
          id={`setting-${setting.key}`}
          type="email"
          placeholder="name@example.com"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={busy || !entry.trim()}>
          Add
        </Button>
      </form>
    </div>
  );
}
