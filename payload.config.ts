import { buildConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  admin: {
    user: "users",
  },
  collections: [
    {
      slug: "users",
      auth: true,
      fields: [
        {
          name: "email",
          type: "email",
          required: true,
          unique: true,
        },
      ],
    },
    {
      slug: "pages",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
        },
        {
          name: "status",
          type: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
          defaultValue: "draft",
          required: true,
        },
        {
          name: "content",
          type: "richText",
          editor: lexicalEditor({}),
        },
      ],
    },
    {
      slug: "resources",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "resourceNumber",
          type: "number",
          required: true,
          unique: true,
        },
        {
          name: "summary",
          type: "textarea",
        },
        {
          name: "body",
          type: "richText",
          editor: lexicalEditor({}),
        },
        {
          name: "references",
          type: "array",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "url",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
    {
      slug: "curriculum_modules",
      fields: [
        {
          name: "order",
          type: "number",
          required: true,
          unique: true,
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "summary",
          type: "textarea",
          required: true,
        },
        {
          name: "readingTimeMins",
          type: "number",
          admin: {
            description: "Estimated reading time in minutes",
          },
        },
        {
          name: "sections",
          type: "array",
          required: true,
          fields: [
            {
              name: "key",
              type: "text",
              required: true,
              admin: {
                description:
                  "Unique key within this module (e.g., 'overview', 'mental_model')",
              },
            },
            {
              name: "heading",
              type: "text",
              required: true,
            },
            {
              name: "kind",
              type: "select",
              required: true,
              options: [
                { label: "Overview", value: "overview" },
                { label: "Prerequisites", value: "prerequisites" },
                { label: "Mental Model", value: "mentalModel" },
                { label: "Core Concepts", value: "coreConcepts" },
                { label: "Design Process", value: "designProcess" },
                { label: "Trade-offs", value: "tradeoffs" },
                { label: "Common Mistakes", value: "mistakes" },
                { label: "Case Study", value: "caseStudy" },
                { label: "Interview Q&A", value: "interviewQA" },
                { label: "References", value: "references" },
              ],
            },
            {
              name: "body",
              type: "richText",
              required: true,
              editor: lexicalEditor({}),
            },
            {
              name: "callouts",
              type: "array",
              fields: [
                {
                  name: "type",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Why It Matters", value: "whyItMatters" },
                    { label: "Heuristic", value: "heuristic" },
                    { label: "Failure Mode", value: "failureMode" },
                    { label: "Checklist", value: "checklist" },
                  ],
                },
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "body",
                  type: "textarea",
                  required: true,
                },
              ],
            },
            {
              name: "embeddedExamples",
              type: "array",
              fields: [
                {
                  name: "exampleId",
                  type: "relationship",
                  relationTo: "animated_examples",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "animated_examples",
      fields: [
        {
          name: "exampleId",
          type: "text",
          required: true,
          unique: true,
          admin: {
            description:
              "Stable key for embedding (e.g., 'foundations-requirements-flow')",
          },
        },
        {
          name: "module",
          type: "relationship",
          relationTo: "curriculum_modules",
          required: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "placementHint",
          type: "select",
          options: [
            { label: "Mental Model", value: "mentalModel" },
            { label: "Core Concepts", value: "coreConcepts" },
            { label: "Trade-offs", value: "tradeoffs" },
            { label: "Case Study", value: "caseStudy" },
          ],
          admin: {
            description: "Where this example is typically placed",
          },
        },
        {
          name: "kind",
          type: "select",
          required: true,
          options: [
            { label: "Timeline 2D", value: "timeline2d" },
            { label: "Flow 2D", value: "flow2d" },
            { label: "Diff 2D", value: "diff2d" },
          ],
        },
        {
          name: "description",
          type: "textarea",
          required: true,
        },
        {
          name: "controls",
          type: "group",
          fields: [
            {
              name: "mode",
              type: "select",
              required: true,
              options: [
                { label: "Stepper", value: "stepper" },
                { label: "Toggle", value: "toggle" },
                { label: "Play", value: "play" },
              ],
              defaultValue: "stepper",
            },
            {
              name: "initialStep",
              type: "number",
              defaultValue: 0,
            },
            {
              name: "toggleLabels",
              type: "array",
              fields: [
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          name: "whatToNotice",
          type: "array",
          required: true,
          minRows: 3,
          maxRows: 6,
          fields: [
            {
              name: "item",
              type: "text",
              required: true,
            },
          ],
        },
        {
          name: "spec",
          type: "json",
          required: true,
          admin: {
            description:
              "Renderer configuration (validated by Zod on frontend)",
          },
        },
      ],
    },
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
});
