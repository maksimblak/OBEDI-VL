# Repository Guidelines

## Project Structure & Module Organization
- `index.html`: app shell (Tailwind via CDN + theme config) and `#root` mount point.
- `index.tsx`: React entrypoint that mounts `App`.
- `App.tsx`: main UI composition and app-level state.
- `components/`: React UI components (PascalCase filenames, e.g. `components/CheckoutModal.tsx`).
- `services/`: side-effect and integration code (e.g. `services/geminiService.ts`, `services/authService.ts`).
- `data.ts`: mock menu data, image/video URLs.
- `types.ts`: shared TypeScript types.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server (configured for port `3000` in `vite.config.ts`).
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally.
- `npx tsc -p tsconfig.json`: type-check only (tsconfig has `noEmit: true`).

## Coding Style & Naming Conventions
- Language: TypeScript + React (TSX). Keep formatting consistent with surrounding code (indentation, single quotes, semicolons).
- Styling: prefer Tailwind utility classes; update the inline Tailwind theme in `index.html` when introducing new design tokens.
- Organization: keep UI logic in `components/` and API/IO in `services/`. Reuse types from `types.ts` rather than duplicating shapes.

## Testing Guidelines
- No automated test runner is configured yet (there is no `npm test`). For changes, run `npx tsc -p tsconfig.json` and `npm run build`, then do a quick manual smoke test of the main flows (menu, cart, checkout, AI chef, delivery zone check).
- If you introduce tests, keep them close to the code they cover (e.g. `components/Foo.test.tsx`) and add a corresponding script in `package.json`.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits in Git history: `feat(scope): ...`, `fix: ...` (scopes are optional and often match a feature/component, e.g. `upsell`, `CorporateOffer`, `AIChef`).
- PRs should include: a short summary of user-visible changes, screenshots for UI updates, linked issues (if any), and notes on config/env changes. Avoid “format-only” PRs unless agreed in advance.

## Security & Configuration Tips
- Store secrets in `.env.local` (ignored by Git). Required: `GEMINI_API_KEY=...`.
- Secrets are consumed server-side by `server.mjs` (API proxy). Avoid exposing credentials in client bundles.
