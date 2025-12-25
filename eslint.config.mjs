// ESLint flat config for Next.js 16
// Note: next lint has a known issue with paths containing spaces
// Use `npm run lint:direct` as an alternative
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "build/**", "*.config.*"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
