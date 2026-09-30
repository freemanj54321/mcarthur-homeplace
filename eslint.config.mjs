import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // MCA-36 / MCA-150: eslint-config-next already registers jsx-a11y but enables
  // only a few rules; turn on the plugin's full recommended set.
  {
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Card-style radio labels (DonateForm) nest their text one level deeper
      // than the default depth of 2; they are correctly associated.
      "jsx-a11y/label-has-associated-control": ["error", { depth: 3 }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated test coverage output.
    "coverage/**",
  ]),
]);

export default eslintConfig;
