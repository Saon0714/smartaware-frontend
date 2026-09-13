"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Controls";
import { FormBanner, Label } from "@/components/ui/Field";

/**
 * File picker with the server's limits stated up front.
 *
 * The same rules are enforced server-side; checking here only spares someone
 * uploading 30 MB before being told it was too large.
 */

export const MAX_BYTES = 25 * 1024 * 1024;

const ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.heic,.tif,.tiff,.csv,.txt,.xls,.xlsx,.doc,.docx,.zip";

export function UploadField({
  onUpload,
  busy,
  showDocType = true,
  label = "Choose a file",
}: {
  onUpload: (file: File, docType: "general" | "invoice") => Promise<void>;
  busy: boolean;
  showDocType?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"general" | "invoice">("general");
  const [error, setError] = useState<string | null>(null);

  function choose(selected: File | null) {
    setError(null);
    if (selected && selected.size > MAX_BYTES) {
      setError("That file is larger than 25 MB. Please upload a smaller file.");
      setFile(null);
      return;
    }
    if (selected && selected.size === 0) {
      setError("That file is empty.");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!file) return;
        setError(null);
        try {
          await onUpload(file, docType);
          setFile(null);
          if (inputRef.current) inputRef.current.value = "";
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.");
        }
      }}
    >
      {error && <FormBanner tone="error">{error}</FormBanner>}

      <div>
        <Label htmlFor="file">{label}</Label>
        <input
          ref={inputRef}
          id="file"
          type="file"
          accept={ACCEPT}
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
        />
        <p className="mt-1 text-xs text-muted">
          PDF, images, spreadsheets or documents. Up to 25 MB.
        </p>
      </div>

      {showDocType && (
        <div>
          <Label htmlFor="doc_type">What is this?</Label>
          <Select
            id="doc_type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as "general" | "invoice")}
          >
            <option value="general">A business or tax document</option>
            <option value="invoice">A payment receipt for an invoice</option>
          </Select>
          {docType === "invoice" && (
            <p className="mt-1 text-xs text-muted">
              Receipts are sent straight to the team who reconcile payments.
            </p>
          )}
        </div>
      )}

      <Button type="submit" loading={busy} disabled={!file}>
        Upload
      </Button>
    </form>
  );
}
