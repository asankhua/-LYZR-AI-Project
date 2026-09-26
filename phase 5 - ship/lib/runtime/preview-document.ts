type Block = { name: string; purpose: string; kind: string };
type AgentCard = { name: string; role: string };
type Item = { title: string; detail: string; tag: string };
type AppModel = { search: { label: string; placeholder: string }; sections: { title: string; items: Item[] }[] };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readJsonString(source: string, token: string): string {
  const start = source.indexOf(token);
  if (start === -1) return "";
  const slice = source.slice(start + token.length).trimStart();
  if (!slice.startsWith('"')) return "";
  let index = 1;
  while (index < slice.length) {
    if (slice[index] === "\\") {
      index += 2;
      continue;
    }
    if (slice[index] === '"') break;
    index += 1;
  }
  try {
    return JSON.parse(slice.slice(0, index + 1)) as string;
  } catch {
    return "";
  }
}

function readJsonValue(source: string, name: string): unknown {
  const token = `const ${name}`;
  const start = source.indexOf(token);
  if (start === -1) return null;
  const equals = source.indexOf("=", start);
  if (equals === -1) return null;
  const slice = source.slice(equals + 1);
  const opener = slice.search(/[[{]/);
  if (opener === -1) return null;
  const open = slice[opener];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = opener; index < slice.length; index += 1) {
    const char = slice[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(slice.slice(opener, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function sampleRecords(title: string): Item[] {
  const text = title.toLowerCase();
  const packs: { test: RegExp; items: Item[] }[] = [
    {
      test: /book|read|library|store/,
      items: [
        { title: "Staff picks", detail: "Four titles the shop wants on the front table this week.", tag: "Shelf" },
        { title: "New this week", detail: "Arrivals, with author, price, and a one-line reason to open it.", tag: "New" },
        { title: "Reading list", detail: "A short list a customer can save and come back to.", tag: "Saved" },
      ],
    },
    {
      test: /travel|trip|itinerary|flight|hotel/,
      items: [
        { title: "Weekend in Lisbon", detail: "Flights, two neighborhoods, and a dinner that does not need a booking.", tag: "Trip" },
        { title: "Split the hotel", detail: "Three people, one room rate, and who still owes what.", tag: "Cost" },
        { title: "Rainy day swap", detail: "The outdoor stop replaced with a museum that is open late.", tag: "Change" },
      ],
    },
    {
      test: /receipt|invoice|shop|order|finance/,
      items: [
        { title: "Today's receipts", detail: "Eight photos, three missing a total, one that looks like a duplicate.", tag: "Inbox" },
        { title: "Needs a category", detail: "Lunch, supplies, and a charge that does not match a vendor.", tag: "Review" },
        { title: "Ready to export", detail: "The rows a bookkeeper can download without retyping.", tag: "Export" },
      ],
    },
    {
      test: /candidate|hire|recruit|resume/,
      items: [
        { title: "Screening queue", detail: "Twelve resumes, ranked by the role's must-have skills.", tag: "Queue" },
        { title: "Interview notes", detail: "What each interviewer wrote, in one place.", tag: "Notes" },
        { title: "Next conversation", detail: "Who to call, and the one question still unanswered.", tag: "Next" },
      ],
    },
  ];
  return packs.find((pack) => pack.test.test(text))?.items ?? [];
}

function label(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function agentsFrom(source: string): AgentCard[] {
  const agents: AgentCard[] = [];
  const pattern = /name:\s*"((?:\\.|[^"\\])*)"\s*,\s*role:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of source.matchAll(pattern)) {
    try {
      agents.push({
        name: JSON.parse(`"${match[1]}"`) as string,
        role: JSON.parse(`"${match[2]}"`) as string,
      });
    } catch {
      agents.push({ name: match[1] ?? "Agent", role: match[2] ?? "" });
    }
  }
  return agents;
}

function isSearch(name: string) {
  return /search|query|prompt|ask|input|bar/i.test(name);
}

function isList(block: Block) {
  return block.kind === "grid" || block.kind === "products" || /list|question|card|result|feed|recent|grid|product/i.test(block.name);
}

function legacyModel(blocks: Block[], summary: string, agents: AgentCard[], title: string): AppModel {
  const searchBlock = blocks.find((block) => isSearch(block.name));
  const listBlock = blocks.find((block) => isList(block));
  const clauses = (listBlock?.purpose || summary)
    .split(/[.:]|(?:\s+and\s+)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);
  const tags = ["Recent", "Popular", "Saved", "Pinned"];
  const items: Item[] = [
    ...clauses.slice(0, 4).map((text, index) => ({ title: text, detail: listBlock?.purpose || summary, tag: tags[index % tags.length] ?? "Recent" })),
    ...agents.map((agent) => ({ title: agent.name, detail: agent.role, tag: "Agent" })),
    ...blocks
      .filter((block) => block !== searchBlock && block !== listBlock)
      .map((block) => ({ title: label(block.name), detail: block.purpose || summary, tag: "Screen" })),
  ].slice(0, 8);
  if (items.length === 0) items.push({ title, detail: summary || title, tag: "Recent" });
  return {
    search: { label: searchBlock ? label(searchBlock.name) : "Search", placeholder: `Search ${title}` },
    sections: [{ title: listBlock ? label(listBlock.name) : "Results", items }],
  };
}

function asModel(value: unknown): AppModel | null {
  if (!value || typeof value !== "object") return null;
  const model = value as AppModel;
  if (!model.search || !Array.isArray(model.sections)) return null;
  return model;
}

function screenHtml(model: AppModel, title: string, summary: string, agents: AgentCard[]) {
  const agentRow = agents
    .map((agent) => `<span class="agent">${escapeHtml(agent.name)} · ${escapeHtml(agent.role)}</span>`)
    .join("");
  const recordCount = model.sections.reduce((sum, section) => sum + section.items.length, 0);
  return `<nav>
    <button type="button" class="on" data-view="overview">Overview</button>
    <button type="button" data-view="browse">Browse</button>
    <button type="button" data-view="agents">Agents</button>
  </nav>
  <div class="stats">
    <article class="stat"><span>Records</span><strong>${recordCount}</strong></article>
    <article class="stat"><span>Agents</span><strong>${agents.length}</strong></article>
    <article class="stat"><span>Sections</span><strong>${model.sections.length}</strong></article>
  </div>
  <div data-pane="overview">
  <header class="top">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="agents">${agentRow}</div>
    </div>
    <form class="search" id="search-form" action="#" onsubmit="event.preventDefault(); return false;">
      <label for="q">${escapeHtml(model.search.label)}</label>
      <div class="search-row">
        <input id="q" type="search" placeholder="${escapeHtml(model.search.placeholder)}" autocomplete="off" />
        <button type="submit">Search</button>
      </div>
    </form>
  </header>
  </div>
  <div class="workspace" data-pane="browse">
    <div>
      ${model.sections
        .map(
          (section, sectionIndex) => `<section>
        <div class="section-head"><h2>${escapeHtml(section.title)}</h2>${sectionIndex === 0 ? `<span class="count" id="count"></span>` : ""}</div>
        <div class="scroller compact">${section.items
          .map(
            (item, index) => `<button type="button" class="card tone-${index % 4}" data-card="${escapeHtml(`${item.title} ${item.detail} ${item.tag}`)}" data-title="${escapeHtml(item.title)}" data-detail="${escapeHtml(item.detail)}">
          <span class="tag">${escapeHtml(item.tag)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <span class="muted">${escapeHtml(item.detail)}</span>
        </button>`,
          )
          .join("")}</div>
      </section>`,
        )
        .join("")}
      <p class="empty" id="empty" hidden>No matches.</p>
    </div>
    <aside id="detail">
      <p class="kicker">Selected</p>
      <h2 id="detail-title"></h2>
      <p id="detail-body"></p>
      <p class="reply" id="reply" hidden></p>
      <button type="button" id="ask">Ask the agent</button>
      <p data-arch-note="summary">${escapeHtml(summary)}</p>
    </aside>
  </div>
  <div data-pane="agents" hidden>
    <div class="scroller">${agents.map((agent) => `<article class="card"><strong>${escapeHtml(agent.name)}</strong><span class="muted">${escapeHtml(agent.role)}</span></article>`).join("")}</div>
  </div>
  <script>
    const input = document.querySelector("#q");
    const cards = Array.from(document.querySelectorAll("[data-card]"));
    const empty = document.querySelector("#empty");
    const count = document.querySelector("#count");
    const title = document.querySelector("#detail-title");
    const body = document.querySelector("#detail-body");
    const reply = document.querySelector("#reply");
    function visibleCards() { return cards.filter((card) => !card.hidden); }
    function select(card) {
      cards.forEach((item) => item.classList.toggle("on", item === card));
      title.textContent = card.dataset.title || "";
      body.textContent = card.dataset.detail || "";
      reply.hidden = true;
    }
    function applyFilter() {
      const query = (input && input.value ? input.value : "").trim().toLowerCase();
      cards.forEach((card) => { card.hidden = Boolean(query) && !String(card.dataset.card || "").toLowerCase().includes(query); });
      const shown = visibleCards();
      empty.hidden = shown.length > 0;
      if (count) count.textContent = shown.length + " shown";
      if (shown.length && !shown.some((card) => card.classList.contains("on"))) select(shown[0]);
    }
    cards.forEach((card) => card.addEventListener("click", () => select(card)));
    input && input.addEventListener("input", applyFilter);
    document.querySelector("#search-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      show("browse");
    });
    function show(name) {
      const agentsOn = name === "agents";
      const overview = document.querySelector('[data-pane="overview"]');
      const browse = document.querySelector('[data-pane="browse"]');
      const agentsPane = document.querySelector('[data-pane="agents"]');
      if (overview) overview.hidden = agentsOn;
      if (browse) browse.hidden = agentsOn;
      if (agentsPane) agentsPane.hidden = !agentsOn;
      const stats = document.querySelector(".stats");
      if (stats) stats.hidden = name !== "overview";
      document.querySelectorAll('[data-pane="browse"] .scroller').forEach((node) => node.classList.toggle("compact", name === "overview"));
      document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("on", button.getAttribute("data-view") === name));
    }
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => show(button.getAttribute("data-view"))));
    document.querySelector("#ask")?.addEventListener("click", () => {
      reply.hidden = false;
      reply.textContent = "Answer drafted for " + (title.textContent || "this item") + ".";
    });
    if (cards[0]) select(cards[0]);
    applyFilter();
  </script>`;
}

function shell(theme: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    ${theme}
    [hidden] { display: none !important; }
    body { margin: 0; background: color-mix(in srgb, var(--app-bg, #fff) 82%, #e7eaf3); color: var(--app-text, #1f2330); font-family: var(--app-font, Inter, sans-serif); }
    main { max-width: 72rem; margin: 0 auto; padding: 1.25rem; }
    h1, h2 { font-weight: 640; letter-spacing: -0.02em; }
    h1 { font-size: 1.45rem; margin: 0; }
    h2 { font-size: 1.15rem; margin: 0; }
    .top { display: grid; gap: 14px; margin-bottom: 14px; }
    .agents { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .agent { border-radius: 999px; padding: 0.28rem 0.65rem; background: #fff; color: var(--app-accent, #4f46e5); font-size: 0.8rem; border: 1px solid color-mix(in srgb, var(--app-accent, #4f46e5) 35%, white); }
    .search label { display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; }
    .search-row { display: flex; gap: 8px; }
    .search input { flex: 1; border: 1px solid #d5d9e4; border-radius: 12px; padding: 0.8rem 0.95rem; font-size: 1rem; background: #fff; }
    nav { display: flex; gap: 8px; margin-bottom: 14px; }
    nav button { background: #fff; color: inherit; border: 1px solid color-mix(in srgb, var(--app-accent, #4f46e5) 40%, white); border-radius: 999px; padding: 0.35rem 0.8rem; }
    nav button.on { background: var(--app-accent, #4f46e5); color: #fff; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
    .stat { background: #fff; border: 1px solid #e3e6ee; border-radius: 12px; padding: 0.75rem 0.9rem; }
    .stat span { display: block; color: #5c6578; font-size: 0.75rem; }
    .search button, #ask { border: 0; border-radius: 12px; background: var(--app-accent, #4f46e5); color: white; padding: 0.8rem 1rem; font-weight: 650; }
    .workspace { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.85fr); gap: 16px; align-items: start; }
    .section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .count { color: #6b7280; font-size: 0.8rem; }
    .scroller { max-height: 460px; overflow: auto; display: grid; gap: 10px; padding-right: 4px; }
    .card, .stat, aside, .search input, nav button, .agent { color: #1c2130; }
    .scroller.compact { max-height: 220px; }
    .card { text-align: left; background: #fff; border: 1px solid #e3e6ee; border-left: 4px solid var(--app-accent, #4f46e5); border-radius: 12px; padding: 0.85rem 1rem; display: grid; gap: 4px; box-shadow: 0 1px 0 rgba(20, 24, 40, 0.04); }
    .card.on { background: color-mix(in srgb, var(--app-accent, #4f46e5) 10%, white); }
    .tone-1 { border-left-color: #0f9f6e; }
    .tone-2 { border-left-color: #d97706; }
    .tone-3 { border-left-color: #db2777; }
    .tag { color: var(--app-accent, #4f46e5); font-size: 0.72rem; font-weight: 750; }
    .muted { color: #5c6578; font-size: 0.92rem; }
    aside { position: sticky; top: 12px; background: #fff; border-radius: 16px; padding: 1rem 1.1rem; border: 1px solid #e3e6ee; }
    .kicker { margin: 0; color: var(--app-accent, #4f46e5); font-size: 0.75rem; font-weight: 750; }
    .reply { background: #f4f6fb; border-radius: 10px; padding: 0.75rem; }
    .empty { color: #6b7280; }
    @media (max-width: 800px) { .workspace, .search-row { grid-template-columns: 1fr; display: grid; } .search-row { display: flex; } }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export function previewHasScreen(files: { path: string; content: string }[]) {
  return files.some((file) => file.path === "src/pages/Home.tsx" || file.path === "src/App.tsx");
}

export function previewDocument(files: { path: string; content: string }[]) {
  const home = files.find((file) => file.path === "src/pages/Home.tsx")?.content ?? "";
  const app = files.find((file) => file.path === "src/App.tsx")?.content ?? "";
  const theme = files.find((file) => file.path === "src/theme.css")?.content ?? "";
  const agents = agentsFrom(files.find((file) => file.path === "src/lib/agents.ts")?.content ?? "");
  const title = readJsonString(app, "title={") || "Your app";
  const summary = readJsonString(app, "const summary = ") || readJsonString(home, "summary");
  const model = asModel(readJsonValue(home, "model"));
  const blocks = (Array.isArray(readJsonValue(home, "blocks")) ? (readJsonValue(home, "blocks") as unknown[]) : []).filter((item): item is Block => {
    if (!item || typeof item !== "object") return false;
    const block = item as Block;
    return typeof block.name === "string";
  });

  if (!model && blocks.length === 0 && !app) {
    const names = files.map((file) => `<p>${escapeHtml(file.path)}</p>`).join("");
    return shell(theme, `<header class="top"><h1>Building the app</h1></header>${names}`);
  }

  const view = model ?? legacyModel(blocks, summary, agents, title);
  const extra = sampleRecords(title).filter((item) => !view.sections.some((section) => section.items.some((row) => row.title === item.title)));
  if (extra.length > 0 && view.sections[0]) {
    view.sections[0] = { ...view.sections[0], items: [...extra, ...view.sections[0].items].slice(0, 8) };
  }
  return shell(theme, screenHtml(view, title, summary, agents));
}
