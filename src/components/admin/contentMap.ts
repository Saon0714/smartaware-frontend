/**
 * The public website, described page by page.
 *
 * The content screens are organised around the shape of the data — a list of
 * core values, a list of testimonials — because that is how the API is
 * organised. Nobody editing the site thinks that way: they think "the bit
 * under the heading on the About page". This maps one onto the other, so the
 * hub can be read in the order a visitor meets the content.
 *
 * It is also where the sharing is written down. Several collections appear on
 * more than one page and the contact details appear in the footer of every
 * page; they are single rows, so a change reaches all of them at once. That is
 * a useful property and an alarming one if you do not know about it, which is
 * why every entry says where else it shows.
 */

export interface ContentEntry {
  /** Where the editor for this lives. */
  href: string;
  title: string;
  description: string;
  /**
   * Other places the same rows appear. Present means "editing this changes
   * those too" — never a second copy to keep in step by hand.
   */
  alsoOn?: readonly string[];
  /** Managed outside Website Content; the card says so and links across. */
  elsewhere?: boolean;
}

export interface SitePage {
  /** Anchor target and jump-link id. */
  id: string;
  title: string;
  /** The public URL, so an editor can go and look at what they changed. */
  href?: string;
  description: string;
  entries: readonly ContentEntry[];
}

const CONTACT_DETAILS: ContentEntry = {
  href: "/admin/content/contact-details",
  title: "Contact details",
  description:
    "Addresses, phone and WhatsApp numbers, email addresses, opening hours, and the numbers listed per market.",
  alsoOn: ["the footer of every page"],
};

const SOCIAL_LINKS: ContentEntry = {
  href: "/admin/content/social-links",
  title: "Social links",
  description: "The profiles linked under “Follow us”.",
  alsoOn: ["the footer of every page"],
};

const CORE_VALUES: ContentEntry = {
  href: "/admin/content/core-values",
  title: "Core values",
  description: "How SmartAWARE works, one card each.",
};

const KEY_STRENGTHS: ContentEntry = {
  href: "/admin/content/key-strengths",
  title: "Key strengths",
  description: "The numbered strengths list.",
};

const ACHIEVEMENTS: ContentEntry = {
  href: "/admin/content/achievements",
  title: "Achievements",
  description: "The figures — clients served, years in practice.",
};

