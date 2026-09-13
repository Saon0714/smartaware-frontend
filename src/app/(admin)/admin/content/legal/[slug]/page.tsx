"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { getLegal, updateLegal } from "@/lib/api/admin";

export default function LegalEditorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const page = useAsync(() => getLegal(slug), slug);

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(form: LegalForm) {
    setBusy(true);
    setSaved(false);
    page.setError(null);
    try {
      await updateLegal(slug, {
        title: form.title,
        body: form.body,
        version: form.version || null,
        effective_from: form.effective_from || null,
        is_published: form.is_published,
      });
      setSaved(true);
      await page.reload();
    } catch (err) {
      page.setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  // Render the form only once data exists, so it initialises from props
  // rather than being synchronised into state by an effect.
  if (page.loading || !page.data) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content/legal" className="hover:text-primary">
          Legal Pages
        </Link>
        <span aria-hidden> / </span>
        <span>{page.data?.title}</span>
      </nav>

      <PageHeader
        title={page.data?.title ?? slug}
        description={`Published at /${slug} once enabled.`}
      />

      {page.error && (
        <div className="mt-4">
          <FormBanner tone="error">{page.error}</FormBanner>
        </div>
      )}
      {saved && (
        <div className="mt-4">
          <FormBanner tone="info">Saved.</FormBanner>
        </div>
      )}

      <LegalFormFields
        initial={{
          title: page.data.title,
          body: page.data.body,
          version: page.data.version ?? "",
          effective_from: page.data.effective_from ?? "",
          is_published: page.data.is_published,
        }}
        busy={busy}
        onSubmit={save}
      />
    </div>
  );
}

interface LegalForm {
  title: string;
  body: string;
  version: string;
  effective_from: string;
  is_published: boolean;
}

function LegalFormFields({
  initial,
  busy,
  onSubmit,
}: {
  initial: LegalForm;
  busy: boolean;
  onSubmit: (form: LegalForm) => void;
}) {
  const [form, setForm] = useState<LegalForm>(initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="mt-6 max-w-3xl space-y-4"
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="body">Content</Label>
        <Textarea
          id="body"
          rows={20}
          required
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted">
          Separate paragraphs with a blank line. Plain text only.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            placeholder="1.0"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="effective_from">Effective from</Label>
          <Input
            id="effective_from"
            type="date"
            value={form.effective_from}
            onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <Checkbox
          label="Publish this page on the website"
          checked={form.is_published}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
        <p className="mt-2 text-xs text-muted">
          Publishing makes this page publicly readable and adds it to the site
          footer. Until then it is not reachable at all.
        </p>
      </div>

      <Button type="submit" loading={busy}>
        Save changes
      </Button>
    </form>
  );
}
