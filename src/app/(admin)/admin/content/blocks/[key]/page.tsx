"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createBlockItem, deleteBlockItem, getBlock, listBlockItems, updateBlock,
} from "@/lib/api/admin";

/**
 * Edit one block of page copy, plus the ordered bullet list attached to it.
 *
 * Bodies are plain text with blank lines between paragraphs. The public site
 * renders them as text nodes rather than HTML, so markup typed here would show
 * literally — which is also what stops a compromised editor account turning
 * content into stored XSS.
 */
export default function BlockEditorPage() {
  const params = useParams<{ key: string }>();
  const blockKey = params.key;

  const block = useAsync(() => getBlock(blockKey), blockKey);
  const items = useAsync(() => listBlockItems(blockKey), blockKey);

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newItem, setNewItem] = useState("");

  async function save(form: BlockForm) {
    setBusy(true);
    setSaved(false);
    block.setError(null);
    try {
      await updateBlock(blockKey, {
        title: form.title || null,
        subtitle: form.subtitle || null,
        body: form.body || null,
        is_published: form.is_published,
      });
      setSaved(true);
      await block.reload();
    } catch (err) {
      block.setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!newItem.trim()) return;
    setBusy(true);
    try {
      await createBlockItem({
        block_key: blockKey,
        text: newItem.trim(),
        sort_order: (items.data?.length ?? 0) + 1,
      });
      setNewItem("");
      await items.reload();
    } catch (err) {
      items.setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    setBusy(true);
    try {
      await deleteBlockItem(id);
      await items.reload();
    } catch (err) {
      items.setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  // Render the form only once data exists, so it can initialise from props
  // rather than being synchronised into state by an effect.
  if (block.loading || !block.data) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content" className="hover:text-primary">
          Website Content
        </Link>
        <span aria-hidden> / </span>
        <Link href="/admin/content/blocks" className="hover:text-primary">
          Page Text
        </Link>
        <span aria-hidden> / </span>
        <span>{block.data?.title ?? blockKey}</span>
      </nav>

      <PageHeader
        title={block.data?.title ?? blockKey}
        description={`Section key: ${blockKey}`}
      />

      {block.error && (
        <div className="mt-4">
          <FormBanner tone="error">{block.error}</FormBanner>
        </div>
      )}
      {saved && (
        <div className="mt-4">
          <FormBanner tone="info">Saved. The public site is updated.</FormBanner>
        </div>
      )}

      <BlockFormFields
        initial={{
          title: block.data.title ?? "",
          subtitle: block.data.subtitle ?? "",
          body: block.data.body ?? "",
          is_published: block.data.is_published,
        }}
        busy={busy}
        onSubmit={save}
      />

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold tracking-tight">Bullet list</h2>
        <p className="mt-1 text-sm text-muted">
          Shown beneath the body text. Used by the mission and “why choose us”
          sections.
        </p>

        {items.error && (
          <div className="mt-4">
            <FormBanner tone="error">{items.error}</FormBanner>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {(items.data ?? []).map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
            >
              <span className="text-sm">{item.text}</span>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void removeItem(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={addItem} className="mt-4 flex gap-2">
          <Input
            aria-label="New bullet"
            placeholder="Add a bullet point"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button type="submit" disabled={busy || !newItem.trim()}>
            Add
          </Button>
        </form>
      </section>
    </div>
  );
}

interface BlockForm {
  title: string;
  subtitle: string;
  body: string;
  is_published: boolean;
}

function BlockFormFields({
  initial,
  busy,
  onSubmit,
}: {
  initial: BlockForm;
  busy: boolean;
  onSubmit: (form: BlockForm) => void;
}) {
  const [form, setForm] = useState<BlockForm>(initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="mt-6 max-w-3xl space-y-4"
    >
      <div>
        <Label htmlFor="title">Heading</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="subtitle">Subheading</Label>
        <Input
          id="subtitle"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          rows={12}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted">
          Separate paragraphs with a blank line. Plain text only — HTML is not
          rendered.
        </p>
      </div>
      <Checkbox
        label="Show this section on the website"
        checked={form.is_published}
        onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
      />
      <Button type="submit" loading={busy}>
        Save changes
      </Button>
    </form>
  );
}
