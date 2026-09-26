# Architect 2.0

Source of truth: [architecture.md](../architecture.md). Product requirements: [prd.md](../prd.md). Build order: [implementation_plan.md](../implementation_plan.md). Cite the section a change implements.

## Stack

Next.js 16 (App Router, `proxy.ts` instead of `middleware.ts`), TypeScript, Tailwind v4, Supabase, Vercel. All LLM work uses Groq. Libraries are listed in architecture.md section 7. Do not add a dependency without updating that list.

## Layout

This folder is phase 4: landing, the AI Consultant, templates, marketplace, usage, settings, and the remaining screens from the feature matrix. Phase 3 stays in the sibling folder `phase 3 - github import deploy/`. Do not add the next phase's work in here.

Shared UI that this phase does not change stays linked from `../common`. Screens this phase replaces — Home, landing, onboarding, templates, marketplace, usage, and settings — are real files here. Docs and `stitch_design/` stay in the parent folder.

The only env file is `../.env`. Never add an env file in this folder. `next.config.ts` loads the parent file. `.env.example` is next to it.

## Rules

- Server-only secrets. No `NEXT_PUBLIC_` prefix on Groq, Vercel or the Supabase secret key. `lib/ai`, `lib/github` and `lib/deploy` import `server-only`.
- Every route checks the session, validates the body with zod, and checks project membership.
- Every new table has row level security and is added to `supabase/migrations/`.
- Components are `PascalCase`. Routes are `kebab-case`.
- Visible copy goes in `lib/i18n` once that module covers the screen. Until then, keep copy in the component and match prd.md section 9.
- Colours, type and radius come from `app/globals.css` (`architecture.md` section 15.2). Do not copy colours out of `stitch_design/`.
- One filled accent button per screen. Stage badges are neutral; green is only for Live.

## Commands

`pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e`

`supabase db push` and `supabase gen types typescript --linked > lib/supabase/database.types.ts` once the project exists.

## Work split

One phase, or one feature-matrix row, per session. Run that phase's test-and-fix round in implementation_plan.md section 6.0 before starting the next phase. Commit messages name the section, for example `feat(p0): workspace shell (§3)`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
