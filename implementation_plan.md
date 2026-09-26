# Architect 2.0 — Implementation plan

Build order for Architect 2.0, written to be executed task by task in Cursor or Claude Code.

It connects three sources:

| Source | Role |
|---|---|
| [assignment.md](assignment.md) | What is judged: design/UX first, feature coverage second, working functionality as plus points |
| [prd.md](prd.md) | Product requirements: goals, users, requirement IDs with acceptance criteria, success metrics |
| [architecture.md](architecture.md) | Source of truth for behaviour, data, APIs and tokens. Every task cites a section (§) |
| `stitch_design/` (from [stitch_prompt.md](stitch_prompt.md)) | Layout reference for each screen. Take the layout, not the colours, copy or flaws |

## Contents

1. [Ground rules](#1-ground-rules)
2. [Screen-to-architecture map](#2-screen-to-architecture-map)
3. [Build notes per screen](#3-build-notes-per-screen)
4. [Surfaces with no Stitch screen](#4-surfaces-with-no-stitch-screen)
5. [Stitch content to drop](#5-stitch-content-to-drop)
6. [Phases and tasks](#6-phases-and-tasks)
7. [Demo data](#7-demo-data)
8. [Definition of done](#8-definition-of-done)
9. [Cut list if time runs short](#9-cut-list-if-time-runs-short)
10. [Accounts and third-party services](#10-accounts-and-third-party-services)

---

## 1. Ground rules

### 1.1 Design

- **Tokens come from §15.2**, not from the Stitch HTML. Stitch generated a Material palette (`#3525cd`, lavender `#faf8ff`), a broken radius scale and shadows; none of that is copied.
- **Fonts:** Inter and JetBrains Mono through `next/font/google`, which self-hosts them. That matters because the workspace routes send COOP/COEP headers (§9.2), which block third-party font CSS.
- **One app shell outside a project:** 64px `AppSidebar` (Home, Templates, Marketplace, Import, Usage, Settings; mode switch and avatar at the bottom) and a top bar with only the ⌘K search field and notifications. Home's Stitch screen is the reference. Templates, Settings and Usage were generated with a horizontal top nav; rebuild them inside the sidebar shell.
- **One workspace shell inside a project:** one 56px `TopBar` (logo, project name, `StageStepper`, mode switch, presence, Share, one primary action), then chat and canvas, then `StatusBar`. The Plan screen is the reference. No second stepper, breadcrumb bar or environment bar.
- **Logo:** 32px `#4F46E5` tile, 10px radius, white "A", then "Architect". One `Logo` component used everywhere.
- **One filled accent button per screen.** Repeated actions in lists ("Use template", "Import") are outline buttons.
- **Stage badges** are neutral (`surface-2` background). Green only for Live, red only for Error, yellow only for warnings.
- **Every data surface ships four states:** empty, loading, error, success (§18.5).

### 1.2 Copy facts

All visible text uses these, whatever the Stitch screen says:

- Model: "Groq · gpt-oss-120b" (router and chat show `gpt-oss-20b` where relevant, §8.1).
- Generated apps: Vite + React + TypeScript; agent framework "Default". Other frameworks only add scaffold files under `agents/<name>/` (§28).
- Region: Mumbai (`bom1` / `ap-south-1`). Deploys are static Vercel sites.
- Deployed-app key: `VITE_ARCHITECT_KEY`, base URL `VITE_ARCHITECT_URL` (§28).
- Import limits: 500 files, 5 MB (§17).
- No SOC2, region-count, Anycast or edge-cache claims.
- Plain language in Simple mode.

All copy lives in `lib/i18n/en.ts` (§24).

### 1.3 Engineering

- **One folder per phase.** The folder name is the phase number and what that phase covers: `phase 0 - home workspace shell/`, then `phase 1 - plan agents code/`, `phase 2 - preview developer tools/`, `phase 3 - github import deploy/`, `phase 4 - coverage polish/`, `phase 5 - ship/`. Each contains that phase's Next.js app (`app/`, `components/`, `lib/`, `supabase/` as in §7). Docs and `stitch_design/` stay in the repository root. A later phase starts as a copy of the previous phase's folder, then adds its own work. Do not put the app in the repository root, and do not put two phases in one folder.
- **Shared code lives in `common/`.** UI primitives, the shell, auth, session, projects, design tokens (`common/styles/tokens.css`), and the database migration are written once. A phase imports those modules through the `@/` paths in its tsconfig, and still supplies its own `lib/types` and `lib/demo/store`. Next.js only discovers routes inside the phase's `app/` folder, so those route files stay there. Code that only one phase needs stays in that phase folder.
- **One env file, at the repository root.** All keys go in `Lyzr AI/.env` (section 10.4). Never create env files inside a phase folder or anywhere else: no env file next to a phase's `package.json`, no `supabase/.env`, no `scripts/.env`. The phase app loads the root file from `next.config.ts`. Tools that run outside Next.js (Supabase CLI, Playwright, Vitest, `scripts/*.ts`) load `../.env` when run from a phase folder. `.env.example` sits next to `.env` with names only.
- `.gitignore` ignores `.env*` except `.env.example`. Tailwind v4 skips `stitch_design/` (`@source not "../../stitch_design";` in the phase's `app/globals.css`), so the mockups' classes don't end up in the CSS bundle.
- The repository folder name contains a space and capitals, which npm package names don't allow. The repo is one pnpm workspace (`pnpm-workspace.yaml`, hoisted `node_modules`) so `common/` and the phases resolve the same React and the same libraries. Package names are unique: `architect-2-phase-0`, `architect-2-phase-1`, `architect-2-phase-2`, `architect-2-phase-3`, `architect-2-phase-4`, and `architect-2` for the current phase. `@architect/common` holds the shared dependencies.
- Stack, folders and libraries: §7. No new dependency without adding it to §7.
- Every route: session check, zod body validation, membership check (§11). Secrets server-only (§13).
- Every table has RLS (§10.3). Migrations only through `supabase/migrations/` (§25).
- Commit per task: `feat(p1): plan doc streaming (§8.2, screen 5)`.
- Verify per task: `pnpm typecheck && pnpm lint`, plus the manual check listed in the task.
- Verify per phase: the test-and-fix round in section 6.0. No phase starts until the previous round has no open S1 or S2 bugs.

---

## 2. Screen-to-architecture map

Screen numbers match `stitch_prompt.md`. "Missing" means no Stitch export exists; section 4 says what to build it from.

| # | Stitch screen (`stitch_design/…`) | Route / state | Main components (§7, §18) | APIs (§11) | Status (§5) | Phase |
|---|---|---|---|---|---|---|
| 1 | `marketing_landing_page` | `/` (logged out) | `marketing/Hero`, `HowItWorks`, `BuiltForBoth`, `ProductFrame` | — | Real (static) | P4 |
| 2 | `sign_in` | `/login` | `LoginCard`, `OAuthButtons`, `MagicLinkForm` | Supabase Auth | Real | P0 |
| 2b | Missing | `/login` after magic link sent | `LoginCard` "check your email" state | Supabase Auth | Real | P0 |
| 3 | `ai_consultant_onboarding` | `/onboarding` | `ConsultantWizard`, `IdeaCard` | `POST /api/consultant` | Real | P4 |
| 4 | `home_simple_mode` | `/home` | `PromptBox`, `PlusMenu`, `IdeaRow`, `TemplateStrip`, `RecentProjects` | `POST /api/projects` | Real | P0 |
| 4a | `home_first_time_empty_state` | `/home` with no projects | `RecentProjects` empty state, `HowItWorksCard` | — | Real | P0 |
| 4b | Missing | `/home`, Developer mode | `ImportCard`, `DevStarters`, commit line on `ProjectCard` | `GET /api/github/repos` | Real | P4 |
| 5 | `travel_planner_stage_1_plan` | `/p/[id]?tab=plan` | `ChatPanel`, `PlanDoc`, `PlanSection`, `ApproveBar` | `POST /api/chat`, `/api/plan`, `/api/plan/approve` | Real | P1 |
| 6 | `travel_planner_stage_2_agents` | `/p/[id]?tab=agents` | `AgentGraph`, `AgentDrawer`, `FrameworkPicker` | `POST /api/agents/design`, `PUT /api/agents/[id]` | Real (runtime Partial) | P1 |
| 6b | Missing | `AgentDrawer` Test tab | `AgentTestConsole`, trace `StepCard`s | `POST /api/agents/run` | Partial | P1 |
| 7 | `travel_planner_stage_3_build` | `/p/[id]?tab=preview`, building | `StepCard`, `FileOpCard`, `PreviewSkeleton`, `StatusBar` | `POST /api/generate` (build) | Real | P1 + P2 |
| 8 | `travel_planner_stage_3_preview_ready` | `/p/[id]?tab=preview`, ready | `PreviewFrame`, `DeviceToolbar`, `ElementPicker`, `ConsoleDrawer` | `POST /api/generate` (change) | Real / Partial | P2 |
| 9 | `travel_planner_developer_mode_code` | `/p/[id]?tab=code` | `FileTree`, `Editor`, `DiffView`, `Terminal` | `GET/PUT /api/projects/[id]/files` | Real | P2 |
| 10 | `travel_planner_build_runtime_error_auto_fix` | Preview with runtime error, fixing | `ErrorOverlay`, `ErrorCard` (fixing), `ConsoleDrawer` | `POST /api/generate` (fix) | Real | P2 |
| 10b | Missing | Fix attempts exhausted | `ErrorCard` (exhausted) | `POST /api/projects/[id]/restore` | Real | P2 |
| 11 | `travel_planner_developer_mode_git` | `/p/[id]?tab=git`, connected | `GitPanel`, `BranchSelect`, `CommitList` | `POST /api/github/push`, `GET /api/github/branches` | Real / Partial | P3 |
| 11b | Missing (side panel of 11) | `/p/[id]?tab=git`, not connected | `GitEmptyState` | Supabase `linkIdentity` | Real | P3 |
| 12 | `deploy_flow_step_1_address_pre_flight` | `/p/[id]/deploy`, step 1 | `DeployWizard`, `DomainForm`, `PreflightChecklist` | `GET /api/deploy/check` | Partial | P3 |
| 12 | `deploy_flow_step_2_options_marketplace` | `/p/[id]/deploy`, step 2 | `DeployOptions` | — | Dummy | P3 |
| 12b | Missing | `/p/[id]/deploy`, step 3 | `DeployConfirm` | `POST /api/deploy` | Real | P3 |
| 13 | `deploy_status_travel_planner` | `/p/[id]/deploy`, status | `DeployStatus`, `DeployLogs`, `DeploymentList`, `QrShare` | `GET /api/deploy/[id]/status`, Realtime | Real | P3 |
| 13b | Missing | Deploy failed | `DeployStatus` error state | `POST /api/generate` (fix, with build logs) | Real | P3 |
| 14 | `import_project` | `/import` | `ImportOptions`, `RepoList`, `ImportProgress` | `GET /api/github/repos`, `POST /api/github/import`, `/api/import/zip` | Real | P3 |
| 15 | `travel_planner_version_history_rollback` | `/p/[id]/history` | `SnapshotTimeline`, `SnapshotPreview`, `DiffView`, `RestoreDialog` | `POST /api/projects/[id]/restore` | Real | P2 |
| 16 | `usage_billing` | `/usage` | `KpiCard`, `UsageCharts`, `UsageTables` | `GET /api/usage` | Partial | P4 |
| 17 | `settings_integrations_model_keys` | `/settings` (sub-nav) | `SettingsNav`, `IntegrationCard`, `McpServerForm`, `ModelKeys` | — (dummy), BYOK stored encrypted | Real / Dummy | P4 |
| 18 | `templates_marketplace` | `/templates`, `/marketplace` | `TemplateCard`, `CategoryFilter`, `MarketplaceCard` | `POST /api/projects {template}`, `POST /api/marketplace/[id]/clone` | Real / Dummy | P4 |
| 19 | `mobile_workspace_chat`, `mobile_workspace_preview` | `/p/[id]` below 768px | `MobileWorkspaceTabs` | — | Real | P4 |
| 20 | `component_state_sheet` | Cross-cutting | `GuestBanner`, empty states, `RateLimitCard`, `Toaster`, skeletons | — | Real | P0 + P4 |
| 21 | Missing | ⌘K anywhere in `(app)` and `/p` | `CommandPalette` (`cmdk`) | Projects query | Real | P4 |
| 22 | Missing | Share button in `TopBar` | `ShareModal`, presence avatars | Realtime presence (§20) | Partial | P4 |

---

## 3. Build notes per screen

What to take from each Stitch screen, and what to leave out. Items under "Leave out" are flaws found in the design review.

**1. Landing.** Take: hero prompt box with example chips, product frame, "Try without an account". Leave out: "Next.js + FastAPI" and "LangGraph" labels in the product frame; use "Vite + React app" and "Default agent runtime". Add the "How it works" and "Built for both" sections from prompt 1, plus the "Powered by Groq" footer.

**2 / 2b. Sign in.** Take: split layout, pipeline preview card, OAuth + magic link card. Leave out: "View State" toggle, "SOC2 Type II Certified", "Cluster us-east-1". Sign-in rendered in the system font; use Inter. The email-sent state is the same card with a mail icon, "Check your email", "Open mail app", and "Resend in 30s".

**3. Onboarding.** Take: multi-select tiles, live "Ideas for you" panel, "Continue" as the single primary. Leave out: "Claude 3.5 Sonnet", "engineering hours". Wire to `POST /api/consultant` (`gpt-oss-20b`, §8.1); "Use this" fills the Home prompt.

**4 / 4a. Home.** Take everything: this is the best screen and the reference for the outer shell. Fix: chips and metadata rendered in a serif font because JetBrains Mono wasn't loaded. The first-time version keeps its "Your projects will appear here" card and "How an app gets built" explainer.

**5. Plan.** Take: chat plus document layout, numbered sections, sticky approve bar ("Looks good? Agents are designed next."). Leave out: jargon in the summary ("quadratic polling", "split-ledger settlement graphs") and "Claude 3.5 Sonnet". Sections stream in as `data-plan-section` parts (§19.3); each section is editable inline.

**6 / 6b. Agents.** Take: three columns (chat, graph, drawer), manager node on top, tool and knowledge chips, framework radio cards. Fix: the "Selected Inspector" tag covers the node title; drop the breadcrumb bar under the top bar; "Tavily" becomes "Groq web search". The Test tab is new (section 4).

**7. Build in progress.** Take: stage step cards with file-op rows, skeleton preview with install progress pill, status bar with tokens and snapshot. Leave out: the second stepper bar and second mode switch; "Claude 3.5 Sonnet". Batches follow §27.6: Layout and theme, Pages, Components, Wiring agents, Checking.

**8. Preview ready.** Take: element inspector with the component path label, composer "Inspecting: SearchBar.tsx" chip, device toggles, quick action chips. Leave out: the disabled top-bar Deploy next to an enabled "Deploy to Cloud" (keep one "Deploy" as the primary), and hotlinked stock photos. The demo app uses bundled images.

**9. Developer code.** Take: file tree, tabs, editor, right "Changes in v8" diff pane with AI rationale. Fix: the editor renders lines 1–4 in a separate column; use Monaco. The mode switch must show Developer. Status bar reads "Groq · gpt-oss-120b · Vite 5 · Snapshot v8". Tabs: Preview, Plan, Agents, Code, Terminal, Database, Env, Git (§2).

**10 / 10b. Error and self-heal.** Take: Vite-style overlay with code frame and "Did you mean", console drawer with per-error "Fix", quick patches. Fix: the screen shows "attempt 1 of 3" and "Couldn't fix after 3 passes" at once; these are two states. Remove the extra top-bar error pill. Max 3 attempts (§9.3); "Restore last good version" uses `snapshots.healthy`.

**11 / 11b. Git.** Take: connected header card, auto-commit toggle, "2 changes not pushed" banner, commit list with snapshot badges. Leave out: the "Variant: Not Connected" side panel (it becomes 11b), "SSH & GPG Keys" card, "GitLab, Bitbucket" link. Only "Push" is filled. Add the states from §27.7: connecting, no repo yet, conflict, token expired.

**12 / 12b. Deploy wizard.** Take: modal with 3-step stepper, `.vercel.app` suffix with availability, pre-flight checklist, step 2 toggles. Fix: the missing variable is `VITE_ARCHITECT_KEY` with "Generate key" (rotates `projects.public_key`); label icon-only buttons. Pre-flight runs `vite build` in the WebContainer (§27.8).

**13 / 13b. Deploy status.** Take: Queued / Building / Ready track, "Your app is live" card, URL with copy, QR code, share buttons, deployments list with Redeploy / Promote, build logs. Leave out: Anycast, 18 regions, edge TTFB, cache hit ratio, "LangGraph edge runtime". The failed state shows logs and "Fix with AI", and notes that the previous live version keeps running.

**14. Import.** Take: two option cards, repo list with branch and root directory on the selected row, progress card (Fetching files, Detecting framework, Writing plan, Starting preview). Leave out: "ACTIVE SELECTION" tag, "edge-us-east-1", "AST pipeline". Zip limit is 5 MB / 500 files. Unsupported frameworks open in code-only mode with a banner (§4.2).

**15. Version history.** Take: snapshot stream with healthy / error markers, selected version with preview, file list and unified diff, "Restoring creates a new version. Nothing is deleted." Fix: use the workspace top bar with no stage highlighted and a "History" title.

**16. Usage.** Take: quota bar, four KPI cards, tokens-by-stage stacked chart (Plan, Agents, Codegen, Fix, Agent runs), by-project and by-agent tables. Fix: sidebar shell; chart colours are accent shades plus success and warning.

**17. Settings.** Take: sub-nav (Profile, Mode, Connected accounts, Model keys, Integrations, Danger zone), integration card grid, MCP card. Leave out: "Anthropic Standard" badge, "ENV: production-us-east", "Audit logs". Model keys: Groq real (encrypted), OpenAI and Anthropic stored, marked "Coming soon" for use.

**18. Templates and Marketplace.** Take: category filter, mini UI previews on cards, agent count. Fix: sidebar shell; one tab control (not two); "Use template" as an outline button; stack line "Vite + React · N agents". Drop "AutoGPT + Fastify" style labels.

**19. Mobile.** Take: Chat / Preview tabs, stage indicator "Build 3/4", step cards, floating Preview pill, bottom action bar on preview. Fix: title is the project name, not "Terminal Console"; one tab control on both screens; the pill must not cover text. Breakpoints in §24.

**20. Component sheet.** Take: guest banner (full width and docked pill), empty workspace state, rate-limit card, toasts, skeletons. Leave out: "DS-SPEC-204", "Target cadence 60fps" and other spec labels.

---

## 4. Surfaces with no Stitch screen

Build these from existing patterns. None needs another Stitch pass.

| Surface | § | Build from |
|---|---|---|
| Sign-in email sent (2b) | 4.5 | Sign-in card, different content |
| Home Developer mode (4b) | 2, 27.2 | Home + `ImportCard` + commit line on project cards |
| Agents Test tab (6b) | 27.5 | `AgentDrawer` + Build screen step cards as a trace timeline |
| Couldn't fix (10b) | 9.3 | The "Couldn't fix" card already drawn in screen 10 |
| Git not connected (11b) | 27.7 | The side panel already drawn in screen 11 |
| Deploy step 3 Confirm (12b) | 27.8 | Deploy modal + summary list |
| Deploy failed (13b) | 27.8 | Deploy status + `ErrorCard` |
| Command palette (21) | 5.2, 18.1 | shadcn `Command` in a `Dialog` |
| Share modal (22) | 5.1, 20 | shadcn `Dialog`; invites mocked, presence real |
| Guest entry `/try` | 12.4 | Home + `GuestBanner` + seeded demo projects |
| Database tab | 5.1 | `CollectionList` + `DocumentTable` (shadcn table) |
| Env tab | 5.1 | `EnvTable` with masked values and "Add variable" |
| Terminal tab | 5.2 | The docked terminal in screen 9, full height |
| Project settings `/p/[id]/settings` | 3, 18.4 | Settings sub-nav layout: name, `ThemePicker`, sharing, `DangerZone` (delete, rotate key) |
| Plan Mode change card | 4.3 | `PlanSectionCard` in chat with affected files and "Apply plan" |
| Prompt library | 5.1 | `Sheet` from the `+` menu, filter by role and task |
| Theme picker (8 presets + BYO) | 15.4 | Popover from the theme chip; BYO import options are dummy |
| Attach files as knowledge | 29 | Chips in the prompt box; upload progress; "12,400 characters extracted" |
| Notifications | 5.3 | Popover from the bell; mocked events |
| Shortcuts sheet ("?") | 24 | `Dialog` listing the keyboard map |
| Product tour | 5.3 | Dismissible coach marks over the workspace on first visit |
| Artifacts, Open in Lyzr Studio, API/CLI page, branch previews | 5.1, 5.2 | Dummy cards and pages |
| 404, error, privacy, terms | 5.3 | Static pages in the outer shell |
| Dark mode | 15.2 | `.dark` tokens; toggle in Settings |

---

## 5. Stitch content to drop

These appear in the Stitch screens but are not in the architecture. Leave them out rather than inventing backends:

- Edge and infrastructure stats: Anycast, 18 regions, TTFB, cache hit ratio, cluster names, `production-us-east`.
- Compliance badges (SOC2) and "Anthropic Standard".
- SSH and GPG keys, custom Git remotes (GitLab, Bitbucket), audit logs.
- "Import custom blueprint" and "Submit template" on Templates (keep "Clone" on Marketplace only).
- Design annotations: "View state", "Variant", "Active selection", "DS-SPEC" labels.

---

## 6. Phases and tasks

Phases refine §16.1. Rough total: 5–6 days, including a test-and-fix round of about half a day at the end of every phase. Each task names the sections and screens it implements.

A phase is finished only when its build tasks are done **and** its test-and-fix round passes. The next phase does not start before that.

### 6.0 Test-and-fix round (runs after every phase)

Tools follow §22: Vitest for unit, component and integration tests; Playwright for end-to-end tests; `@axe-core/playwright` for accessibility; the golden-prompt harness for AI output.

1. **Automated checks.** `pnpm typecheck && pnpm lint && pnpm test`, then the Playwright specs for this phase **plus every earlier phase** (regression).
2. **Design check.** Playwright screenshots of this phase's screens at 1440px, 1024px and 390px, placed next to the Stitch `screen.png`. `scripts/design-audit.ts` runs on each route and asserts:
   - Inter and JetBrains Mono are loaded, and no text falls back to serif;
   - exactly one filled accent button;
   - no lavender or Material colours;
   - every icon-only button has a label.
3. **Accessibility.** axe on every new route (no serious or critical violations), plus a keyboard-only walkthrough of the phase's main flow.
4. **Manual walkthrough.** Walk the phase's exit flow as a guest, as a Simple-mode user and as a Developer-mode user. Try the failure paths too: offline, a simulated Groq 429, invalid input, a slow network (Chrome throttling).
5. **Production-like check** (from P1 on). Deploy to a Vercel preview URL and repeat the exit flow there, because cross-origin isolation headers, OAuth redirects and function timeouts behave differently from `localhost`.
6. **Log bugs** in `docs/bugs.md`, one line per bug with phase, screen, steps, severity and status. Severity levels:
   - **S1:** a flow is broken, data is lost, or there is a security issue;
   - **S2:** a feature is wrong, or a screen fails the definition of done (section 8);
   - **S3:** polish.
7. **Fix and re-test.**
   - All S1 and S2 bugs are fixed before the next phase.
   - S3 bugs are fixed or moved to the P4 polish list.
   - Each fix gets a regression test where one is practical.
   - Re-run step 1 after the last fix.
8. **Close the phase.** Commit `test(pN): phase N test round`, tag `phase-N-done`, and tick the phase's exit line.

### P0 — Foundation, shell and auth (about 1 day)

Exit: a reviewer can sign in with Google or enter as a guest, create a project from Home, and land in the workspace shell.

- [ ] **Accounts.** Create the accounts in section 10 (Groq, Supabase, Vercel, GitHub OAuth app, Google OAuth client) and fill `Lyzr AI/.env`.
- [ ] **Scaffold.** Next.js 15 (App Router, TypeScript), Tailwind v4, shadcn/ui, pnpm, inside `phase 0 - home workspace shell/` (section 1.3); install the libraries in §7. Folder layout from §7. `.env.example` from §14 at the repository root, not inside the phase folder.
- [ ] **Agent instructions.** `CLAUDE.md` and `.cursor/rules/architect.mdc` with the §16.2 content, plus links to this plan and `architecture.md`.
- [ ] **Tokens and fonts.** `app/globals.css` with the §15.2 `@theme` block and `.dark` values; Inter and JetBrains Mono through `next/font/google`. Check: no serif anywhere, borders are `#E3E6EC`.
- [ ] **UI primitives.** `Button` (primary, outline, ghost, destructive), `Badge` (neutral, success, danger, warning), `Card`, `Input`, `Textarea`, `Tabs`, `Dialog`, `Sheet`, `Tooltip`, `Skeleton`, `Toaster` (`sonner`), `Command`, `Logo`. Radius 6px on controls and 10px on cards; focus rings.
- [ ] **Supabase.** Project in `ap-south-1`. Migration `0001_init.sql` from §10.2, including `agent_runs` (§8.6), `knowledge_chunks` (§29) and `file_blobs`. RLS and `is_member()` (§10.3), storage buckets (§10.4), `profiles` trigger. Generate types.
- [ ] **Auth (screens 2, 2b).** `/login` with Google, GitHub and magic link; `/auth/callback`; middleware guarding `(app)` and `/p/*` (§4.5). First sign-in goes to `/onboarding`, later ones to `/home`.
- [ ] **Guest mode (§12.4).** `/try` with `signInAnonymously`, seed one demo project (placeholder files for now, filled in P2), `GuestBanner` with "Sign up to keep your work" using `linkIdentity`.
- [ ] **Outer shell.** `(app)/layout.tsx` with `AppSidebar` (collapsed 64px, expands to 240px, tooltips), top search field (opens the palette later), notifications bell, mode switch saved to `profiles.mode`.
- [ ] **Home (screens 4, 4a).** `PromptBox` (auto-grow, ⌘↵, mic button placeholder), `PlusMenu`, secondary links, `IdeaRow` (static seed until P4), `TemplateStrip` (static seed), `RecentProjects` with neutral stage badges and the first-time empty state. `POST /api/projects` creates the project and routes to `/p/[id]`.
- [ ] **Workspace shell.** `p/[id]/layout.tsx` and `page.tsx`: `TopBar`, `StageStepper` (completed stages clickable), resizable chat and canvas (`react-resizable-panels`), tab set per mode (§2), `StatusBar`. Every tab shows its empty state, such as "Agents are designed after you approve the plan".
- [ ] **Test tooling.** Vitest and Testing Library, Playwright with `@axe-core/playwright`, `scripts/design-audit.ts`, `docs/bugs.md`, and Supabase local (`supabase start`) for integration tests.

**P0 test-and-fix round** (section 6.0, plus):
- [ ] Sign in with Google, with GitHub and as a guest; sign out; a signed-out visit to `/home` or `/p/[id]` redirects to `/login`.
- [ ] RLS integration test: user B cannot read, update or delete user A's project, files or messages.
- [ ] Create a project from Home and land in the workspace; every tab shows its empty state.
- [ ] The mode switch persists after reload, and Developer mode shows the extra tabs.
- [ ] Guest "Sign up to keep your work" upgrades the account and keeps the project.
- [ ] Build output contains no secrets: search the client bundle for `sb_secret_`, `gsk_` and the Vercel token.

### P1 — Plan, agents and code generation (about 1 day)

Exit: prompt → plan → agents → files saved as a snapshot, with streaming cards in chat.

- [ ] **AI layer (§8).** `lib/ai/models.ts` with the startup model check (§25), prompt catalog (§8.2), zod tool schemas (§8.3), router, context builder (§8.4), token bucket and retry (§8.5). `import "server-only"`.
- [ ] **Stores and streaming (§19).** Zustand stores `project`, `chat`, `runtime`, `ui`; TanStack Query keys; data parts `step`, `file-op`, `plan-section`, `agent`, `intent`.
- [ ] **Chat panel.** `ChatPanel`, `MessageList`, `UserMessage`, `AssistantMessage`, `StepCard`, `FileOpCard`, `Composer` (attach, Plan/Build toggle, Test toggle, voice, send and stop). `aria-live` on the stream.
- [ ] **Plan (screen 5).** `POST /api/plan` streams sections into `PlanDoc`; inline edit per section; chat refinement; `ApproveBar` calls `/api/plan/approve` and advances the stepper.
- [ ] **Agents (screen 6).** `POST /api/agents/design` streams nodes into `AgentGraph` (`@xyflow/react`); `AgentDrawer` tabs (Overview, Instructions, Tools, Knowledge, Framework, Test, Runs); `FrameworkPicker` writes scaffold files; `PUT /api/agents/[id]`; "Approve agents".
- [ ] **Agent test (screen 6b).** `POST /api/agents/run` with mocked tools marked "Sample data"; `AgentTestConsole` shows the trace and result; rows written to `agent_runs`; "Test passed" pill on the node.
- [ ] **Code generation (screen 7, chat side).** `POST /api/generate` in build mode, in batches (§27.6); `writeFiles` tool writes `project_files`; a snapshot per batch; file-op rows stream into step cards.
- [ ] **Plan Mode (§4.3).** Composer Plan toggle returns a change plan card with affected files and "Apply plan".

**P1 test-and-fix round** (section 6.0, plus):
- [ ] Golden prompts (§22, recorded fixtures): 5 prompts each produce a plan with every section, a manager agent with sub-agents, and a file set that passes `tsc`.
- [ ] Approving the plan advances the stepper to Agents; approving agents advances it to Build; completed stages can be revisited.
- [ ] Editing agent instructions persists after reload; an agent test writes an `agent_runs` row and shows the trace.
- [ ] Code generation writes `project_files` and one snapshot per batch; "Stop" aborts the stream cleanly.
- [ ] Failure paths: a simulated Groq 429 shows the retry card and recovers; an invalid tool call triggers one re-prompt; a long generation stays under the 300s function limit.
- [ ] Token usage lands in `usage_events` for each stage.

### P2 — Preview, self-heal and developer tools (about 1 day)

Exit: the generated app runs live, a broken import is fixed automatically, and a developer can edit code and restore versions.

- [ ] **Generated-app template (§9.6, §28).** `lib/templates/vite-react/` including `src/lib/agents.ts` and `src/theme.css` with the 8 presets (§15.4).
- [ ] **Runtime (§9.1, §9.2).** COOP/COEP scoped to `/p/:path*`; `lib/runtime/webcontainer.ts` mounts files, runs `npm install` with progress, starts `vite dev`; the `runtime` store owns the instance; `StatusBar` shows booting, installing, ready or error.
- [ ] **Build preview (screen 7, canvas side).** `PreviewSkeleton` built from the plan's screens, install progress pill, swap to the live iframe when ready.
- [ ] **Preview ready (screen 8).** `PreviewFrame`, `DeviceToolbar` (desktop, tablet, mobile), refresh, open in new tab, `ConsoleDrawer`, `ElementPicker` (§9.4) that fills the composer with the component path; `/api/generate` in change mode.
- [ ] **Self-heal (screens 10, 10b).** `lib/runtime/error-bridge.ts` (§9.3); fix loop with up to 3 attempts; `ErrorOverlay`; `ErrorCard` fixing and exhausted states; healthy snapshot marking; "Restore last good version".
- [ ] **Code tab (screen 9).** `FileTree`, Monaco `Editor` (⌘S saves through `PUT /api/projects/[id]/files`), `DiffView` for "Changes in vN", `Terminal` (xterm) attached to the WebContainer shell.
- [ ] **History (screen 15).** `/p/[id]/history`: `SnapshotTimeline`, snapshot preview, file list and diff, `RestoreDialog` using `POST /api/projects/[id]/restore`.
- [ ] **Fallback (§9.5).** Sandpack for browsers without cross-origin isolation, with a banner.

**P2 test-and-fix round** (section 6.0, plus):
- [ ] The preview boots in Chrome and Edge. Safari and Firefox show the Sandpack fallback and its banner.
- [ ] A seeded broken import is fixed within 3 attempts, and the snapshot is marked healthy. A forced triple failure shows the "Couldn't fix automatically" card, and "Restore last good version" works.
- [ ] Saving in the editor updates the preview through hot reload; the diff pane shows the change.
- [ ] The element picker fills the composer with the right component path; a change request edits only that component.
- [ ] Restore creates a new snapshot and leaves history intact.
- [ ] COOP/COEP headers appear only on `/p/*`: login, OAuth redirects and avatars still work, checked on the Vercel preview URL.

### P3 — GitHub, import and deploy (about 1 day)

Exit: a repo is created with the code, a repo can be imported, and a live URL works and calls the project's agents.

- [ ] **GitHub connect (screen 11b).** `linkIdentity` with GitHub, provider token encrypted (§13), `GitEmptyState`; guests see "Sign up to connect".
- [ ] **Git tab (screen 11).** `POST /api/github/push` through the Git Data API (§12.1), auto-commit toggle, `CommitList` with snapshot badges, `BranchSelect` (list real, switch dummy), states for conflict (422) and token expired (401).
- [ ] **Import (screen 14).** `/import` with `GET /api/github/repos`, `POST /api/github/import`, `POST /api/import/zip`; limits enforced; framework detection; reverse plan; `ImportProgress`; code-only banner.
- [ ] **Public agent API (§8.6).** `POST /api/public/agents/run` with the `x-architect-key` header, origin allowlist and rate limit.
- [ ] **Deploy wizard (screens 12, 12b).** `/p/[id]/deploy`: `DomainForm` with `GET /api/deploy/check`, `PreflightChecklist` (runs `vite build` in the WebContainer, checks env vars), "Generate key", options step (dummy toggles), confirm step, `POST /api/deploy` (§12.2).
- [ ] **Deploy status (screens 13, 13b).** Polling plus Realtime broadcast, `DeployLogs`, "Your app is live" card with copy, open and QR, `DeploymentList` with Redeploy and Promote; failed state with logs and "Fix with AI".

**P3 test-and-fix round** (section 6.0, plus):
- [ ] The first push creates the repo and a commit; a second push adds a commit; the commit SHA appears on the snapshot.
- [ ] A remote change shows the conflict state (422); a revoked token shows the reconnect state (401).
- [ ] Importing a repo within the limits works; one over 500 files or 5 MB is rejected with a clear message; zip import works; a non-Vite repo opens in code-only mode.
- [ ] A real deploy reaches Ready, and the live URL loads and calls an agent successfully. A deliberately broken build shows the failed state, and "Fix with AI" repairs it.
- [ ] Public agent API: a wrong key returns 401, a disallowed origin is refused, and too many requests return 429.
- [ ] Guests see "Sign up to connect" for GitHub and deploy; the per-user deploy limit holds.

### P4 — Coverage and polish (about 1 day)

Exit: every row in §5 is reachable in the UI, and each screen passes the definition of done.

- [x] **Landing (screen 1)** and `/` redirect for signed-in users.
- [x] **Onboarding (screen 3)** with `POST /api/consultant`; Home's "Suggested for you" row reads the saved ideas.
- [x] **Home extras:** Developer variant (4b), prompt library, theme picker, attachments with `POST /api/upload` and knowledge chunks (§29), voice with `POST /api/transcribe`.
- [x] **Templates and Marketplace (screen 18)** with template creation and clone.
- [x] **Usage (screen 16)** with `GET /api/usage` and `recharts`.
- [x] **Settings (screen 17)** and project settings: profile, mode, connected accounts, model keys (BYOK), integrations and MCP (dummy), danger zone, dark mode toggle.
- [x] **Database and Env tabs.**
- [x] **Command palette (screen 21)**, shortcuts sheet, notifications popover, product tour.
- [x] **Share modal (screen 22)** with presence avatars (§20).
- [x] **Mobile (screen 19)** and the tablet breakpoint (§24).
- [x] **Cross-cutting states (screen 20):** rate-limit card, toasts, skeletons, 404, error page, privacy, terms.
- [x] **Dummy surfaces:** artifacts, Open in Lyzr Studio, API/CLI page, branch previews.

**P4 test-and-fix round** (section 6.0, plus):
- [ ] Walk every row of the §5 feature matrix and confirm it is reachable in the UI and behaves as its Real / Partial / Dummy status says.
- [ ] Every screen in section 2 passes the definition of done (section 8), in light and dark mode, at 1440px, 1024px and 390px.
- [ ] axe passes on every route; the command palette and all dialogs work by keyboard alone.
- [ ] Lighthouse on Home and the workspace meets the §23.1 budgets.
- [ ] The S3 polish list from earlier rounds is cleared or consciously deferred.

### P5 — Ship (about half a day)

- [x] **Demo data (section 7)** seeded for `/try` and new accounts.
- [ ] **Production.** Vercel project (functions in `bom1`), env vars from §14, Supabase auth redirect URLs for the production domain, Google and GitHub OAuth apps. Region and env names are set; the live project still needs the account tokens.
- [x] **CI (§25).** GitHub Actions: typecheck, lint, Playwright smoke (sign in as guest, open the demo project, preview boots, open deploy wizard).
- [x] **README.** Screenshots of each stage, the feature matrix with Real / Partial / Dummy, links to `architecture.md` and this plan, setup steps.
- [x] **Walkthrough video** (2–3 minutes): guest entry → prompt → plan → agents → build → fix → GitHub → deploy. Recorded at `docs/walkthrough.webm`.
- [ ] **Final test-and-fix round on production** (section 6.0, plus):
  - Walk the whole demo path on the production URL in a fresh incognito window: once as a guest, once as a new Google user.
  - Check that the OAuth redirects, the Supabase keep-alive job and the README links all work.
  - Fix every S1 and S2 bug before submitting.
- [ ] **Submit** the live URL and the GitHub repo (§16.3).

---

## 7. Demo data

Reviewers enter through `/try`, so the seeded content is what they judge first. Use the same "Travel Planner" project the Stitch screens show, so the built app matches the mockups:

- **Travel Planner** (Build stage, preview ready): plan with 8 sections, 4 agents (Trip Manager, Flight Finder, Hotel Scout, Itinerary Writer), 9 snapshots with one runtime-error snapshot, a generated Vite app with a search form, itinerary cards and a split-cost summary. Images bundled in the template, not hotlinked.
- **Support Desk** (Live): deployed state with a deployment history, to show the Ship stage without deploying.
- **Lead Research Assistant** (Plan stage): to show the plan document and approve flow.

Seed files live in `lib/templates/demo/` (§12.4). The same seed powers the template cards and the landing page product frame.

---

## 8. Definition of done

A screen is done when:

- [ ] Layout matches its Stitch screen, with the section 3 fixes applied.
- [ ] It uses only §15.2 tokens, Inter and JetBrains Mono, 1px borders, and the 6px / 10px radius.
- [ ] It has exactly one filled accent button.
- [ ] Empty, loading, error and success states exist where data loads.
- [ ] Copy follows section 1.2 and lives in `lib/i18n/en.ts`.
- [ ] It works by keyboard with visible focus, labelled icon buttons, and `aria-live` on streaming regions (§24).
- [ ] It holds up at 1440px, 1024px and 390px.
- [ ] It works in light and dark mode.
- [ ] `pnpm typecheck && pnpm lint` pass.

---

## 9. Cut list if time runs short

From §16.1a. Judging rewards design and coverage over real functionality, so demote in this order, keeping the UI flow intact:

1. Vercel deploy becomes a scripted Queued → Building → Ready run with a plausible URL.
2. GitHub push returns a mocked commit.
3. WebContainer preview falls back to a prebuilt preview per demo project with scripted file-op cards.

Never cut: the plan → agents → build → ship flow, the Simple / Developer toggle, guest mode, or the design system.

---

## 10. Accounts and third-party services

Checked against each provider's pricing or limits page in September 2026. Limits change; confirm in each dashboard after signing up.

### 10.1 Required

| Service | Used for | Free? | Free-tier limits that matter |
|---|---|---|---|
| **Groq** | All LLM calls, Whisper transcription | Free tier, but too small for code generation | `gpt-oss-120b` and `gpt-oss-20b`: 30 requests/min, 1K requests/day, **8K tokens/min, 200K tokens/day**, per organization (shared by every user). Whisper: 20 requests/min, 2K/day |
| **Supabase** | Auth, Postgres, Storage, Realtime | Yes (Free plan) | 2 projects, 500 MB database, 1 GB storage, 5 GB egress, 50K monthly active users, 200 Realtime connections. Anonymous sign-in and OAuth included. **Projects pause after 1 week without activity.** Preview branches are paid |
| **Vercel** | Hosting Architect; deploying generated apps through the REST API | Yes (Hobby) | Non-commercial use only. Functions up to 300s with Fluid compute. 100 deployments/day and 100 builds/hour, shared by Architect and every generated app. Runtime logs kept 1 hour. Git repos must be personal, not owned by an organization |
| **GitHub** | OAuth sign-in, repo create, push, import | Yes | OAuth app is free. REST API 5,000 requests/hour per user token |
| **Google Cloud** | Google sign-in (OAuth client) | Yes | Email and profile scopes need no verification, but the consent screen must be published to Production, or only listed test users can sign in |
| **WebContainers** (StackBlitz) | In-browser preview | Free for prototypes | A commercial licence is required only for production for-profit use. A hiring prototype qualifies as free |

### 10.2 Optional

| Service | Used for | Free? | Notes |
|---|---|---|---|
| **Resend** (or another SMTP provider) | Magic-link emails | Yes: 3,000/month, 100/day | Needed because Supabase's built-in email only sends to project team members, 2 per hour. Resend requires a domain you own to email other people. Without a domain, keep magic link as a secondary option and rely on Google, GitHub and guest |
| **Upstash Redis** | Rate limiting | Yes: 256 MB, 500K commands/month | Skip it; a Postgres counter over `usage_events` does the same job (§13) |
| **Sandpack** (CodeSandbox) | Preview fallback | Yes, open source | Used only when cross-origin isolation isn't available |
| **OpenStreetMap + Leaflet** | Maps in the demo Travel Planner app | Yes | Avoids a Google Maps key in the generated app |

All libraries in §7 are open source and free (MIT or Apache). GitHub Actions is free for public repositories.

Everything the feature matrix marks as Dummy needs no account: Gmail, Slack, Notion, HubSpot, Jira, Linear, Google Sheets, Google Calendar, MCP servers, Lyzr Studio, OpenAI and Anthropic keys (stored, not called), custom domains, analytics, marketplace.

### 10.3 Decisions this forces

- **Groq: switch to the Developer (pay-as-you-go) plan before P1.** On the free tier, one code-generation request (file context plus generated files) can exceed 8K tokens by itself, and 200K tokens a day covers only about two full app builds across all reviewers. At $0.15 per million input tokens and $0.60 per million output tokens for `gpt-oss-120b`, a full build (about 80K tokens) costs roughly $0.03. It needs a card on file. Confirm the new per-minute limit on the console's Limits page after upgrading.
- **Groq: spread load across models.** Limits are per model. Keep `gpt-oss-120b` for plan, code generation and fixes; use `gpt-oss-20b` for the router, chat, consultant and agent tests (§8.1).
- **Groq: make exploring cheap.** Seeded demo projects (section 7) arrive prebuilt, so a reviewer can explore every stage without spending tokens. Cached input tokens don't count toward limits, so keep system prompts stable.
- **Supabase: keep the free project awake during judging.** Add a daily GitHub Actions job that makes one cheap query, or move to Pro ($25/month) for the review window.
- **Vercel: stay within 100 deployments a day.** Rate-limit deploys per user (for example 5 a day), and let guests view deploys of the seeded Support Desk project instead of creating new ones.
- **Email: decide on magic link.** Buy or use a domain for Resend if magic link should work for reviewers; otherwise mark it "Partial" in the README.

### 10.4 Keys and where they go

Variable names follow §14. "Needed from" is the first phase that fails without the key. "Root `.env`" means `/Users/asankhua/Desktop/Lyzr AI/.env`, the only env file in the project. A Hugging Face Space uses the same names as Space secrets (§14.1). Render uses the same names (§14.2). Server secrets are read when the container starts. `NEXT_PUBLIC_` values are read when the image is built.

| Key | Get it from | Goes in | Needed from |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → project → Connect dialog | root `.env`, Vercel env | P0 |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API Keys → create secret key | root `.env`, Vercel env (server only) | P0 |
| Google OAuth client ID and secret | Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` | Supabase → Authentication → Providers → Google | P0 |
| GitHub OAuth app client ID and secret | GitHub → Settings → Developer settings → OAuth Apps. Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. The app requests the `repo` scope at sign-in so pushes work in P3 | Supabase → Authentication → Providers → GitHub | P0 |
| `NEXT_PUBLIC_APP_URL` | Your local URL, then the public app URL (`https://lyzr-ai-project.onrender.com` on Render, `https://<user>-<space>.hf.space` on Hugging Face, or the Vercel production URL). Also add it to Supabase → Authentication → URL Configuration | root `.env`, Render env, Space variable (rebuild after changing it), or Vercel env | P0 |
| `ENCRYPTION_KEY` | Generate: `openssl rand -base64 32` | root `.env`, Vercel env (server only) | P0 (used from P3) |
| `GROQ_API_KEY` | console.groq.com → API Keys (upgrade to the Developer plan, see 10.3) | root `.env`, Vercel env (server only) | P1 |
| `VERCEL_TOKEN` (+ `VERCEL_TEAM_ID` if using a team) | vercel.com → Account Settings → Tokens | root `.env`, Vercel env (server only) | P3 |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens | GitHub Actions secret | P5 |
| SMTP credentials (optional) | Resend → API Keys, with a verified domain | Supabase → Authentication → SMTP Settings | P0, only if magic link must reach reviewers |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional) | upstash.com console | root `.env`, Vercel env | Not needed if rate limiting uses Postgres |

No keys are needed for:
- **GitHub API calls on a user's behalf.** Each user's own OAuth token is captured at sign-in and stored encrypted (§13).
- **WebContainers.** `configureAPIKey` applies only to commercial licences.
- **Anything the feature matrix marks as Dummy.**

Deployed generated apps receive `VITE_ARCHITECT_URL` and `VITE_ARCHITECT_KEY` automatically at deploy time; `VITE_ARCHITECT_KEY` is the project's `public_key`, created by the database, not by you.
