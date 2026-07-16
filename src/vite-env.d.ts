/// <reference types="vite/client" />

/*
 * vite/client provides ambient type declarations for:
 *   - import.meta.env (VITE_* variables, DEV, PROD, MODE, BASE_URL)
 *   - import.meta.hot (HMR API)
 *   - *.css, *.module.css, *.svg, *.png, and other asset imports
 *
 * This satisfies TypeScript 7's `noUncheckedSideEffectImports: true` default,
 * which errors on bare side-effect imports (e.g. `import './styles/global.css'`)
 * that have no type declaration. The vite/client declaration covers all of them.
 */
