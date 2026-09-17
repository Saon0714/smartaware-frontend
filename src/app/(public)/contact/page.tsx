import type { Metadata } from "next";

import { Section } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
import { IconTile } from "@/components/brand/Icon";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getContactPage, type ContactDetail } from "@/lib/api/content";
import { enquiryContext } from "@/lib/enquiry/prefill";
import { resolveRegion } from "@/lib/region/server";

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

/** The glyph each kind of detail carries, matching the card grids elsewhere. */
const TYPE_ICONS: Record<string, string> = {
  address: "map-pin",
  email: "mail",
  phone: "phone",
  whatsapp: "whatsapp",
  hours: "clock",
  map: "map",
  department: "globe",
};

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
      <a
        href={`mailto:${detail.value}`}
        className="font-medium text-primary hover:underline"
      >
        {detail.value}
      </a>
    );
  }
  if (detail.detail_type === "phone") {
    return (
      <a
        href={`tel:${detail.value.replace(/\s+/g, "")}`}
        className="font-medium text-primary hover:underline"
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
        className="font-medium text-primary hover:underline"
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
        className="sa-arrow inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
      >
        Open in Google Maps
        <span className="sa-arrow-mark" aria-hidden>
          →
        </span>
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
  const [page, params, { regions, active }] = await Promise.all([
    getContactPage(),
    searchParams,
    resolveRegion(),
  ]);

  // The new-business numbers are one per market and belong together, captioned
  // by the country they serve. Mixed into the grid above they read as four
  // unexplained phone numbers.
  const general = page.details.filter((d) => d.detail_type !== "department");
  const byMarket = page.details.filter((d) => d.detail_type === "department");
  const regionById = new Map(regions.map((region) => [region.id, region]));

  // Set when the visitor arrived from an "Enquire about this" button on a
  // service page. Everything it fills in stays editable.
  const context = enquiryContext(params);
  const prefilled = Boolean(context.service || context.subService || context.country);

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
        {general.length > 0 ? (
          /* One panel, and the items inside carry no border of their own.
             Six separate cards drew a box around the empty space under every
             one-line value — an address runs to several lines and an email to
             one, and the outline is what made that read as half-finished. */
          <div className="sa-card rounded-2xl border border-border bg-bg p-2 sm:p-4">
            {/* Columns rather than a grid. A grid makes every cell in a row as
                tall as the tallest, so a five-line address left a void beside
                the one-line email and telephone. Flowed columns give each item
                only the height it needs. */}
            <dl className="gap-x-8 sm:columns-2 lg:columns-3">
              {general.map((detail) => (
                <div
                  key={detail.id}
                  className="mb-1 flex break-inside-avoid items-start gap-4 rounded-xl p-4 transition-colors duration-200 hover:bg-surface"
                >
                  <IconTile
                    name={TYPE_ICONS[detail.detail_type]}
                    size="h-10 w-10"
                    iconSize="h-[18px] w-[18px]"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      {TYPE_LABELS[detail.detail_type] ?? detail.label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed">
                      <DetailValue detail={detail} />
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="font-medium">Contact details coming soon</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Our published contact details will appear here. In the meantime,
              please use the enquiry form and a member of the team will respond.
            </p>
          </div>
        )}

        {byMarket.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              New business enquiries
            </h2>
            <span aria-hidden className="sa-accent-bar mt-3" />
            <p className="mt-4 max-w-2xl text-muted">
              Speak to someone in your market directly.
            </p>

            <ul className="sa-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {byMarket.map((detail) => {
                const market = detail.region_id
                  ? regionById.get(detail.region_id)
                  : undefined;
                const here = market && market.slug === active?.slug;
                return (
                  <li
                    key={detail.id}
                    className={`sa-card relative overflow-hidden rounded-xl border p-5 ${
                      here ? "border-primary/40 bg-bg" : "border-border bg-bg"
                    }`}
                  >
                    {here && (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-1"
                        style={{ background: "var(--sa-gradient-brand)" }}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <IconTile
                        name="globe"
                        size="h-9 w-9"
                        iconSize="h-4 w-4"
                      />
                      <p className="text-sm font-medium">
                        {market?.name ?? detail.label}
                      </p>
                    </div>
                    <a
                      href={`tel:${detail.value.replace(/\s+/g, "")}`}
                      className="mt-4 block text-lg font-medium text-primary hover:underline"
                    >
                      {detail.value}
                    </a>
                    {here && (
                      <p className="mt-1 text-xs text-muted">Your selected market</p>
                    )}
                  </li>
                );
              })}
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
              <EnquiryForm context={context} />
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
