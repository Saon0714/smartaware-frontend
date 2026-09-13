import type { Metadata } from "next";

import { IconTile, StrengthMark } from "@/components/brand/Icon";
import { BulletList, Prose, Section } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
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
 *
 * The design does the work the copy cannot: this page is long and largely prose,
 * so each section is given a distinct shape — paired panels, an icon grid,
 * numbered strengths, a checklist — to give the eye somewhere to rest and to
 * make the page scannable rather than a wall of paragraphs. Every word still
 * comes from the database.
 */
export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <>
      <PageHero>
        <h1 className="sa-rise text-4xl font-semibold tracking-tight sm:text-5xl">
          {page.intro?.title ?? "About SmartAWARE"}
        </h1>
        {page.intro?.subtitle && (
          <p className="sa-rise mt-3 text-lg text-accent" style={{ animationDelay: "80ms" }}>
            {page.intro.subtitle}
          </p>
        )}
        <Prose body={page.intro?.body} className="sa-rise mt-6 max-w-3xl" />
      </PageHero>

      {/* --- Vision and mission: the page's two anchor statements, given the
              weight of a pair of feature panels rather than two paragraphs. --- */}
      {(page.vision || page.mission) && (
        <Section>
          <div className="grid gap-6 lg:grid-cols-2">
            {page.vision && (
              <article className="sa-card sa-rise relative overflow-hidden rounded-2xl border border-border bg-bg p-8">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "var(--sa-gradient-brand)" }}
                />
                <IconTile name="target" />
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  {page.vision.title}
                </h2>
                <Prose body={page.vision.body} className="mt-4" />
              </article>
            )}

            {page.mission && (
              <article
                className="sa-card sa-rise relative overflow-hidden rounded-2xl border border-border bg-surface p-8"
                style={{ animationDelay: "80ms" }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "var(--sa-gradient-brand)" }}
                />
                <IconTile name="compass" />
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  {page.mission.title}
                </h2>
                <Prose body={page.mission.body} className="mt-4" />
                <BulletList items={page.mission.items} />
              </article>
            )}
          </div>
        </Section>
      )}

      {/* --- Core values: an icon grid. The icon_key on each row has existed
              since the content model was built and was never rendered. --- */}
      {page.core_values.length > 0 && (
        <Section title="Our core values" tone="surface">
          <ul className="sa-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.core_values.map((value) => (
              <li
                key={value.id}
                className="sa-card group rounded-xl border border-border bg-bg p-6"
              >
                <IconTile name={value.icon_key} className="group-hover:scale-105" />
                <h3 className="mt-4 text-lg font-medium">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {value.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- Key strengths: numbered, so a long list reads as a sequence
              rather than as repetition. --- */}
      {page.key_strengths.length > 0 && (
        <Section title="Our key strengths">
          <ul className="sa-stagger grid gap-5 md:grid-cols-2">
            {page.key_strengths.map((strength, index) => (
              <li
                key={strength.id}
                className="sa-card flex gap-5 rounded-xl border border-border bg-bg p-6"
              >
                <div className="shrink-0">
                  <StrengthMark iconKey={strength.icon_key} index={index} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-medium">{strength.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {strength.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- Our journey --- */}
      {page.milestones.length > 0 && (
        <Section title="Our journey" tone="surface">
          {/* The padding sits on each item, not the list, and each item is
              explicitly relative. The marker previously resolved against the
              list, which only worked while nothing between them was
              transformed — the staggered entrance animation transforms every
              item, and a transformed element becomes the containing block for
              its absolutely positioned descendants, so the marker jumped
              inward onto the year. Anchoring it to the item it belongs to
              makes the position independent of any animation. */}
          <ol className="sa-stagger space-y-8 border-l border-border">
            {page.milestones.map((milestone) => (
              <li key={milestone.id} className="relative pl-8">
                <span
                  aria-hidden
                  className="absolute -left-[7px] top-[3px] h-3.5 w-3.5 rounded-full border-2 border-bg shadow-[var(--sa-shadow-sm)]"
                  style={{ background: "var(--sa-gradient-brand)" }}
                />
                <p className="text-sm font-medium text-primary">{milestone.year_label}</p>
                <h3 className="mt-1 text-lg font-medium">{milestone.title}</h3>
                {milestone.body && (
                  <p className="mt-2 leading-relaxed text-muted">{milestone.body}</p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {page.presence && (
        <Section title={page.presence.title}>
          <Prose body={page.presence.body} className="max-w-3xl" />
        </Section>
      )}

      {page.qualifications.length > 0 && (
        <Section title="Professional qualifications and memberships" tone="surface">
          <ul className="sa-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.qualifications.map((qualification) => (
              <li
                key={qualification.id}
                className="sa-card flex items-start gap-3 rounded-xl border border-border bg-bg p-5"
              >
                <IconTile name="shield" size="h-9 w-9" iconSize="h-4 w-4" />
                <div className="min-w-0">
                  <p className="font-medium">{qualification.name}</p>
                  {qualification.issuer && (
                    <p className="mt-1 text-sm text-muted">{qualification.issuer}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.team.length > 0 && (
        <Section title="Our team">
          <ul className="sa-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.team.map((member) => (
              <li key={member.id} className="sa-card rounded-xl border border-border bg-bg p-6">
                <IconTile name="user" />
                <h3 className="mt-4 text-lg font-medium">{member.name}</h3>
                {member.designation && (
                  <p className="mt-1 text-sm text-accent">{member.designation}</p>
                )}
                {member.qualifications && (
                  <p className="mt-3 text-sm text-muted">{member.qualifications}</p>
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
          <dl className="sa-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {page.achievements.map((item) => (
              <div key={item.id} className="sa-card rounded-xl border border-border bg-bg p-6">
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="sa-gradient-text mt-1 text-4xl font-semibold">
                  {item.value}
                  {item.unit ? <span className="text-2xl">{item.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* --- Data protection: a single wide panel. It is a commitment rather
              than a list of features, so it is given room instead of being
              chopped into cards. --- */}
      {page.data_protection && (
        <Section>
          <article className="sa-card relative overflow-hidden rounded-2xl border border-border bg-surface p-8 sm:p-10">
            <div aria-hidden className="sa-hero-wash opacity-50" />
            <div className="relative grid gap-8 lg:grid-cols-[auto_1fr]">
              <IconTile name="lock" size="h-14 w-14" iconSize="h-7 w-7" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {page.data_protection.title}
                </h2>
                <span aria-hidden className="sa-accent-bar mt-3" />
                <Prose body={page.data_protection.body} className="mt-5 max-w-3xl" />
              </div>
            </div>
          </article>
        </Section>
      )}

      {/* --- Why choose us: the bullets become a checklist, which reads as
              reasons rather than as another paragraph. --- */}
      {page.why_choose_us && (
        <Section title={page.why_choose_us.title} tone="surface">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <Prose body={page.why_choose_us.body} />
              {page.why_choose_us_closing && (
                <Prose body={page.why_choose_us_closing.body} className="mt-6" />
              )}
            </div>
            <ul className="sa-stagger space-y-3">
              {(page.why_choose_us.items ?? []).map((item, index) => (
                <li
                  key={index}
                  className="sa-card flex items-start gap-3 rounded-lg border border-border bg-bg p-4"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "var(--sa-gradient-brand)" }}
                  >
                    ✓
                  </span>
                  <span className="text-sm text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}
    </>
  );
}