export const SITE_PAGES: readonly SitePage[] = [
  {
    id: "home",
    title: "Home page",
    href: "/",
    description: "In the order the sections appear down the page.",
    entries: [
      {
        href: "/admin/content/blocks/home_hero",
        title: "Hero",
        description:
          "The main heading, the line beneath it, and the paragraph that also closes the page above “Get in touch”.",
      },
      {
        href: "/admin/services",
        title: "Service cards",
        description: "Taken from the published services for the visitor’s market.",
        elsewhere: true,
      },
      { ...ACHIEVEMENTS, alsoOn: ["the About Us page"] },
      { ...KEY_STRENGTHS, alsoOn: ["the About Us page"] },
      { ...CORE_VALUES, alsoOn: ["the About Us page"] },
      {
        href: "/admin/content/testimonials",
        title: "Testimonials",
        description:
          "The quotes in the carousel. Placeholders are marked as such and clear themselves when Trustpilot is connected.",
      },
    ],
  },
  {
    id: "about",
    title: "About Us page",
    href: "/about",
    description: "In the order the sections appear down the page.",
    entries: [
      {
        href: "/admin/content/blocks/about_intro",
        title: "Introduction",
        description: "The opening heading and the story beneath it.",
      },
      {
        href: "/admin/content/blocks/vision",
        title: "Our Vision",
        description: "The left-hand statement of the pair near the top.",
      },
      {
        href: "/admin/content/blocks/mission",
        title: "Our Mission",
        description: "The right-hand statement, and the commitments listed under it.",
      },
      { ...CORE_VALUES, alsoOn: ["the home page"] },
      { ...KEY_STRENGTHS, alsoOn: ["the home page"] },
      {
        href: "/admin/content/milestones",
        title: "Company milestones",
        description: "The timeline.",
      },
      {
        href: "/admin/content/blocks/our_presence_today",
        title: "Our Presence Today",
        description: "Where SmartAWARE works now.",
      },
      {
        href: "/admin/content/qualifications",
        title: "Qualifications and memberships",
        description: "Professional bodies and credentials. Each is published only once verified.",
      },
      {
        href: "/admin/content/team",
        title: "Team members",
        description: "People, their roles and their expertise. Unpublished until deliberately shown.",
      },
      { ...ACHIEVEMENTS, alsoOn: ["the home page"] },
      {
        href: "/admin/content/blocks/data_protection",
        title: "Commitment to client data protection",
        description: "The panel about GDPR and how client information is held.",
      },
      {
        href: "/admin/content/blocks/why_choose_us",
        title: "Why choose SmartAWARE?",
        description: "The closing argument, and the checklist beside it.",
      },
      {
        href: "/admin/content/blocks/why_choose_us_closing",
        title: "Why choose SmartAWARE? — closing line",
        description: "The paragraph that follows it. No heading of its own on the website.",
      },
    ],
  },
  {
    id: "services",
    title: "Services pages",
    href: "/services",
    description:
      "The services hub and one page per service. These are managed on their own screens, because a service is more than its wording — it decides which markets offer it and what a client can be assigned.",
    entries: [
      {
        href: "/admin/services",
        title: "Services and sub-services",
        description: "Names, descriptions, icons, and which markets each one is offered in.",
        elsewhere: true,
      },
      {
        href: "/admin/regions",
        title: "Markets",
        description:
          "The United Kingdom, India, the UAE and Oman — their names, order and whether each is live.",
        alsoOn: ["the country selector", "the footer of every page"],
        elsewhere: true,
      },
    ],
  },
  {
    id: "contact",
    title: "Contact page",
    href: "/contact",
    description: "In the order the sections appear down the page.",
    entries: [
      CONTACT_DETAILS,
      {
        href: "/admin/content/form",
        title: "Enquiry form",
        description: "The questions asked on the form, and which of them are required.",
      },
      SOCIAL_LINKS,
    ],
  },
  {
    id: "everywhere",
    title: "Every page",
    description:
      "The footer, which is the same on the public site and beneath every page of it.",
    entries: [
      {
        href: "/admin/content/blocks/footer_blurb",
        title: "Footer introduction",
        description: "The short paragraph beside the logo.",
      },
      { ...CONTACT_DETAILS, alsoOn: ["the Contact page"] },
      { ...SOCIAL_LINKS, alsoOn: ["the Contact page"] },
      {
        href: "/admin/content/legal",
        title: "Legal pages",
        description:
          "Privacy policy, cookie policy and terms of service. Each is linked from the footer once published, and unpublished ones are not linked at all.",
      },
    ],
  },
];

/** Every entry that opens a content block, keyed by the block's name. */
const BLOCK_ENTRIES: Record<string, { entry: ContentEntry; page: SitePage }> = {};
for (const page of SITE_PAGES) {
  for (const entry of page.entries) {
    const key = entry.href.startsWith("/admin/content/blocks/")
      ? entry.href.slice("/admin/content/blocks/".length)
      : null;
    if (key && !BLOCK_ENTRIES[key]) BLOCK_ENTRIES[key] = { entry, page };
  }
}

/** What to call a block on screen, so no stored key has to be shown. */
export function blockTitle(key: string): string | null {
  return BLOCK_ENTRIES[key]?.entry.title ?? null;
}

/** The page a block belongs to, for breadcrumbs back to the right group. */
export function blockPageOf(key: string): { id: string; title: string } | null {
  const found = BLOCK_ENTRIES[key];
  return found ? { id: found.page.id, title: found.page.title } : null;
}

/** Where a block appears, written as a sentence. */
export function blockPlacement(key: string): string | null {
  const found = BLOCK_ENTRIES[key];
  if (!found) return null;
  return `${found.entry.description} Shown on the ${found.page.title.toLowerCase()}.`;
}
