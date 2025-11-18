import path from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"
import { defineConfig } from "eslint/config"
import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:@typescript-eslint/recommended-requiring-type-checking"),
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["*.ts", "*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
    },
  },
])