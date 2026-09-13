"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, PageHeader } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createRegion, deleteRegion, listAdminRegions, updateRegion,
} from "@/lib/api/admin";

/**
 * Markets.
 *
 * Regions are rows rather than an enum precisely so opening a new market is
 * data entry. A region with no services yet renders an empty country page
 * rather than breaking, so it can be created before its services are decided.
 */
export default function RegionsAdminPage() {
  const { data, error, loading, reload, setError } = useAsync(listAdminRegions);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: "", name: "", display_name: "", currency_code: "",
  });

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Countries with their own services page. Each has its own URL under /services."
        actions={
          <Button onClick={() => setCreating((v) => !v)} disabled={busy}>
            Add market
          </Button>
        }
      />

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}

      {creating && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() =>
              createRegion({
                slug: form.slug,
                name: form.name,
                display_name: form.display_name,
                currency_code: form.currency_code || null,
                sort_order: (data?.length ?? 0) + 1,
              }),
            );
            if (ok) {
              setForm({ slug: "", name: "", display_name: "", currency_code: "" });
              setCreating(false);
            }
          }}
          className="mt-6 rounded-lg border border-border bg-surface p-6"
        >
          <h2 className="font-medium">Add a market</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">
                Country<span className="text-danger"> *</span>
              </Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="slug">
                URL segment<span className="text-danger"> *</span>
              </Label>
              <Input
                id="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="qatar"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted">
                Lower case, hyphens only. Becomes /services/{form.slug || "…"}.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="display_name">
                Page heading<span className="text-danger"> *</span>
              </Label>
              <Input
                id="display_name"
                required
                placeholder="Qatar Tax & Accounting Services"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="currency_code">Currency</Label>
              <Input
                id="currency_code"
                maxLength={3}
                placeholder="QAR"
                value={form.currency_code}
                onChange={(e) =>
                  setForm({ ...form, currency_code: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={busy}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <ul className="mt-6 space-y-2">
        {(data ?? []).map((region) => (
          <li
            key={region.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{region.name}</p>
                {!region.is_published && <Badge tone="neutral">Hidden</Badge>}
                {region.currency_code && <Badge>{region.currency_code}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{region.display_name}</p>
              <p className="mt-1 font-mono text-xs text-muted">/services/{region.slug}</p>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                label="Published"
                checked={region.is_published}
                disabled={busy}
                onChange={(e) =>
                  void run(() =>
                    updateRegion(region.id, { is_published: e.target.checked }),
                  )
                }
              />
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete “${region.name}”? Its country page and every service availability setting for it will be removed.`,
                    )
                  ) {
                    void run(() => deleteRegion(region.id));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
