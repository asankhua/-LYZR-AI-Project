# Architect 2.0 — Product requirements document

| | |
|---|---|
| Product | Architect 2.0, the next version of [architect.new](https://architect.new) |
| Context | Lyzr hiring assignment ([assignment.md](assignment.md)) |
| Status | Draft for build, September 2026 |
| How it's built | [architecture.md](architecture.md) (cited as §) |
| Build order | [implementation_plan.md](implementation_plan.md) (phases P0–P5) |
| Screen designs | `stitch_design/`, generated from [stitch_prompt.md](stitch_prompt.md) (cited as "screen N") |

This document says **what** Architect 2.0 must do and **why**. The architecture says how, and the implementation plan says in what order.

"Plan" in this document means the product-requirements document Architect writes for a *user's* app, shown in the Plan stage. It is not this file.

## Contents

1. [Summary](#1-summary)
2. [Problem](#2-problem)
3. [Goals and non-goals](#3-goals-and-non-goals)
4. [Users](#4-users)
5. [Product principles](#5-product-principles)
6. [Key journeys](#6-key-journeys)
7. [Functional requirements](#7-functional-requirements)
8. [Non-functional requirements](#8-non-functional-requirements)
9. [Design requirements](#9-design-requirements)
10. [Success metrics](#10-success-metrics)
11. [Release plan](#11-release-plan)
12. [Dependencies](#12-dependencies)
13. [Risks](#13-risks)
14. [Assumptions and open questions](#14-assumptions-and-open-questions)
15. [Glossary](#15-glossary)

---

## 1. Summary

Architect 2.0 turns a prompt into a deployed agentic application. A user describes what they want, approves a plan, shapes the AI agents, watches the app build in a live preview, and ships it to a public URL, with the code in their own GitHub repo.

Today's Architect serves non-technical users only. Version 2.0 keeps that path and adds a **Developer mode** on the same project: code editor, terminal, diffs, repo import, framework choice and code ownership. One project, two lenses.

---

## 2. Problem

| Who | Problem today | Consequence |
|---|---|---|
| Non-technical builders | Building an AI-agent app needs engineers; existing tools produce a UI but hide the agents and what went wrong | They give up at the first error, or can't trust what was built |
| Developers | Vibe-coding tools hide the code, lock it in, and can't start from an existing repo | They won't adopt a tool they can't inspect, own or extend |
| Teams | No shared view between the person who wants the app and the person who maintains it | Hand-offs lose context; nobody knows why the app works the way it does |
| Everyone | Build failures and AI cost are opaque | Surprise breakages and bills |

Architect's own gaps (§26.1): no code view, no import, agents tied to one framework, little visibility into failures, opaque cost.

---

## 3. Goals and non-goals

### 3.1 Goals

**Assignment goals, in the order they are judged:**

1. **Design, UI/UX and flows.** Every flow from sign-in to deploy is coherent, calm and obvious, down to where each button sits.
2. **Feature coverage.** Every current Architect feature plus the developer additions is reachable. Features not wired to a backend get a convincing dummy flow.
3. **Working functionality.** Sign-in, database, AI planning and code generation, live preview, self-heal, GitHub push and import, and deploy work for real.

**Product goals:**

- A non-technical user gets from idea to a working preview without reading code.
- A developer can import a repo, edit code, and own the result in GitHub.
- Both can see what the AI is doing, undo anything, and understand the cost.

### 3.2 Non-goals

These are out of scope; where the feature matrix lists them, they appear as dummy flows only.

- Real billing, payments or credit purchase.
- Real third-party integrations (Gmail, Slack, Notion, HubSpot, Jira, MCP servers) and running tools against them.
- Running non-default agent frameworks (LangGraph, CrewAI, OpenAI Agents SDK, GitAgent); they generate scaffold files only.
- Live preview for stacks other than Vite + React (Next.js, Astro, FastAPI open in code-only mode).
- Custom domains, branch previews, CLI, SSO, enforced team roles.
- Native mobile apps (the web app is responsive).
- Copying the UI of Architect, Lovable, v0, Replit or Cursor (assignment rule).

---

## 4. Users

| Persona | Who | Job to be done | Mode |
|---|---|---|---|
| **Maya**, ops lead | Non-technical, owns a painful workflow | "Turn my repetitive task into a working app I can share, without learning to code." | Simple |
| **Dev**, full-stack engineer | Writes code daily, cares about control | "Start from my repo or a prompt, see and edit every file, choose my framework, and keep the code." | Developer |
| **Team admin** | Manages a small team's tools | "Share projects, see who's working on what, and keep AI spend in check." | Either |
| **Reviewer / guest** | Evaluating the product (Lyzr judges) | "See every stage working in a few minutes, without signing up." | Simple, via `/try` |

Mode is a per-user preference with a per-project override (§2). Switching mode changes what is shown, never the data.

---

## 5. Product principles

From §1:

1. **One project, two lenses.** Outcomes for Simple mode, code for Developer mode, same project.
2. **Always show what the AI is doing.** Plans stream in, files appear as they are written, errors show as they are fixed.
3. **Approve before expensive work.** Code generation starts only after the plan is approved.
4. **Nothing is lost.** Every AI change is a snapshot that can be previewed or restored.
5. **You own the output.** GitHub export and deploy are first-class actions.

---

## 6. Key journeys

Detailed flows and diagrams are in §4.

| # | Journey | Steps | Screens |
|---|---|---|---|
| J1 | **Prompt to live app** | Sign in → (first run) AI Consultant → Home prompt → Plan → approve → Agents → approve → Build with live preview → iterate by chat or pointing → push to GitHub → deploy → live URL | 2, 3, 4, 5, 6, 7, 8, 11, 12, 13 |
| J2 | **Guest evaluation** | `/try` → populated Home with demo projects → open a project at any stage → sign up to keep work | 4, 20 and all workspace screens |
| J3 | **Import existing code** | Import → pick repo or zip → framework detected → reverse plan written → workspace in Developer mode with preview | 14, 9 |
| J4 | **Change safely** | Plan Mode: describe a change → change plan → Apply → code change → diff | 5, 9 |
| J5 | **Recover from failure** | Runtime error → automatic fix (up to 3 attempts) → if exhausted: try again, details, or restore last good version | 10, 10b |
| J6 | **Undo** | History → preview an old version → Restore (creates a new version) | 15 |
| J7 | **Ship and monitor** | Deploy wizard → status → live URL, QR, share → deployments list → redeploy or promote; failed deploy → Fix with AI | 12, 12b, 13, 13b |

J1 and J2 are the demo path and must be flawless.

---

## 7. Functional requirements

**Priority:** **Must** = part of the judged core path; **Should** = expected for coverage; **Could** = nice to have, first to cut.
**Status** (as in §5): **Real** = works end to end; **Partial** = core works, edges mocked; **Dummy** = full UI with mocked data.

### 7.1 Authentication and guest access

Screens 2, 2b, 20 · Phase P0 · §4.5, §12.4, §27.1

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| AUTH-1 | Sign in with Google | Must | Real | New user lands on `/onboarding`; returning user lands on `/home`; a `profiles` row exists |
| AUTH-2 | Sign in with GitHub | Must | Real | Same as AUTH-1; the GitHub token is stored encrypted for later pushes |
| AUTH-3 | Sign in with an email magic link | Should | Real / Partial | "Check your email" state with 30s resend timer; works for any address once custom SMTP is set (section 14) |
| AUTH-4 | Try without an account (`/try`) | Must | Real | Anonymous session; Home shows 3 seeded demo projects; persistent guest banner |
| AUTH-5 | Upgrade a guest in place | Must | Real | "Sign up to keep your work" links an identity; all guest projects remain |
| AUTH-6 | Route protection | Must | Real | Signed-out visits to `(app)` routes or `/p/*` redirect to `/login`; `/try` is open |
| AUTH-7 | Guest limits | Should | Real | Guests cannot connect GitHub or deploy; they see "Sign up to connect"; tighter token budget |

### 7.2 Onboarding (AI Consultant)

Screen 3 · Phase P4 · §27.9

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| ONB-1 | Three-step consultant: role, biggest time sinks, current tools | Should | Real | Multi-select tiles plus free text; progress shown; skippable |
| ONB-2 | Idea suggestions with hours saved | Should | Real | 3–6 ideas, each with title, description, agent chips and "Saves ~N hrs/week" |
| ONB-3 | Use an idea | Should | Real | "Use this" fills the Home prompt; ideas reappear on Home under "Suggested for you" |

### 7.3 Home

Screens 4, 4a, 4b · Phase P0 (core), P4 (extras) · §27.2

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| HOME-1 | Prompt box creates a project | Must | Real | ⌘↵ or "Build" creates a project and opens the workspace in the Plan stage |
| HOME-2 | `+` menu: attach files, theme, existing agents, prompt library | Should | Mixed | Attach is Partial (PDF, DOCX, TXT, CSV become knowledge); theme presets Real; existing agents Dummy; prompt library Real |
| HOME-3 | Voice prompt | Could | Real | Mic records, transcribes (Whisper) and fills the prompt |
| HOME-4 | Suggestions, templates strip, recent projects | Must | Real | Project cards show a thumbnail, name, neutral stage badge (green only for Live) and one metadata line |
| HOME-5 | First-time empty state | Must | Real | No projects: "Your projects will appear here" with the 4-stage explainer |
| HOME-6 | Secondary starts | Should | Real | "Import from GitHub" and "Start blank project" links |
| HOME-7 | Developer-mode Home | Should | Real | Import card beside the prompt, developer starters, last commit on project cards |

### 7.4 Workspace shell

All workspace screens · Phase P0 · §3, §18.1

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| WS-1 | Stage stepper Plan → Agents → Build → Ship | Must | Real | Always shows the current stage; completed stages can be revisited |
| WS-2 | Simple / Developer switch | Must | Real | Persists per user; Developer adds Code, Terminal, Database, Env and Git tabs |
| WS-3 | Chat beside a tabbed canvas | Must | Real | Resizable panels; ⌘B toggles chat |
| WS-4 | Status bar | Must | Real | Runtime state, snapshot id and tokens used |
| WS-5 | One primary action in the top bar | Must | Real | "Approve plan", "Approve agents" or "Deploy", depending on stage |
| WS-6 | Empty states per tab | Must | Real | Each tab names the next action (for example "Agents are designed after you approve the plan") |
| WS-7 | Share and presence | Should | Partial | Share modal with roles (invites Dummy); live avatars of who else is viewing (Real) |

### 7.5 Chat

Phase P1 · §27.3

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| CHAT-1 | One conversation drives every stage | Must | Real | Messages route to plan, agents, build or answer (router) |
| CHAT-2 | Structured progress cards | Must | Real | Step, file-op, plan-section, agent, error and deploy cards; expandable details |
| CHAT-3 | Composer controls | Must | Real | Attach, Plan/Build toggle, Test toggle, voice, send; Stop while streaming |
| CHAT-4 | Slash commands | Could | Real | `/plan`, `/fix`, `/agent`, `/deploy`, `/restore` |
| CHAT-5 | Retry from here | Could | Real | Restores the snapshot before a message and re-runs it |
| CHAT-6 | Rate-limit handling | Must | Real | "We're getting a lot of requests. Retrying in Ns" with countdown; recovers automatically |

### 7.6 Plan

Screen 5 · Phase P1 · §4.3, §27.3

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| PLAN-1 | Generate a plan from the prompt | Must | Real | Sections stream in: summary, who it's for, user journey, screens, agents, data, integrations, open questions |
| PLAN-2 | Edit inline | Must | Real | Any section editable; edits persist |
| PLAN-3 | Refine by chat | Must | Real | "Make it mobile-first" updates the affected sections |
| PLAN-4 | Approve | Must | Real | Sticky bar "Looks good? Agents are designed next." with "Approve plan"; stage advances |
| PLAN-5 | Plan Mode for changes | Should | Real | Change plan lists affected files and risks; writes nothing until "Apply plan" |
| PLAN-6 | Plan stays current | Should | Real | After applied changes the plan document reflects the app |

### 7.7 Agents

Screens 6, 6b · Phase P1 · §8.6, §27.5

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| AGT-1 | Agent graph from the plan | Must | Real | Manager node plus sub-agents with role, tools and knowledge chips |
| AGT-2 | Agent drawer | Must | Real | Tabs: Overview, Instructions, Tools, Knowledge, Framework, Test, Runs |
| AGT-3 | Edit instructions, tools and knowledge | Must | Real | Saved as a new agent version; persists after reload |
| AGT-4 | Framework picker | Should | Partial | Default runs; Lyzr, LangGraph, CrewAI, OpenAI Agents SDK and GitAgent generate scaffold files under `agents/<name>/` |
| AGT-5 | Test one agent | Must | Partial | Runs on Groq with the agent's instructions; tools return sample data (labelled); trace timeline and result; stored in runs |
| AGT-6 | Approve agents | Must | Real | Stage advances to Build |
| AGT-7 | Open in Lyzr Studio | Could | Dummy | Link placeholder |

### 7.8 Build and preview

Screens 7, 8, 10, 10b · Phase P1 (generation), P2 (preview) · §9, §27.4, §27.6

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| BLD-1 | Batched code generation | Must | Real | Visible batches: Layout and theme, Pages, Components, Wiring agents, Checking; each lists its files |
| BLD-2 | Live preview in the browser | Must | Real | Skeleton of the page structure while building; live app when ready; install progress shown |
| BLD-3 | Preview toolbar | Must | Real | Desktop / tablet / mobile, refresh, open in new tab, console drawer |
| BLD-4 | Point to change (element picker) | Should | Partial | Clicking an element fills the composer with its component path; the change edits that component |
| BLD-5 | Iterate by chat | Must | Real | A change request produces a diff-sized code change and a new snapshot; preview hot-reloads |
| BLD-6 | Self-heal | Must | Real | Build and console errors are captured and fixed automatically, up to 3 attempts, with visible steps |
| BLD-7 | Fix exhausted | Must | Real | "Couldn't fix automatically" with Try again, Show details, Restore last good version |
| BLD-8 | Browser fallback | Should | Real | Browsers without cross-origin isolation get a fallback preview and a banner |
| BLD-9 | Artifacts (docs, slides, reports) | Could | Dummy | Artifact cards with mocked files |

### 7.9 Developer tools

Screen 9 and unmocked tabs · Phase P2 (code, terminal), P4 (database, env, palette) · §5.2

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| DEV-1 | Code editor and file tree | Must | Real | Monaco editor; ⌘S saves, updates the preview and creates a snapshot |
| DEV-2 | Diff per change | Must | Real | "Changes in vN" shows the diff and the AI's rationale |
| DEV-3 | Terminal | Should | Real | Shell attached to the preview runtime |
| DEV-4 | Environment variables | Should | Real | Add, edit, mask; injected into preview; stored encrypted |
| DEV-5 | Database viewer | Should | Partial | Collections and documents of the generated app (local storage) |
| DEV-6 | Stack picker | Could | Partial | Vite + React real; other stacks scaffold only |
| DEV-7 | Bring your own model key | Could | Partial | Groq key used; OpenAI and Anthropic stored, marked "Coming soon" |
| DEV-8 | API and CLI page | Could | Dummy | Tokens UI and docs |

### 7.10 GitHub

Screens 11, 11b, 14 · Phase P3 · §12.1, §27.7

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| GIT-1 | Connect GitHub | Must | Real | Not-connected state explains the benefit; connecting links the identity |
| GIT-2 | Create repo and push | Must | Real | First push creates the repo; commit SHA links to the snapshot |
| GIT-3 | Auto-commit after successful builds | Should | Real | Toggle; commits appear in the list |
| GIT-4 | Unpushed changes and push / pull | Must | Real (push), Partial (pull) | "N changes not pushed" banner |
| GIT-5 | Branches | Could | Partial | List real; switching Dummy |
| GIT-6 | Error states | Must | Real | Conflict (remote changed) and token expired (reconnect) states |
| GIT-7 | Import a repo | Must | Real | Repo list, branch choice; limit 500 files / 5 MB with a clear message when exceeded |
| GIT-8 | Import a zip | Should | Real | Same limits; `node_modules` skipped |
| GIT-9 | Reverse plan on import | Should | Real | A plan inferred from the code is written so non-technical teammates can follow it |
| GIT-10 | Unsupported stacks | Should | Real | Open in code-only mode with a banner |

### 7.11 Deploy

Screens 12, 12b, 13, 13b · Phase P3 · §4.7, §12.2, §27.8

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| DEP-1 | Choose an address | Must | Partial | `name.vercel.app` with live availability check |
| DEP-2 | Pre-flight checks | Must | Real | Production build, no preview errors, required env vars (with "Generate key") |
| DEP-3 | Options | Could | Dummy | Analytics, publish to marketplace, custom domain "Coming soon" |
| DEP-4 | Confirm and deploy | Must | Real | Summary with edit links; one "Deploy" action |
| DEP-5 | Status | Must | Real | Queued → Building → Ready with live logs; typically under a minute |
| DEP-6 | Success | Must | Real | URL with copy and open, QR code, share links |
| DEP-7 | Deployments list | Should | Real | History with status and snapshot; Redeploy and Promote |
| DEP-8 | Failed deploy | Must | Real | Logs, "Fix with AI", and a note that the previous live version still runs |
| DEP-9 | Deployed app keeps agents working | Must | Real | The app calls Architect's agent API with its project key; wrong keys and excess requests are refused |
| DEP-10 | Deploy limits | Should | Real | Per-user daily deploy limit (default 5) |

### 7.12 History

Screen 15 · Phase P2 · §4.4

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| HIST-1 | Version timeline | Must | Real | Prompt that caused each version, author, time, files changed, healthy or error marker |
| HIST-2 | Inspect a version | Must | Real | Preview, file list and diff |
| HIST-3 | Restore | Must | Real | Creates a new version; nothing is deleted |

### 7.13 Templates and Marketplace

Screen 18 · Phase P4

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| TPL-1 | Templates by category | Should | Real | Filter and search; "Use template" creates a working project |
| TPL-2 | Marketplace | Could | Dummy (clone Real) | Community cards; "Clone" copies a template project |

### 7.14 Usage, settings and integrations

Screens 16, 17 · Phase P4

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| USE-1 | Usage dashboard | Should | Partial | Real token counts by day, stage, project and agent; estimated cost; plan badge |
| USE-2 | Upgrade | Could | Dummy | Upgrade button with mocked plans |
| SET-1 | Profile, mode, connected accounts | Should | Real | Changes persist |
| SET-2 | Model keys | Could | Partial | See DEV-7 |
| SET-3 | Integrations catalog | Should | Dummy | Connect cards (Gmail, Slack, Notion, Google Calendar, HubSpot, Jira, Linear, Sheets); GitHub shows real status |
| SET-4 | MCP servers and custom tools | Could | Dummy | Add-server form and mocked tool list |
| SET-5 | Project settings | Should | Real | Name, theme, sharing, delete project, rotate the public key |
| SET-6 | Dark mode | Should | Real | System-aware; toggle in Settings |

### 7.15 Cross-cutting

Screens 1, 19, 20, 21, 22 · Phase P4

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| X-1 | Landing page | Should | Real | Hero prompt, how it works, built for both audiences, "Try without an account" |
| X-2 | Command palette (⌘K) | Should | Real | Search projects, templates, files and commands; keyboard only |
| X-3 | Notifications | Could | Dummy | Deploy done, build failed, teammate joined |
| X-4 | Product tour | Could | Real | Dismissible first-visit coach marks |
| X-5 | Shortcuts sheet ("?") | Could | Real | Mirrors the keyboard map (§24) |
| X-6 | Mobile layout | Should | Real | Below 768px: Chat and Preview tabs, full-width preview |
| X-7 | Export as zip | Could | Real | Signed download link |
| X-8 | 404, error, privacy, terms pages | Should | Real | Static pages in the app shell |

---

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** (§23.1) | Landing LCP under 1.5s; workspace interactive under 2.5s; first plan token under 1.5s after submit; first preview ready under 20s after files are written; chat change to hot reload under 2s |
| **Accessibility** (§24) | WCAG 2.1 AA; every action keyboard-reachable; visible focus rings; labelled icon buttons; `aria-live` on streaming regions; colour never the only signal; reduced-motion respected |
| **Browsers** | Full experience in current Chrome and Edge; Safari and Firefox get the fallback preview with a banner; mobile browsers get the responsive layout |
| **Responsive** | Three layouts: 1280px and up, 768–1279px, below 768px |
| **Security** (§13) | Row-level security on every table; secrets server-side only; OAuth tokens and env values encrypted; generated code runs only in the user's browser sandbox; path and size limits on AI file writes and imports |
| **Reliability** | Every AI call retries on rate limits with backoff; invalid AI output is re-prompted once; self-heal up to 3 attempts; every change is a snapshot |
| **Cost control** | Per-user token budget (tighter for guests); per-key limit on the public agent API (30 requests/minute); per-user daily deploy limit; cheaper model for routing and chat |
| **Privacy** | Guest accounts and their data are removed after 30 days (documented job); uploads are stored in private buckets |
| **Observability** (§21) | Token usage recorded per stage, project and agent; errors logged with request ids |
| **Localisation** | English only, with all copy in one file so it can be translated later |

---

## 9. Design requirements

Full system in §15 and implementation rules in [implementation_plan.md](implementation_plan.md) section 1.

- **Direction:** calm, focused "workbench". Content first, minimal chrome. Our own patterns: stage stepper, step cards, two-lens toggle.
- **Tokens:** colours, type and radius exactly as §15.2 (Inter and JetBrains Mono; accent `#4F46E5`; 1px `#E3E6EC` borders; 10px cards, 6px controls).
- **One primary action per screen**, in a consistent place.
- **Every data surface** has empty, loading, error and success states. Errors always offer a next step: Retry, Fix with AI or Show details.
- **Stage badges** are neutral; green only for Live, red only for Error.
- **Copy:** plain language in Simple mode; technical detail only in Developer mode; the AI model is shown as "Groq · gpt-oss-120b".
- **Reference screens:** the 23 Stitch exports are the layout reference, with the fixes listed in the implementation plan, section 3.

---

## 10. Success metrics

### 10.1 Submission (what the reviewers experience)

| Metric | Target |
|---|---|
| Reviewer reaches a populated workspace from the live URL | Under 10 seconds, no sign-up |
| New prompt to live preview (J1) | Under 3 minutes |
| Feature coverage | 100% of §5 feature-matrix rows reachable in the UI |
| Self-heal on the golden set of seeded errors | At least 8 of 10 fixed automatically |
| Accessibility | Zero serious or critical axe violations |
| Design | Every screen passes the definition of done (implementation plan, section 8) |
| Stability | No open S1 or S2 bugs at submission |

### 10.2 Product (if launched)

| Metric | Definition | Target direction |
|---|---|---|
| Activation | New users who reach a working preview in their first session | North-star input |
| Ship rate | Projects that are deployed or pushed to GitHub | Up |
| Developer adoption | Weekly active users who use Developer mode at least once | Up |
| Self-heal success | Errors fixed without the user touching code | Above 80% |
| Cost per build | Groq cost of one full prompt-to-preview build | Under $0.05 |
| Week-1 retention | Users who return within 7 days | Up |

---

## 11. Release plan

Build phases and their test-and-fix rounds are in [implementation_plan.md](implementation_plan.md) section 6.

| Phase | Delivers | Requirements |
|---|---|---|
| P0 | Shell, auth, guest mode, Home, workspace shell | AUTH, HOME-1/4/5/6, WS |
| P1 | Plan, agents, code generation | CHAT, PLAN, AGT, BLD-1 |
| P2 | Live preview, self-heal, code tools, history | BLD-2 to BLD-8, DEV-1 to DEV-3, HIST |
| P3 | GitHub, import, deploy | GIT, DEP |
| P4 | Coverage and polish | ONB, HOME-2/3/7, TPL, USE, SET, DEV-4 to DEV-8, X |
| P5 | Demo data, production, CI, README, submission | Section 10.1 targets |

Every phase ends with a test-and-fix round; no phase starts with open S1 or S2 bugs.

**If time runs short** (§16.1a), demote in this order: deploy becomes a scripted run, then GitHub push is mocked, then the live preview uses prebuilt demo previews. The stage flow, mode toggle, guest mode and design system are never cut.

---

## 12. Dependencies

Accounts, free-tier limits and keys are in [implementation_plan.md](implementation_plan.md) section 10.

| Dependency | Needed for | Note |
|---|---|---|
| Groq | All AI (plan, agents, code, fixes, consultant, voice) | Developer (pay-as-you-go) plan required for code generation; about $0.03 per full build |
| Supabase | Auth, database, storage, realtime | Free plan; keep awake during review |
| Vercel | Hosting Architect and deploying generated apps | Hobby plan; 100 deployments/day shared |
| GitHub | Sign-in, push, import | OAuth app |
| Google Cloud | Google sign-in | OAuth client, published consent screen |
| WebContainers | Live preview | Free for prototypes |
| SMTP provider (optional) | Magic links to any address | Needs a domain |

---

## 13. Risks

Full list with mitigations in §17.

| Risk | Impact on the product | Mitigation |
|---|---|---|
| Groq limits or outages | Builds stall during review | Paid plan, retries, prebuilt demo projects, smaller models for cheap stages |
| Browser preview unsupported (Safari, mobile) | Reviewer sees no live app | Fallback preview, banner, deployed demo link |
| AI output breaks the build | Poor first impression | Structured file writes, allowed-dependency list, self-heal, restore last good |
| Scope larger than the time available | Unfinished flows | Phased plan, dummy flows allowed, cut order above |
| Free database pauses before review | Live URL fails | Daily keep-alive job or temporary upgrade |
| Reviewers can't receive magic links | Sign-in friction | Google, GitHub and guest entry as primary paths |

---

## 14. Assumptions and open questions

**Assumptions**

- Reviewers use a current Chrome or Edge on desktop.
- Reviewers prefer to explore without signing up, so `/try` and seeded demo projects carry the first impression.
- A Groq paid plan is acceptable for the build period.

**Open questions**

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | Is there a domain for magic-link email? | Magic link marked Partial; Google, GitHub and guest are primary |
| Q2 | Should deploys of generated apps be real during review, or scripted? | Real, with the per-user limit; scripted if the Vercel limit becomes a problem |
| Q3 | Where should "Open in Lyzr Studio" point? | Placeholder page explaining the integration |
| Q4 | Record a walkthrough video? | Yes, 2–3 minutes, linked in the README |
| Q5 | Keep the Supabase project on the free plan through judging? | Free plan plus keep-alive job |

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Stage** | One of Plan, Agents, Build, Ship; shown by the stage stepper |
| **Plan** | The requirements document Architect writes for the user's app; must be approved before code is generated |
| **Plan Mode** | Discussing a change as a change plan before any code is written |
| **Reverse plan** | A plan inferred from imported code |
| **Snapshot** | A saved version of the project's files after each change; can be previewed or restored |
| **Healthy snapshot** | A version whose preview loaded with no errors for 3 seconds |
| **Step card** | A chat card showing one unit of AI work with its status and details |
| **Self-heal** | Automatic detection and fixing of build and runtime errors, up to 3 attempts |
| **Simple / Developer mode** | Two views of the same project: outcomes versus code |
| **Guest** | A visitor using `/try` with an anonymous account that can be upgraded |
| **Public key** | The per-project key a deployed app uses to call Architect's agent API |
| **Dummy flow** | A complete, realistic UI flow backed by mocked data |
