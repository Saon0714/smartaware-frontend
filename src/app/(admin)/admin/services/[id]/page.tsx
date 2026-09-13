"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  archiveSubcategory, createServiceDetail, createSubcategory,
  deleteServiceDetail, getAvailability, getService, listServiceDetails,
  listSubcategories, setAvailability, updateService, updateSubcategory,
} from "@/lib/api/admin";

/**
 * Edit one service: its copy, its bullet list, its sub-services, and which
 * markets offer it.
 */
export default function ServiceEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const service = useAsync(() => getService(id), id);
  const details = useAsync(() => listServiceDetails(id), id);
  const subs = useAsync(() => listSubcategories(id), id);
  const availability = useAsync(() => getAvailability(id), id);

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBullet, setNewBullet] = useState("");
  const [newSub, setNewSub] = useState("");

  async function act(action: () => Promise<unknown>, after?: () => Promise<unknown>) {
    setBusy(true);
    service.setError(null);
    try {
      await action();
      if (after) await after();
      return true;
    } catch (err) {
      service.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  // Render the form only once data exists, so it initialises from props
  // rather than being synchronised into state by an effect.
  if (service.loading || !service.data) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/services" className="hover:text-primary">
          Services
        </Link>
        <span aria-hidden> / </span>
        <span>{service.data?.name}</span>
      </nav>

      <PageHeader
        title={service.data?.name ?? "Service"}
        description={`/${service.data?.slug}`}
      />

      {service.error && (
        <div className="mt-4">
          <FormBanner tone="error">{service.error}</FormBanner>
        </div>
      )}
      {saved && (
        <div className="mt-4">
          <FormBanner tone="info">Saved.</FormBanner>
        </div>
      )}

      <ServiceCopyForm
        initial={{
          name: service.data.name,
          short_description: service.data.short_description ?? "",
          long_description: service.data.long_description ?? "",
          meta_title: service.data.meta_title ?? "",
          meta_description: service.data.meta_description ?? "",
          is_published: service.data.is_published,
        }}
        busy={busy}
        onSubmit={async (form) => {
          setSaved(false);
          const ok = await act(
            () =>
              updateService(id, {
                name: form.name,
                short_description: form.short_description || null,
                long_description: form.long_description || null,
                meta_title: form.meta_title || null,
                meta_description: form.meta_description || null,
                is_published: form.is_published,
              }),
            service.reload,
          );
          if (ok) setSaved(true);
        }}
      />

      {/* --- Markets --- */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold tracking-tight">Markets</h2>
        <p className="mt-1 text-sm text-muted">
          This service appears on a country page only where it is switched on.
          Use the override to give a market its own wording.
        </p>

        <ul className="mt-4 space-y-2">
          {(availability.data?.regions ?? []).map((row) => (
            <li key={row.region_id} className="sa-card rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    label={row.region_name}
                    checked={row.is_offered}
                    disabled={busy}
                    onChange={(e) =>
                      void act(
                        () =>
                          setAvailability(id, row.region_id, {
                            is_offered: e.target.checked,
                            name_override: row.name_override,
                            short_description_override: row.short_description_override,
                            sort_order: row.sort_order,
                          }),
                        availability.reload,
                      )
                    }
                  />
                  {row.name_override && <Badge>Shown as “{row.name_override}”</Badge>}
                </div>
              </div>

              {row.is_offered && (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const input = new FormData(event.currentTarget);
                    await act(
                      () =>
                        setAvailability(id, row.region_id, {
                          is_offered: true,
                          name_override: String(input.get("name_override") || "") || null,
                          short_description_override:
                            String(input.get("short_override") || "") || null,
                          sort_order: row.sort_order,
                        }),
                      availability.reload,
                    );
                  }}
                  className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <Input
                    name="name_override"
                    aria-label={`Name shown in ${row.region_name}`}
                    placeholder="Name in this market (optional)"
                    defaultValue={row.name_override ?? ""}
                  />
                  <Input
                    name="short_override"
                    aria-label={`Description shown in ${row.region_name}`}
                    placeholder="Description in this market (optional)"
                    defaultValue={row.short_description_override ?? ""}
                  />
                  <Button type="submit" variant="secondary" disabled={busy}>
                    Apply
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* --- Bullets --- */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold tracking-tight">What this includes</h2>
        <p className="mt-1 text-sm text-muted">
          Bullet points listed on the service page.
        </p>

        <ul className="mt-4 space-y-2">
          {(details.data ?? []).map((bullet) => (
            <li
              key={bullet.id}
              className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
            >
              <span className="text-sm">{bullet.text}</span>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void act(() => deleteServiceDetail(bullet.id), details.reload)
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!newBullet.trim()) return;
            const ok = await act(
              () =>
                createServiceDetail(id, {
                  text: newBullet.trim(),
                  sort_order: (details.data?.length ?? 0) + 1,
                }),
              details.reload,
            );
            if (ok) setNewBullet("");
          }}
          className="mt-4 flex gap-2"
        >
          <Input
            aria-label="New bullet point"
            placeholder="Add a bullet point"
            value={newBullet}
            onChange={(e) => setNewBullet(e.target.value)}
          />
          <Button type="submit" disabled={busy || !newBullet.trim()}>
            Add
          </Button>
        </form>
      </section>

      {/* --- Sub-services --- */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold tracking-tight">Sub-services</h2>
        <p className="mt-1 text-sm text-muted">
          Used to categorise tasks. Publish one to also list it on the service
          page.
        </p>

        <ul className="mt-4 space-y-2">
          {(subs.data ?? []).map((sub) => (
            <li
              key={sub.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <span className="text-sm">{sub.name}</span>
              <div className="flex items-center gap-3">
                <Checkbox
                  label="On website"
                  checked={sub.is_published}
                  disabled={busy}
                  onChange={(e) =>
                    void act(
                      () =>
                        updateSubcategory(sub.id, { is_published: e.target.checked }),
                      subs.reload,
                    )
                  }
                />
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void act(() => archiveSubcategory(sub.id), subs.reload)}
                >
                  Archive
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!newSub.trim()) return;
            const ok = await act(
              () =>
                createSubcategory(id, {
                  name: newSub.trim(),
                  sort_order: (subs.data?.length ?? 0) + 1,
                }),
              subs.reload,
            );
            if (ok) setNewSub("");
          }}
          className="mt-4 flex gap-2"
        >
          <Input
            aria-label="New sub-service"
            placeholder="Add a sub-service"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
          />
          <Button type="submit" disabled={busy || !newSub.trim()}>
            Add
          </Button>
        </form>
      </section>
    </div>
  );
}

interface ServiceCopy {
  name: string;
  short_description: string;
  long_description: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
}

function ServiceCopyForm({
  initial,
  busy,
  onSubmit,
}: {
  initial: ServiceCopy;
  busy: boolean;
  onSubmit: (form: ServiceCopy) => void;
}) {
  const [form, setForm] = useState<ServiceCopy>(initial);

  const words = form.short_description.trim()
    ? form.short_description.trim().split(/\s+/).length
    : 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="mt-6 max-w-3xl space-y-4"
    >
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
      </div>

      <div>
        <Label htmlFor="short">Short description</Label>
        <Textarea
          id="short"
          value={form.short_description}
          onChange={(e) => setForm({ ...form, short_description: e.target.value })}
        />
        {/* The 32-40 word guidance is a hint, never a hard limit: the copy
            SmartAWARE supplied runs shorter and is still valid. */}
        <p className="mt-1 text-xs text-muted">
          {words} words.{" "}
          {words > 0 && (words < 32 || words > 40)
            ? "The brand guideline suggests 32–40 words, but shorter or longer is accepted."
            : "Guideline: 32–40 words."}
        </p>
      </div>

      <div>
        <Label htmlFor="long">Full description</Label>
        <Textarea
          id="long"
          rows={8}
          value={form.long_description}
          onChange={(e) => setForm({ ...form, long_description: e.target.value })}
        />
      </div>

      <details className="rounded-md border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Search engine listing
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="meta_title">Meta title</Label>
            <Input
              id="meta_title"
              value={form.meta_title}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea
              id="meta_description"
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            />
          </div>
        </div>
      </details>

      <Checkbox
        label="Show this service on the website"
        checked={form.is_published}
        onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
      />

      <Button type="submit" loading={busy}>
        Save changes
      </Button>
    </form>
  );
}
