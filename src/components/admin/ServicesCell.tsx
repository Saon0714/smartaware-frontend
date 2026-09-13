"use client";

import { useState } from "react";

import { ServiceTags } from "@/components/admin/ServiceTags";
import { ServicesEditor } from "@/components/admin/ServicesEditor";
import type { ClientService } from "@/lib/api/admin";

/**
 * The services column, editable in place.
 *
 * Opening the editor expands the row rather than floating a panel over it: the
 * table scrolls sideways inside its own container, which would clip one.
 */
export function ServicesCell({
  clientId,
  services,
  options,
  onChanged,
}: {
  clientId: string;
  services: readonly ClientService[] | null | undefined;
  options: readonly ClientService[];
  onChanged: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="w-64">
        <ServicesEditor
          compact
          clientId={clientId}
          services={services}
          options={options}
          onCancel={() => setOpen(false)}
          onSaved={async () => {
            await onChanged();
            setOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group w-full text-left"
      aria-label={
        (services ?? []).length > 0
          ? `Edit services — currently ${(services ?? []).map((s) => s.name).join(", ")}`
          : "Add services"
      }
    >
      <ServiceTags services={services} limit={3} />
      <span
        aria-hidden
        className="mt-1 block text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        Edit
      </span>
    </button>
  );
}
