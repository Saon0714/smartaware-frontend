import type { Metadata } from "next";

import { BulletList, Prose, Section } from "@/components/content/Prose";
import { getAboutPage } from "@/lib/api/content";

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
  title: "About Us",
  description:
    "SmartAWARE is a professional tax, accounting and compliance advisory firm established in 2016, serving clients in the United Kingdom, India, the UAE and Oman.",
};

/**
 * About Us.
 *
 * Section order follows the Website Content Brief. Each block renders only when
 * it has content, so sections SmartAWARE has not filled in — team, credentials,
 * achievements — are simply absent rather than showing empty scaffolding or
 * invented placeholders.
 */
export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {page.intro?.title ?? "About SmartAWARE"}
          </h1>
          {page.intro?.subtitle && (
            <p className="mt-3 text-lg text-accent">{page.intro.subtitle}</p>
          )}
          <Prose body={page.intro?.body} className="mt-6 max-w-3xl" />
        </div>
      </section>

      {page.milestones.length > 0 && (
        <Section title="Our journey">
          <ol className="relative space-y-8 border-l border-border pl-8">
            {page.milestones.map((milestone) => (
              <li key={milestone.id}>
                <span
                  aria-hidden
                  className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-primary"
                />
                <p className="text-sm font-medium text-primary">{milestone.year_label}</p>
                <h3 className="mt-1 text-lg font-medium">{milestone.title}</h3>
                {milestone.body && <p className="mt-2 text-muted">{milestone.body}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {page.presence && (
        <Section title={page.presence.title} tone="surface">
          <Prose body={page.presence.body} className="max-w-3xl" />
        </Section>
      )}

      {(page.vision || page.mission) && (
        <Section>
          <div className="grid gap-12 md:grid-cols-2">
            {page.vision && (
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{page.vision.title}</h2>
                <Prose body={page.vision.body} className="mt-4" />
              </div>
            )}
            {page.mission && (
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{page.mission.title}</h2>
                <Prose body={page.mission.body} className="mt-4" />
                <BulletList items={page.mission.items} />
              </div>
            )}
          </div>
        </Section>
      )}

      {page.core_values.length > 0 && (
        <Section title="Our core values" tone="surface">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.core_values.map((value) => (
              <li key={value.id} className="rounded-lg border border-border bg-bg p-6">
                <h3 className="font-medium">{value.title}</h3>
                <p className="mt-2 text-sm text-muted">{value.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.key_strengths.length > 0 && (
        <Section title="Our key strengths">
          <ul className="grid gap-6 sm:grid-cols-2">
            {page.key_strengths.map((strength) => (
              <li key={strength.id} className="rounded-lg border border-border p-6">
                <h3 className="font-medium">{strength.title}</h3>
                <p className="mt-2 text-sm text-muted">{strength.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.qualifications.length > 0 && (
        <Section title="Professional qualifications and memberships" tone="surface">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.qualifications.map((qualification) => (
              <li key={qualification.id} className="rounded-lg border border-border bg-bg p-5">
                <p className="font-medium">{qualification.name}</p>
                {qualification.issuer && (
                  <p className="mt-1 text-sm text-muted">{qualification.issuer}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.team.length > 0 && (
        <Section title="Our team">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.team.map((member) => (
              <li key={member.id} className="rounded-lg border border-border p-6">
                <h3 className="font-medium">{member.name}</h3>
                {member.designation && (
                  <p className="mt-1 text-sm text-accent">{member.designation}</p>
                )}
                {member.qualifications && (
                  <p className="mt-2 text-sm text-muted">{member.qualifications}</p>
                )}
                {member.areas_of_expertise && (
                  <p className="mt-2 text-sm text-muted">{member.areas_of_expertise}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.achievements.length > 0 && (
        <Section title="Clients served and achievements" tone="surface">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {page.achievements.map((item) => (
              <div key={item.id}>
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                  {item.value}
                  {item.unit ? <span className="text-xl">{item.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {page.data_protection && (
        <Section title={page.data_protection.title}>
          <Prose body={page.data_protection.body} className="max-w-3xl" />
        </Section>
      )}

      {page.why_choose_us && (
        <Section title={page.why_choose_us.title} tone="surface">
          <div className="max-w-3xl">
            <Prose body={page.why_choose_us.body} />
            <BulletList items={page.why_choose_us.items} />
            {page.why_choose_us_closing && (
              <Prose body={page.why_choose_us_closing.body} className="mt-6" />
            )}
          </div>
        </Section>
      )}
    </>
  );
}
