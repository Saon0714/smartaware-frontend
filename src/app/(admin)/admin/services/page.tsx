"use client";

import Link from "next/link";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  archiveService, createService, listServices, reorderServices, restoreService,
} from "@/lib/api/admin";

/**
 * Service catalogue.
 *
 * Deleting a service archives it: tasks reference services, so destroying the
 * row would corrupt the record of completed work. Archived services disappear
 * from the website and from new-task pickers while history keeps its reference,
 * and can be restored.
 */
export default function ServicesAdminPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data, error, loading, reload, setError } = useAsync(() => listServices(showArchived), String(showArchived));
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", short_description: "" });

  const services = data ?? [];
  const active = services.filter((s) => !s.is_archived);

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

  async function move(index: number, direction: -1 | 1) {
    const next = [...active];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    await run(() => reorderServices(next.map((s) => s.id)));
  }

  return (
    <div>
      <PageHeader
        title="Services"
        description="The service catalogue shown on the website and used to categorise tasks."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? "Hide archived" : "Show archived"}
            </Button>
            <Button onClick={() => setCreating((v) => !v)} disabled={busy}>
              Add service
            </Button>
          </>
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
              createService({
                name: form.name,
                short_description: form.short_description || null,
              }),
            );
            if (ok) {
              setForm({ name: "", short_description: "" });
              setCreating(false);
            }
          }}
          className="mt-6 sa-card rounded-lg border border-border bg-surface p-6"
        >
          <h2 className="font-medium">Add a service</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">
                Name<span className="text-danger"> *</span>
              </Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted">
                The web address is generated from the name.
              </p>
            </div>
            <div>
              <Label htmlFor="short_description">Short description</Label>
              <Textarea
                id="short_description"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
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
          <p className="mt-4 text-xs text-muted">
            A new service is not shown anywhere until you switch on the markets
            that offer it.
          </p>
        </form>
      )}

      <div className="mt-6">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {!loading && services.length === 0 && <EmptyState>No services yet.</EmptyState>}

        <ul className="space-y-2">
          {services.map((service) => {
            const index = active.findIndex((s) => s.id === service.id);
            return (
              <li
                key={service.id}
                className="flex items-start gap-4 sa-card rounded-lg border border-border p-4"
              >
                {!service.is_archived && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void move(index, -1)}
                      disabled={busy || index <= 0}
                      aria-label="Move up"
                      className="rounded border border-border px-2 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(index, 1)}
                      disabled={busy || index === active.length - 1}
                      aria-label="Move down"
                      className="rounded border border-border px-2 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{service.name}</p>
                    {service.is_archived && <Badge tone="warning">Archived</Badge>}
                    {!service.is_archived && !service.is_published && (
                      <Badge tone="neutral">Hidden</Badge>
                    )}
                    <Badge>{service.subcategories?.length ?? 0} sub-services</Badge>
                  </div>
                  {service.short_description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {service.short_description}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted">/{service.slug}</p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {service.is_archived ? (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void run(() => restoreService(service.id))}
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
                      >
                        Edit
                      </Link>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Archive “${service.name}”? It will be removed from the website. Existing tasks keep their history, and you can restore it later.`,
                            )
                          ) {
                            void run(() => archiveService(service.id));
                          }
                        }}
                      >
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
