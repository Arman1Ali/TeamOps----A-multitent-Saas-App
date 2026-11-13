/**
 * Tailwind CSS v4 is built through PostCSS here instead of through Vite, which
 * is what `@tailwindcss/postcss` replaces in this project.
 *
 * There is no tailwind.config file any more: v4 reads its design tokens from
 * the `@theme` block in src/app/globals.css.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
