import Link from "next/link";

import { ApiStatus } from "@/components/ui/ApiStatus";

/**
 * Homepage skeleton (Chunk 1).
 *
 * The copy below is SmartAWARE's own approved wording from the Website Content
 * Brief — nothing here is invented. It is rendered statically for now and is
 * replaced in Chunk 3 by the same text fetched from the `content_blocks` and
 * `service_categories` tables, at which point editing it needs no deploy.
 *
 * Deliberately absent: client counts, testimonials, certifications and team
 * members. Those are unverified claims about a real firm and are seeded empty
 * for SmartAWARE to supply.
 */

const SERVICE_PREVIEW = [
  "Personal Tax",
  "Limited Company Accounting",
  "Bookkeeping",
  "VAT Services",
  "Payroll",
  "CIS Services",
] as const;

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Established 2016
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Professional UK Tax &amp; Compliance Advisory
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            SmartAWARE is a professional tax, accounting and compliance advisory
            firm serving individuals, businesses and organisations with their
            financial and statutory requirements.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Make an enquiry
            </Link>
            <Link
              href="/services"
              className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-bg"
            >
              Our services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How we help</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Our service categories cover personal tax, company accounting,
          bookkeeping, VAT, payroll, CIS, business registration, tax advisory
          and compliance.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PREVIEW.map((service) => (
            <li
              key={service}
              className="rounded-lg border border-border p-5 transition-colors hover:border-primary"
            >
              <h3 className="font-medium">{service}</h3>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Services shown per region once confirmed for that market.{" "}
          <Link href="/services" className="text-primary underline underline-offset-4">
            View all services
          </Link>
        </p>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Where we work</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Our major work is focused on the United Kingdom, with an
            international presence supporting clients in India, the United Arab
            Emirates and Oman.
          </p>
          <ApiStatus />
        </div>
      </section>
    </>
  );
}
