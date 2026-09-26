# Architect 2.0 — Google Stitch prompts

Prompts for generating wireframes and high-fidelity screens in [Google Stitch](https://stitch.withgoogle.com). They follow the flows, surface specs and design system in [architecture.md](architecture.md): section 3 (routes and layout), section 4 (flows), section 15 (design system) and section 27 (surface specs).

## How to use

1. Start a new **Web** project in Stitch.
2. Paste the **design system prompt** below first, and generate the Home screen with it.
3. For every other screen, paste the screen prompt. Keep the same project, so Stitch reuses the style.
4. Generate **one screen per prompt, and one state per screen**. Stitch does better with one focused screen than with a whole app at once. When a prompt asks for two states in one screen, Stitch adds toggles and "variant" labels to the UI.
5. Refine with short follow-ups ("make the chat panel narrower", "use the accent colour only for the primary button"). Change one thing at a time.
6. For a low-fidelity pass, add this line to any prompt: `Render as a grayscale wireframe with placeholder boxes, no imagery, no colour except the accent for the primary action.`
7. Export to Figma or HTML when a screen is final.

---

## 0. Design system prompt (paste first)

```
Product: "Architect 2.0" — a web app where anyone turns a prompt into a deployed AI-agent application. Two audiences: non-technical users (Simple mode) and developers (Developer mode). Desktop web app, 1440px wide.

Visual direction: calm, focused "workbench". Content first, minimal chrome. Lots of white space, a thin 1px border instead of heavy shadows, soft rounded corners (10px on cards, 6px on inputs and buttons). Do not imitate Lovable, v0, Replit or Cursor.

Colours:
- Background #FAFBFD, surfaces #FFFFFF, secondary surface #F3F5F8
- Borders #E3E6EC
- Text #1F2330, muted text #6B7280
- Accent (primary actions, active states) #4F46E5, accent soft background #EEF0FF
- Success #22A06B, warning #E5A50A, danger #D9443A

Type: Inter for UI, JetBrains Mono for code, file paths and logs. Sizes 12/13/14 (body)/16/20/28/40. Medium weight for headings, regular for body.

Components: shadcn-style buttons (one primary accent button per screen, others neutral outline or ghost), pill badges for status, lucide-style line icons, subtle skeleton loaders, cards with 1px border and very light shadow.

Recurring patterns:
- Logo: a 32px #4F46E5 tile with 10px radius and a white "A", followed by the word "Architect". Use this exact logo on every screen.
- A left app sidebar (64px icon rail that expands to 240px) with: Home, Templates, Marketplace, Import, Usage, Settings, and a Simple/Developer mode switch at the bottom. The rail shows tooltips when collapsed. This is the global mode switch; inside a project, the workspace top bar may show the same switch for that project only. No other screen shows a mode switch. Every screen outside the workspace uses this sidebar; never a horizontal top nav.
- Outside the workspace, the top bar holds a centered search field "Search projects, templates, commands ⌘K" and a notifications icon. No breadcrumbs or connection status.
- In the project workspace, one 56px top bar only: logo, project name, a centered 4-step stage stepper Plan > Agents > Build > Ship (text with a dot, active in #4F46E5, done with a check), then the mode switch, presence avatars, "Share" and one primary action. No second stepper, breadcrumb bar or environment bar below it.
- "Step cards" in chat: an icon, a label, a status (spinner, check, or error) and an expandable detail row.

Strict rules:
- Load Inter and JetBrains Mono. Never fall back to a serif font.
- Use only the colours above. Do not generate a Material-style palette or lavender-tinted backgrounds.
- Every card, panel and input has a 1px #E3E6EC border. Shadows are optional and very faint.
- Radius: 10px cards and panels, 6px buttons and inputs, fully round badges, chips and avatars.
- Stage badges (Plan, Agents, Build) all use the same neutral style: #F3F5F8 background, #1F2330 text, small stage icon. Green only for Live, red only for Error, yellow only for warnings.
- Thumbnails are flat UI screenshots of the app. No photos, laptops, desks or people.
- Icon buttons have visible focus rings and an accessible label. Keep normal scrollbars.
- Exactly one filled #4F46E5 button per screen. Repeated actions in lists or cards (such as "Use template") are outline buttons.
- Never put design annotations in the UI: no "View state", "Variant", "Active selection" or "Selected" labels. Show one state per screen, and the mode switch must match the screen.

Content facts (use these in any visible text):
- The AI model is "Groq · gpt-oss-120b". Never show Claude, GPT-4 or OpenAI as the model.
- Generated apps are "Vite + React + TypeScript". Agents run through Architect's agent API; the default framework is "Default". Other frameworks (LangGraph, CrewAI, OpenAI Agents SDK, GitAgent) only add scaffold files under agents/<name>/ and are never shown as the runtime.
- Web search is "Groq web search". The app's key is VITE_ARCHITECT_KEY. Region is "Mumbai (bom1)". Deploys go to Vercel as static sites.
- No compliance or scale claims (no SOC2, no "18 regions", no Anycast or edge cache stats).
- Import limits: up to 500 files and 5 MB.
- Plain language for non-technical users: say "your app", "agents" and "hours saved", not jargon like "orchestration graph" or "split-ledger settlement".
```

---

## 1. Landing page (logged out)

```
Screen: marketing landing page for Architect 2.0.
Top nav: logo "Architect" on the left; Product, Templates, Docs, Pricing links; "Sign in" ghost button and "Start building" primary button on the right.
Hero: headline "From idea to a live AI app in minutes", subline "Plan it, design the agents, watch it build, and ship — with or without code." A large prompt box in the hero with placeholder "Describe the app you want to build…" and a "Build" button, plus 4 example chips below it (Lead research assistant, HR policy chatbot, Travel planner, Invoice analyzer). Secondary link "Try without an account".
Below: a wide product screenshot frame showing the workspace (chat on the left, live app preview on the right).
Section "How it works": 4 horizontal steps with icons — Plan, Agents, Build, Ship — each with one short sentence.
Section "Built for both": two columns — "For builders without code" (consultant, plan, one-click deploy) and "For developers" (code editor, terminal, GitHub, any agent framework).
Footer with links and a small "Powered by Groq" note.
```

## 2. Sign in

```
Screen: sign-in page, split layout.
Left half (accent-soft background): logo, one-line value "Build and ship agentic apps from a prompt", and a small looping preview card showing a plan turning into an app.
Right half: centered card 400px wide, title "Sign in to Architect". Buttons stacked: "Continue with Google", "Continue with GitHub" (with icons). Divider "or". Email input with "Send magic link" primary button. Below: text link "Try without an account". Tiny legal text at the bottom.
Use Inter for all text. No status lines, cluster names or certification badges.
```

## 2b. Sign in — email sent

```
Screen: the same split sign-in layout. The right card now shows: a mail icon, title "Check your email", text "We sent a sign-in link to asha@acme.com", an "Open mail app" primary button, a disabled "Resend in 30s" link and a "Use a different email" text link.
```

## 3. AI Consultant onboarding

```
Screen: first-run onboarding "AI Consultant", step 2 of 3, centered layout, max width 720px, progress dots at top.
Title: "What takes up most of your week?" Subtitle: "We'll suggest apps that save you the most time."
Multi-select chips grid: Lead outreach, Scheduling, Reporting, Answering the same questions, Screening resumes, Data entry, Research, Writing content. A text input "Something else…".
Bottom: "Back" ghost button, "Skip" text link, "Continue" primary button.
Right side panel (appears as the user answers), titled "Ideas for you": 3 idea cards, each with a title (for example "Lead Nurturing Agent"), a one-line description, agent chips (Researcher, Writer), and a green pill "Saves ~15 hrs/week", with a "Use this" button.
```

## 4. Home

```
Screen: Home, logged in, Simple mode. Left icon sidebar.
Center column max width 880px. Greeting "Good evening, Asha" and large heading "What do you want to build?"
Large prompt box (3 lines tall) with placeholder "Describe your app, who it's for, and what a good result looks like…". Inside the box, bottom row: a "+" button (menu: Attach files, Theme, Add existing agents, Prompt library), a microphone button, a theme chip "Theme: Minimal", and a primary "Build" button with a Cmd+Enter hint.
Below the box: secondary links "Import from GitHub" and "Start blank project". No mode switch here (it lives in the sidebar).
Row "Suggested for you" with 3 idea cards from the AI Consultant.
Row "Start from a template" with a horizontal strip of 5 template cards (thumbnail, name, agent count).
Section "Recent projects" with a small "Filter projects" input: grid of 6 project cards, each with a flat UI screenshot of the app, name, stage badge (Plan, Agents, Build in neutral style; Live in green), and one consistent metadata line such as "Stage 2 of 4 · Last build passed · Edited 2h ago".
Also generate the first-time version: no recent projects; instead an empty state card "Your projects will appear here" with a 4-step explainer Plan, Agents, Build, Ship.
```

## 4b. Home — Developer mode

```
Screen: the same Home layout, with the sidebar mode switch set to Developer.
Differences from Simple mode: "Import from GitHub" becomes a full card next to the prompt box (repo search field and "Import" outline button); the "Suggested for you" row is replaced by "Developer starters" (Vite + React agent app, API-only agent, Blank TypeScript); project cards show the last commit message and short SHA in JetBrains Mono under the name; a "⌘K" hint sits in the prompt box.
```

## 5. Workspace — Plan stage

```
Screen: project workspace for "Travel Planner", stage 1 Plan.
Top bar: project name with a pencil icon, stage stepper Plan (active, accent) > Agents > Build > Ship, Simple/Developer switch, presence avatars, "Share" outline button, "Deploy" button disabled.
Left panel (380px): chat. The user's prompt at top, then an assistant message "Here's a plan. Edit anything, or tell me what to change." and a step card "Drafting plan" with a check. Composer at bottom with a Plan/Build toggle (Plan selected), attach, mic and send.
Right canvas: tabs Preview, Plan (active), Agents. The Plan document shows sections with headings: Summary, Who it's for, User journey (numbered steps), Screens (cards: Search, Itinerary, Saved trips), Agents (chips: Planner, Flight Finder, Hotel Scout), Data (collections), Integrations, Open questions (2 questions with answer inputs). Each section has a subtle "Edit" icon on hover.
Sticky bottom bar on the canvas: "Looks good? Agents are designed next." with "Approve plan" primary button and "Ask for changes" outline button.
```

## 6. Workspace — Agents stage

```
Screen: workspace stage 2 Agents, same shell as the Plan screen, stepper shows Plan done (check), Agents active.
Canvas: an agent graph on a dotted background. Top node "Trip Manager" (manager badge), connected to three child nodes: "Flight Finder", "Hotel Scout", "Itinerary Writer". Each node card shows name, one-line role, a framework badge (Default), and small chips for tools (Web search, Google Calendar) and knowledge (travel_policy.pdf).
A right drawer is open for "Hotel Scout" with tabs: Overview, Instructions, Tools, Knowledge, Framework, Test, Runs. The Instructions tab shows an editable text area. Framework tab preview: radio cards for Default, Lyzr, LangGraph, CrewAI, OpenAI Agents SDK, GitAgent (beta).
Bottom bar: "Approve agents" primary and "Test all" outline.
```

## 6b. Agents — Test tab

```
Screen: workspace stage 2 Agents, same shell and graph as the Agents screen. The right drawer for "Hotel Scout" has the Test tab open.
Top of the drawer: a "Test message" input pre-filled "Find 3 hotels in Shinjuku under $150 for Oct 12–15, near a station" and a "Run test" primary button.
Below: a trace timeline of the run as step cards: "Read instructions" (check, 0.1s), "Called Web search" (check, 1.2s, query shown in JetBrains Mono), "Called Google Places" (check, small neutral "Sample data" pill), "Wrote answer" (check). Each step expands to show input and output in JetBrains Mono.
Result card: the agent's answer as 3 hotel rows (name, area, price per night, walk to station) and a footer "1,240 tokens · 2.8s · Groq · gpt-oss-120b".
Two outline buttons: "Save as test case" and "Compare with previous version". On the graph, the Hotel Scout node shows a small green "Test passed" pill.
```

## 7. Workspace — Build in progress ("UI getting built")

```
Screen: workspace stage 3 Build, building in progress.
Left chat panel shows a sequence of step cards: "Layout and theme" (check, 4 files), "Pages" (check, 3 files), "Components" (spinner, writing), "Wiring agents" (pending), "Checking" (pending). Under the active card, file-op rows in monospace: "created src/components/TripCard.tsx +48", "updated src/App.tsx +12 -3".
Right canvas Preview tab: a skeleton of the app's page structure (header, search bar, card grid as grey blocks) with a small overlay pill "Installing dependencies… 62%".
Bottom status bar across the workspace: runtime state "Installing", snapshot id "v7", credits used "1,240 tokens".
Composer shows a "Stop" button instead of send.
```

## 8. Workspace — Preview ready with element picker

```
Screen: workspace Build stage, preview ready.
Right canvas Preview tab shows a finished travel planner web app inside a browser-like frame (search form, three itinerary cards). Preview toolbar above it: device toggles (desktop, tablet, mobile), refresh, "Open in new tab", an element-picker icon (active), and a console toggle.
The element picker is active: the "Search trips" button inside the preview has an accent outline and a small label "src/components/SearchBar.tsx".
Left chat composer is pre-filled: "In SearchBar: make the button full width on mobile and rename it to Plan my trip".
Chat above shows the last assistant message: "Your app is ready. Try it on the right, or point at anything to change it." with quick action chips: "Add login", "Make it dark", "Deploy".
Top bar "Deploy" button is now enabled (primary).
```

## 9. Workspace — Developer mode (code, terminal, diff)

```
Screen: workspace in Developer mode, same project.
Top bar mode switch shows Developer. Canvas tabs: Preview, Plan, Agents, Code (active), Terminal, Database, Env, Git.
Layout of the Code tab: file tree on the left (src/ with components/, pages/, lib/agents.ts, App.tsx, main.tsx; agents/ with trip-manager/ and hotel-scout/ folders holding agent.json; package.json, vite.config.ts), a Monaco-style editor in the middle showing TypeScript React code in JetBrains Mono with syntax highlighting, one column of code with continuous line numbers 1 to 40, and a narrow right pane "Changes in v8" showing a side-by-side diff with green and red lines.
Status bar at the bottom: "Groq · gpt-oss-120b", "Vite 5", "Snapshot v8", "Preview running". No LangGraph or edge runtime labels.
Bottom of the canvas: a docked terminal panel showing "npm run dev" output and "VITE ready in 820 ms".
Chat panel on the left is collapsed to a narrow rail with an expand icon.
```

## 10. Error and self-heal state

```
Screen: workspace Preview tab with a runtime error.
The preview frame is dimmed and shows an error overlay: "Failed to resolve import './TripMap' from src/pages/Itinerary.tsx".
Chat panel shows a step card "Fixing 1 error automatically (attempt 2 of 3)" with a spinner and a live step list (Read error, Found missing file, Writing fix), and under it a collapsed "Show details" row.
Console drawer open at the bottom listing 2 errors with a "Fix" link on each.
Show the error in the overlay, the chat card and the console only; no extra banners in the top bar.
```

## 10b. Error — couldn't fix automatically

```
Screen: the same workspace after 3 failed attempts. The preview overlay stays.
Chat panel shows one red-bordered card "Couldn't fix automatically": one sentence on what failed (src/components/TripMap.tsx doesn't exist), a "Suggested fixes" list with 2 one-click rows, and three buttons: "Try again" (primary), "Show details" (outline), "Restore last good version" (ghost, with a history icon).
```

## 11. Git tab (GitHub integration)

```
Screen: workspace Developer mode, Git tab active.
Header card: GitHub connected as "asha-dev", repo "asha-dev/travel-planner" with an external-link icon, branch selector "main", and a toggle "Auto-commit after each successful build" (on).
Status banner: "2 changes not pushed" with "Push" primary and "Pull" outline buttons.
Commit list: rows with commit message ("Add itinerary export"), short SHA in monospace, linked version badge (v8), author avatar, and time.
Full-width layout; show only the connected state.
```

## 11b. Git tab — not connected

```
Screen: the same Git tab before GitHub is connected. Centered empty state: a flat illustration (app tile, arrows, GitHub mark), title "Own your code", text "Connect GitHub to create a repo and keep it in sync", three short benefit rows (push and pull, you own the code, every version is a commit), and a "Connect GitHub" primary button.
```

## 12. Deploy wizard

```
Screen: deploy flow as a centered modal (640px) over the workspace, step 1 of 3.
Stepper inside the modal: Name > Options > Confirm.
Step 1: input "Choose your app's address" with the field "travel-planner" followed by a fixed suffix ".vercel.app", and a green inline check "Available".
Pre-flight checklist under it: "Build passes" (check), "No errors in preview" (check), "Environment variables set" (warning, 1 missing: VITE_ARCHITECT_KEY, with a "Generate key" link).
Footer: "Cancel" ghost, "Next" primary.
Show step 2 as a second screen: toggles for "Analytics", "Publish to Marketplace" (expands category, short description, tags), and a "Custom domain" input marked "Coming soon". Label every icon-only button.
```

## 12b. Deploy wizard — step 3 Confirm

```
Screen: the same deploy modal, step 3 of 3 (Name and Options done with checks, Confirm active).
Summary list with an "Edit" link per row: Address travel-planner.vercel.app; Analytics On; Marketplace Public, Travel; Environment variables 3 set (VITE_ARCHITECT_URL, VITE_ARCHITECT_KEY, VITE_MAPS_KEY, values masked); Source Snapshot v8, healthy.
Note: "Usually takes about 45 seconds. You can keep working while it deploys."
Footer: "Back" ghost, "Deploy" primary with a rocket icon.
```

## 13. Deploy status and success

```
Screen: deploy status page for "Travel Planner".
Top: a horizontal progress track Queued (check) > Building (check) > Ready (active, green).
Success card: large green check, "Your app is live", the URL "travel-planner.vercel.app" with copy and open buttons, a QR code, and share buttons (copy link, email, LinkedIn).
Below: collapsible "Build logs" in a dark monospace panel.
Right column: "Deployments" history list with status pills (Ready, Error), version, time, and "Redeploy" / "Promote" actions.
Use the workspace shell with Ship active in the stepper. No region, edge, cache or latency stats.
```

## 13b. Deploy failed

```
Screen: deploy status page for "Travel Planner" after a failed deploy. Same shell as the deploy status screen, Ship active.
Progress track: Queued (check) > Building (red error icon) > Ready (grey, not reached).
Error card with a red left border: title "Deploy failed during build", one plain sentence "The build couldn't find src/components/TripMap.tsx.", buttons "Fix with AI" (primary) and "View full logs" (outline), and a text link "Redeploy last good version (v7)".
Note under the card: "Your live app is still running v7."
Build logs panel open in dark monospace, with the failing line highlighted in red.
Right column: Deployments list with this deploy on top marked "Error" and v7 below it marked "Ready · Live".
```

## 14. Import a project

```
Screen: Import page.
Two large option cards side by side: "Import from GitHub" (selected) and "Upload a zip".
Under GitHub: a search input and a list of repositories (name, private/public badge, language, updated time) with a "Import" button per row; a branch selector appears on the selected row.
Right panel "What happens next": 1 We copy your code (up to 500 files), 2 We detect the framework, 3 We write a plan from your code so your team can follow it, 4 Preview starts (Vite React) or code-only mode for other frameworks.
Progress state variant: a card "Importing asha-dev/crm-dashboard" with steps Fetching files (check), Detecting framework: Vite React (check), Writing plan (spinner).
```

## 15. Version history

```
Screen: project History page.
Left: vertical timeline of versions v1 to v9, each with the prompt that caused it ("Add dark mode"), author avatar, time, files changed count, and a green "healthy" dot or a red "had errors" dot.
Selected version v6 on the right: a preview thumbnail of the app at that version, a file change list, and a diff viewer for the selected file.
Actions: "Preview this version" outline, "Restore" primary. A note under Restore: "Restoring creates a new version. Nothing is deleted."
```

## 16. Usage dashboard

```
Screen: Usage page.
Top KPI cards: Tokens this month, Estimated cost, Builds, Deploys, each with a small trend sparkline.
Main chart: stacked bar chart of tokens per day, stacked by stage (Plan, Agents, Codegen, Fix, Agent runs).
Two tables below: "By project" (name, tokens, cost, last active) and "By agent" (agent, project, runs, avg latency, tokens).
Plan badge in the header "Free tier" with an "Upgrade" outline button.
```

## 17. Settings and integrations

```
Screen: Settings page with left sub-navigation: Profile, Mode, Connected accounts, Model keys, Integrations, Danger zone. "Integrations" selected.
Grid of integration cards with logos and a Connect button: Gmail, Slack, Notion, Google Calendar, HubSpot, Jira, Linear, Google Sheets, GitHub (Connected, green pill). A card "MCP server" with an "Add server" button.
"Model keys" preview section: Groq key (connected, masked), OpenAI and Anthropic inputs marked "Coming soon".
```

## 18. Templates and Marketplace

```
Screen: Templates page with a filter bar (All, Sales, HR, Support, Research, Finance, Developer starters) and a search input.
Grid of template cards: flat app thumbnail, name, one-line description, a stack line "Vite + React · 3 agents", and a "Use template" outline button.
A second tab "Marketplace" in the header: community app cards with author avatar, clone count, category tag, and "Clone" button.
```

## 19. Mobile workspace

```
Screen: the project workspace on a mobile phone (390px wide).
Top: project name "Travel Planner" as the title (never "Terminal Console") and a compact stage indicator "Build · 3/4".
Two tabs under it: "Chat" and "Preview" (Chat active); use the same tab control on both mobile screens. Chat shows step cards and the last assistant message. Sticky composer at the bottom with attach, mic and send.
A floating "Preview" pill button above the composer that doesn't cover message text.
Show a second screen with the Preview tab active: the generated app full width, a small toolbar with refresh and "Open in browser".
```

## 20. Guest banner and empty states (component sheet)

```
Screen: a component sheet showing states side by side on a neutral canvas.
1. Guest banner across the top of the app: "You're trying Architect as a guest. Sign up to keep your work." with a "Sign up" button and a dismiss icon.
2. Empty Agents tab: icon, text "Agents are designed after you approve the plan", button "Go to plan".
3. Rate-limited chat card: "We're getting a lot of requests. Retrying in 12s" with a countdown ring.
4. Toasts: success "Pushed to GitHub", error "Deploy failed — see logs".
5. Loading skeletons for the project grid and the plan document.
```

## 21. Command palette (⌘K)

```
Screen: Home in Simple mode, dimmed, with a command palette open in the centre (640px wide, 1px border, 10px radius).
Search input at the top with the query "trav" and an "Esc" hint.
Grouped results with small group labels: Projects (Travel Planner — Build stage; Travel Expense Bot — Live), Templates (Multi-agent travel planner), Commands (New project ⌘N, Import from GitHub, Switch to Developer mode, Open settings), Files in Travel Planner (src/pages/Itinerary.tsx in JetBrains Mono).
The first row is highlighted with a #EEF0FF background. Each row has a line icon on the left and a hint or shortcut on the right.
Footer: "↑↓ to move · ↵ to open · Esc to close".
```

## 22. Share dialog

```
Screen: project workspace (Build stage, preview ready), dimmed, with a "Share Travel Planner" modal (520px) open.
Invite row: email input "name@company.com", a role select "Editor", and an "Invite" primary button.
People list: Asha (you, Owner), Jordan Diaz (Editor), Sam Kim (Viewer, neutral "Invite pending" pill), each with an avatar and a role dropdown.
Section "Link sharing": a toggle "Anyone with the link can view the preview" (off) and a read-only link with a "Copy link" outline button.
Footer note: "To share the live app, deploy it from the Ship stage."
```

---

## Fix pass for the first generation

The first export (in `stitch_design/`) covered all 20 screens with strong layouts, but the screens don't share one shell and some text contradicts the architecture. Instead of regenerating from scratch, open each screen in Stitch and edit it with prompt A, then with its line from B. After that, generate the new screens 2b, 4b, 6b, 10b, 11b, 12b, 13b, 21 and 22 from the prompts above.

Colours and radius will come from our own tokens in code, so don't spend edits on exact hex values; fix the shell, states and text first.

### A. Global edit (every screen)

```
Edit this screen to follow these rules, keeping the layout and content otherwise:
- Logo: a 32px #4F46E5 tile with 10px radius and a white "A", then the word "Architect". Same on every screen.
- Outside a project: 64px left icon sidebar (Home, Templates, Marketplace, Import, Usage, Settings; Simple/Developer switch and avatar at the bottom) and a top bar with only "Search projects, templates, commands ⌘K" and notifications. Remove any horizontal top nav.
- Inside a project: one 56px top bar only: logo, project name, centered stepper "Plan · Agents · Build · Ship", mode switch, avatars, Share, one primary action. Remove any second stepper, breadcrumb bar or environment bar. The mode switch must match the screen.
- Exactly one filled #4F46E5 button; turn the others into outline or ghost buttons.
- Remove every design annotation (View state, Variant, Active selection, Selected labels). Show one state only.
- Text facts: the model is "Groq · gpt-oss-120b" (never Claude or OpenAI). Generated apps are "Vite + React + TypeScript" with the "Default" agent framework. Region "Mumbai (bom1)". No SOC2, Anycast, edge-region or cache claims.
- Load Inter and JetBrains Mono (no serif fallback). 1px #E3E6EC borders instead of shadows. Label every icon-only button. Normal scrollbars.
```

### B. Per-screen edits

```
Home (both versions): load JetBrains Mono so chips, "Saves ~15 hrs/wk" pills and project metadata lines never render in a serif font.
Landing: replace "Next.js client UI & FastAPI" and "LangGraph state machine" with "Vite + React app" and "Default agent runtime". Keep one "Start building" primary.
Sign in: use Inter everywhere; remove the "View State" toggle, "SOC2 Type II Certified" and "Cluster us-east-1".
Onboarding: replace "Claude 3.5 Sonnet" with "Groq · gpt-oss-120b"; say "hours saved" instead of "engineering hours".
Plan: rewrite the summary in plain language ("A shared trip planner where a group votes on flights and hotels, gets a daily itinerary and splits costs").
Agents: move the "Selected" tag so it doesn't cover the Hotel Scout title; the web search tool is "Groq web search".
Build: remove the second stepper bar and the second mode switch.
Preview ready: remove the disabled top-bar "Deploy"; the single primary is "Deploy". Replace photos in the itinerary cards with flat illustrated thumbnails.
Error: keep only the "Fixing automatically (attempt 2 of 3)" card; remove the top-bar error pill and the "Couldn't fix" card (that's screen 10b).
Developer code: fix the editor to one column with continuous line numbers; the switch shows Developer; the status bar shows "Groq · gpt-oss-120b · Vite 5 · Snapshot v8" with no LangGraph runtime.
Git: remove the "Not connected" side panel (that's screen 11b) and make the connected view full width; only "Push" is filled.
Deploy step 1: the missing variable is VITE_ARCHITECT_KEY with a "Generate key" link.
Deploy step 2: label the icon-only buttons.
Deploy status: remove Anycast, 18-region, edge TTFB and cache stats and "LangGraph edge runtime"; keep URL, QR code, share, build log and deployment list.
Version history: use the workspace top bar with no stage highlighted and a "History" title; keep the "Restoring creates a new version" note.
Import: remove the "ACTIVE SELECTION" tag and "edge-us-east-1"; the zip limit is 5 MB and 500 files.
Settings: remove the "Anthropic Standard" badge and "ENV: production-us-east".
Usage: use the sidebar shell; chart colours are shades of #4F46E5 plus #22A06B and #E5A50A.
Templates: use the sidebar shell; "Use template" becomes an outline button; stack lines read "Vite + React · N agents"; keep one tab control, not two.
Mobile chat and preview: title "Travel Planner", not "Terminal Console"; use the same Chat/Preview tab control on both; the floating Preview pill must not cover text.
Component sheet: remove spec labels such as "DS-SPEC-204" and "Target cadence 60fps"; keep the states.
```

---

## Dark mode variant

Add to any prompt:

```
Render in dark mode: background #0F1117, surfaces #161922, secondary surface #1D212B, borders #2A2F3A, text #E6E8EE, muted text #9AA1AE, accent #818CF8, accent soft background #1E2140. Keep the same layout.
```

## Suggested generation order

1. Home (with the design system prompt) — sets the style for everything else.
2. Workspace Plan, Agents (and Test tab), Build, Preview ready — the core flow the judges care about most.
3. Deploy wizard (steps 1, 2, 3), success and failed, Git tab (connected and not connected).
4. Developer mode, error and self-heal (fixing and couldn't fix), import, history.
5. Landing, sign in (and email sent), onboarding, Home in Developer mode.
6. Usage, settings, templates, mobile, component sheet, command palette, share dialog.
