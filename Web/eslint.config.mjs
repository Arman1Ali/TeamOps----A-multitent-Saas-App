import tseslint from "typescript-eslint";

/**
 * Plain TypeScript linting, no framework plugins and no clever rules.
 *
 * The two settings that are worth explaining:
 *  * .next/ holds generated files, so it is ignored;
 *  * an unused variable named _something is deliberate, and therefore allowed.
 */
export default tseslint.config(
  { ignores: [".next/", "node_modules/", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
