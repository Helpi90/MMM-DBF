import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    files: ["**/*.css"],
    languageOptions: { tolerant: true },
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: { "css/use-baseline": ["error", { available: "newly" }] },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { js, stylistic },
    extends: [importX.recommended, "js/recommended", "stylistic/recommended"],
    rules: {
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "import-x/no-unresolved": ["error", { ignore: ["eslint/config"] }],
    },
  },
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    plugins: { json },
    extends: ["json/recommended"],
    language: "json/json",
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    extends: ["markdown/recommended"],
    language: "markdown/gfm",
  },
]);
