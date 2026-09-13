import type { Metadata } from "next";

import { Section } from "@/components/content/Prose";
import { getContactPage, type ContactDetail } from "@/lib/api/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with SmartAWARE about tax, accounting and compliance services in the United Kingdom, India, the UAE and Oman.",
};

/**
 * Contact Us.
 *
 * Details are seeded as unpublished placeholders and only appear once
 * SmartAWARE enters real ones, so the page never shows an invented address or
 * phone number as though it were genuine. Until then it explains how to reach
 * the firm via the enquiry form, which arrives in Chunk 5.
 */

const TYPE_LABELS: Record<string, string> = {
  address: "Address",
  email: "Email",
  phone: "Telephone",
  whatsapp: "WhatsApp",
  hours: "Working hours",
  map: "Find us",
  department: "Department",
};

function DetailValue({ detail }: { detail: ContactDetail }) {
  if (detail.detail_type === "email") {
    return (
      <a href={`mailto:${detail.value}`} className="text-primary underline underline-offset-4">
        {detail.value}
      </a>
    );
  }
  if (detail.detail_type === "phone") {
    return (
      <a
        href={`tel:${detail.value.replace(/\s+/g, "")}`}
        className="text-primary underline underline-offset-4"
      >
        {detail.value}
      </a>
    );
  }
  if (detail.detail_type === "whatsapp") {
    return (
      <a
        href={`https://wa.me/${detail.value.replace(/[^0-9]/g, "")}`}
        rel="noopener noreferrer"
        target="_blank"
        className="text-primary underline underline-offset-4"
      >
        {detail.value}
      </a>
    );
  }
  if (detail.detail_type === "map") {
    return (
      <a
        href={detail.value}
        rel="noopener noreferrer"
        target="_blank"
        className="text-primary underline underline-offset-4"
      >
        Open in Google Maps
      </a>
    );
  }
  return <span className="whitespace-pre-line">{detail.value}</span>;
}

export default async function ContactPage() {
  const page = await getContactPage();

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight">Contact Us</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            We support individuals and businesses with tax, accounting and
            compliance requirements across the United Kingdom, India, the UAE
            and Oman.
          </p>
        </div>
      </section>

      <Section>
        {page.details.length > 0 ? (
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {page.details.map((detail) => (
              <div key={detail.id} className="rounded-lg border border-border p-6">
                <dt className="text-sm font-medium text-muted">
                  {TYPE_LABELS[detail.detail_type] ?? detail.label}
                </dt>
                <dd className="mt-2">
                  <DetailValue detail={detail} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="font-medium">Contact details coming soon</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Our published contact details will appear here. In the meantime,
              please use the enquiry form and a member of the team will respond.
            </p>
          </div>
        )}

        {page.social_links.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-muted">Follow us</h2>
            <ul className="mt-3 flex flex-wrap gap-4">
              {page.social_links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-10 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
          The enquiry form arrives in Chunk 5.
        </p>
      </Section>
    </>
  );
}
