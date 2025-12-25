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
      slug: "topics",
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
          name: "order",
          type: "number",
          required: true,
        },
        {
          name: "difficulty",
          type: "select",
          options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
          ],
          defaultValue: "beginner",
          required: true,
        },
        {
          name: "summary",
          type: "textarea",
        },
        {
          name: "theory",
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
            {
              name: "note",
              type: "text",
            },
            {
              name: "claimIds",
              type: "text",
            },
          ],
        },
        {
          name: "practiceDemo",
          type: "json",
          required: true,
        },
        {
          name: "practiceSteps",
          type: "array",
          fields: [
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
            {
              name: "focusTarget",
              type: "text",
            },
          ],
        },
        {
          name: "practiceTasks",
          type: "array",
          fields: [
            {
              name: "prompt",
              type: "textarea",
              required: true,
            },
            {
              name: "expectedAnswer",
              type: "textarea",
              required: true,
            },
            {
              name: "explanation",
              type: "textarea",
              required: true,
            },
          ],
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
