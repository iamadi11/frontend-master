import { buildConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import path from "path";

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
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
});
