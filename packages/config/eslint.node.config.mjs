import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  // Evidence-service uses `require()` intentionally for CJS-only libs (e.g. @pinata/sdk)
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);


