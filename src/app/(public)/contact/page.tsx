import type { Metadata } from "next";

import { Section } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getContactPage, type ContactDetail } from "@/lib/api/content";
import { enquiryPrefill } from "@/lib/enquiry/prefill";

/**
 * Rendered per request rather than prerendered at build time.
 *
 * These pages are assembled entirely from the API, so static generation would
 * make every build — including CI builds, preview deploys and rollbacks —
 * depend on a reachable backend, and fail outright when it is not. It would
 * also mean a content edit waited for the revalidation window before appearing.
 *
 * Server rendering still delivers complete HTML to crawlers, which is what the
 * SEO requirement actually needs. If traffic later justifies caching, a CDN
 * cache header or a move back to ISR is a small, isolated change.
 */
export const dynamic = "force-dynamic";

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
 * phone number as though it were genuine. The enquiry form works regardless,
 * so a visitor always has a way to make contact.
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

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [page, params] = await Promise.all([getContactPage(), searchParams]);

  // Set when the visitor arrived from an "Enquire about this" button on a
  // service page. Everything it fills in stays editable.
  const prefill = enquiryPrefill(params);
  const prefilled = Object.keys(prefill).length > 0;

  return (
    <>
      <PageHero>
        <h1 className="sa-rise text-4xl font-semibold tracking-tight sm:text-5xl">
          Contact Us
        </h1>
        <p
          className="sa-rise mt-4 max-w-2xl text-lg text-muted"
          style={{ animationDelay: "80ms" }}
        >
          We support individuals and businesses with tax, accounting and
          compliance requirements across the United Kingdom, India, the UAE and
          Oman.
        </p>
      </PageHero>

      <Section>
        {page.details.length > 0 ? (
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {page.details.map((detail) => (
              <div key={detail.id} className="sa-card rounded-lg border border-border p-6">
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

        <div id="enquiry" className="mt-12 grid scroll-mt-24 gap-10 lg:grid-cols-[3fr_2fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Make an enquiry</h2>
            <p className="mt-2 text-muted">
              Tell us what you need and a member of the team will respond.
            </p>
            {prefilled && (
              <p className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted">
                We have filled in what you were looking at. Change anything
                below before you send it.
              </p>
            )}
            <div className="mt-6">
              <EnquiryForm prefill={prefill} />
            </div>
          </div>

          <aside className="sa-card rounded-lg border border-border bg-surface p-6">
            <h3 className="font-medium">What happens next</h3>
            <ol className="mt-3 space-y-3 text-sm text-muted">
              <li>1. We review your enquiry and match it to the right specialist.</li>
              <li>2. A member of the team contacts you to discuss your requirements.</li>
              <li>3. If we proceed, you receive a portal invitation by email.</li>
            </ol>
            <p className="mt-4 text-xs text-muted">
              SmartAWARE Client Portal accounts are created by invitation only.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
