"use client";

import Link from "next/link";

import { COLLECTIONS, COLLECTION_ORDER } from "@/components/admin/collections";
import { PageHeader } from "@/components/ui/Controls";

/**
 * Content management hub.
 *
 * Everything the public website renders is editable from here, which is the
 * point: the spec treats "no code changes to update content" as an
 * architectural constraint rather than a convenience.
 */
const SECTIONS = [
  {
    href: "/admin/content/blocks",
    title: "Page Text",
    description:
      "Homepage hero, About Us introduction, vision, mission and the data protection statement.",
  },
  {
    href: "/admin/content/form",
    title: "Enquiry Form",
    description: "The fields shown on the website contact form.",
  },
  {
    href: "/admin/content/legal",
    title: "Legal Pages",
    description: "Privacy policy, cookie policy and terms of service.",
  },
];

export default function ContentHubPage() {
  return (
    <div>
      <PageHeader
        title="Website Content"
        description="Edit anything the public site shows. Changes go live without a deploy."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-medium">{section.title}</h2>
            <p className="mt-1 text-sm text-muted">{section.description}</p>
          </Link>
        ))}

        {COLLECTION_ORDER.map((key) => {
          const spec = COLLECTIONS[key]!;
          return (
            <Link
              key={key}
              href={`/admin/content/${key}`}
              className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
            >
              <h2 className="font-medium">{spec.title}</h2>
              <p className="mt-1 text-sm text-muted">{spec.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
