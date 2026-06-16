import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/coverage/**", "**/dist/**", "**/node_modules/**", "**/*.tsbuildinfo"]
  },
  {
    languageOptions: {
      globals: {
        console: "readonly",
        module: "readonly",
        process: "readonly"
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        sourceType: "module"
      }
    }
  }
];
