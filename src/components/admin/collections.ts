/**
 * Descriptors for the content collections.
 *
 * These mirror the backend's router factory: the nine collections are
 * structurally identical, so one editor is driven by a description of each
 * rather than nine near-duplicate screens that would drift apart.
 */

import { ICON_KEYS } from "@/components/brand/Icon";


export interface FieldSpec {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "choice";
  /** For `choice`. The empty option is added by the editor. */
  options?: readonly string[];
  required?: boolean;
  help?: string;
  /** Hidden from the create/edit form but shown in the list. */
  listOnly?: boolean;
}

export interface CollectionSpec {
  /** URL segment and API path under /admin/content/. */
  path: string;
  title: string;
  description: string;
  /** Field shown as the row's heading. */
  titleField: string;
  /** Field shown beneath it, truncated. */
  subtitleField?: string;
  fields: FieldSpec[];
  addLabel: string;
}

/**
 * The icon shown beside an item on the website.
 *
 * A list rather than free text: the keys are the ones the website actually
 * draws, and a typo used to fall back to a neutral mark with nothing to say it
 * had. Offering the real set means an editor cannot pick one that does not
 * exist, and can see what is available without reading the code.
 */
const ICON_FIELD: FieldSpec = {
  key: "icon_key",
  label: "Icon",
  type: "choice",
  options: ICON_KEYS,
  help: "Shown beside the title on the website. Leave blank for none.",
};

const PUBLISH_FIELD: FieldSpec = {
  key: "is_published",
  label: "Published on the website",
  type: "checkbox",
};

export const COLLECTIONS: Record<string, CollectionSpec> = {
  "core-values": {
    path: "core-values",
    title: "Core Values",
    description: "Shown on the About Us page.",
    titleField: "title",
    subtitleField: "description",
    addLabel: "Add value",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      ICON_FIELD,
      PUBLISH_FIELD,
    ],
  },
  "key-strengths": {
    path: "key-strengths",
    title: "Key Strengths",
    description: "Shown on the homepage and the About Us page.",
    titleField: "title",
    subtitleField: "description",
    addLabel: "Add strength",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      ICON_FIELD,
      PUBLISH_FIELD,
    ],
  },
  milestones: {
    path: "milestones",
    title: "Company Milestones",
    description: "The timeline on the About Us page.",
    titleField: "title",
    subtitleField: "body",
    addLabel: "Add milestone",
    fields: [
      { key: "year_label", label: "Year", type: "text", required: true, help: 'e.g. "2016" or "2020 Onwards".' },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Description", type: "textarea" },
      PUBLISH_FIELD,
    ],
  },
  team: {
    path: "team",
    title: "Team Members",
    description:
      "Publish only people who have approved their details appearing publicly.",
    titleField: "name",
    subtitleField: "designation",
    addLabel: "Add team member",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "designation", label: "Designation", type: "text" },
      { key: "qualifications", label: "Professional qualifications", type: "textarea" },
      { key: "areas_of_expertise", label: "Areas of expertise", type: "textarea" },
      { key: "professional_experience", label: "Professional experience", type: "textarea" },
      {
        key: "photo_s3_key",
        label: "Photograph key",
        type: "text",
        help: "Photographs cannot be uploaded yet — leave this blank for now.",
      },
      PUBLISH_FIELD,
    ],
  },
  qualifications: {
    path: "qualifications",
    title: "Qualifications & Memberships",
    description:
      "Only verified credentials appear publicly — a qualification must be both verified and published.",
    titleField: "name",
    subtitleField: "issuer",
    addLabel: "Add qualification",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "issuer", label: "Issuing body", type: "text" },
      { key: "qualification_type", label: "Type", type: "text" },
      { key: "reference", label: "Reference number", type: "text" },
      {
        key: "is_verified",
        label: "Verified by SmartAWARE",
        type: "checkbox",
        help: "Required before this can appear on the website.",
      },
      PUBLISH_FIELD,
    ],
  },
  achievements: {
    path: "achievements",
    title: "Achievements",
    description:
      "Headline figures shown on the homepage and About Us page. Publish only verified numbers.",
    titleField: "label",
    subtitleField: "value",
    addLabel: "Add achievement",
    fields: [
      { key: "label", label: "Label", type: "text", required: true, help: 'e.g. "Clients served".' },
      { key: "value", label: "Value", type: "text", required: true, help: 'e.g. "500".' },
      { key: "unit", label: "Unit or suffix", type: "text", help: 'e.g. "+".' },
      PUBLISH_FIELD,
    ],
  },
  testimonials: {
    path: "testimonials",
    title: "Testimonials",
    description: "Publish only quotes the client has approved.",
    titleField: "author_name",
    subtitleField: "quote",
    addLabel: "Add testimonial",
    fields: [
      { key: "author_name", label: "Client name", type: "text", required: true },
      { key: "author_company", label: "Company", type: "text" },
      { key: "author_region", label: "Region", type: "text" },
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      PUBLISH_FIELD,
    ],
  },
  "contact-details": {
    path: "contact-details",
    title: "Contact Details",
    description: "Addresses, phone numbers and hours shown on the Contact page.",
    titleField: "label",
    subtitleField: "value",
    addLabel: "Add contact detail",
    fields: [
      { key: "label", label: "Label", type: "text", required: true },
      {
        key: "detail_type",
        label: "Type",
        type: "text",
        required: true,
        help: "address, phone, whatsapp, email, hours, map or department.",
      },
      { key: "value", label: "Value", type: "textarea", required: true },
      PUBLISH_FIELD,
    ],
  },
  "social-links": {
    path: "social-links",
    title: "Social Links",
    description: "Shown on the Contact page.",
    titleField: "platform",
    subtitleField: "url",
    addLabel: "Add link",
    fields: [
      { key: "platform", label: "Platform", type: "text", required: true },
      { key: "url", label: "URL", type: "text", required: true },
      PUBLISH_FIELD,
    ],
  },
};

export const COLLECTION_ORDER = [
  "core-values",
  "key-strengths",
  "milestones",
  "team",
  "qualifications",
  "achievements",
  "testimonials",
  "contact-details",
  "social-links",
] as const;
