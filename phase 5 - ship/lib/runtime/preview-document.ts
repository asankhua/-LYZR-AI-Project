type Block = { name: string; purpose: string; kind: string };
type AgentCard = { name: string; role: string };

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

function readJsonArray(source: string, name: string): unknown[] {
  const token = `const ${name}`;
  const start = source.indexOf(token);
  if (start === -1) return [];
  const equals = source.indexOf("=", start);
  if (equals === -1) return [];
  const bracket = source.indexOf("[", equals);
  if (bracket === -1) return [];
  let depth = 0;
  for (let index = bracket; index < source.length; index += 1) {
    const char = source[index];
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) {
      try {
        return JSON.parse(source.slice(bracket, index + 1)) as unknown[];
      } catch {
        return [];
      }
    }
  }
  return [];
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

function blockHtml(block: Block) {
  const title = escapeHtml(label(block.name));
  const purpose = escapeHtml(block.purpose);
  if (block.kind === "hero") {
    return `<section class="hero"><p class="kicker">${title}</p><h2>${title}</h2><p class="lead">${purpose}</p><a href="#featured">Get started</a></section>`;
  }
  if (block.kind === "grid") {
    const items = ["For you", "Top rated", "New today", "Staff picks"]
      .map((item) => `<article class="card"><h3>${item}</h3><p>${purpose}</p></article>`)
      .join("");
    return `<section><h2>${title}</h2><div class="grid two">${items}</div></section>`;
  }
  if (block.kind === "products") {
    const items = ["Highlight", "Best seller", "Just in"]
      .map((item) => `<article class="card"><div class="swatch"></div><h3>${item}</h3></article>`)
      .join("");
    return `<section id="featured"><h2>${title}</h2><div class="grid three">${items}</div></section>`;
  }
  if (block.kind === "quotes") {
    return `<section><h2>${title}</h2><blockquote class="card">${purpose}</blockquote></section>`;
  }
  if (block.kind === "footer") {
    return `<footer><p>${title}</p></footer>`;
  }
  return `<section><h2>${title}</h2><p>${purpose}</p></section>`;
}

function shell(theme: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    ${theme}
    body { margin: 0; }
    main { max-width: 72rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
    h1, h2, h3 { font-weight: 560; }
    h1 { font-size: 1.35rem; margin: 0; }
    h2 { font-size: 1.35rem; margin: 0 0 0.75rem; }
    .hero h2 { font-size: 2.4rem; line-height: 1.1; margin: 0.35rem 0; }
    .kicker { margin: 0; color: var(--app-accent, #4f46e5); font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; }
    .lead { max-width: 40rem; font-size: 1.05rem; }
    a { display: inline-block; background: var(--app-accent, #4f46e5); color: white; text-decoration: none; border-radius: 6px; padding: 0.55rem 0.9rem; }
    section, footer { padding: 1.25rem 0; border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent); }
    .hero { border-top: 0; padding-top: 0.5rem; }
    .grid { display: grid; gap: 12px; }
    .two { grid-template-columns: 1fr 1fr; }
    .three { grid-template-columns: 1fr 1fr 1fr; }
    .card { border: 1px solid color-mix(in srgb, currentColor 14%, transparent); border-radius: 8px; padding: 0.9rem 1rem; background: color-mix(in srgb, Canvas 86%, CanvasText); }
    .swatch { height: 72px; border-radius: 6px; background: color-mix(in srgb, var(--app-accent, #4f46e5) 18%, transparent); margin-bottom: 8px; }
    .agents { display: flex; flex-wrap: wrap; gap: 8px; margin: 1rem 0 0; }
    .agent { border-radius: 999px; padding: 0.35rem 0.7rem; background: color-mix(in srgb, var(--app-accent, #4f46e5) 14%, transparent); font-size: 0.85rem; }
    .wire { height: 14px; border-radius: 999px; background: color-mix(in srgb, currentColor 10%, transparent); margin: 0.6rem 0; }
    .wire.wide { width: 70%; height: 28px; }
    @media (max-width: 700px) { .two, .three { grid-template-columns: 1fr; } }
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
  const blocks = readJsonArray(home, "blocks").filter((item): item is Block => {
    if (!item || typeof item !== "object") return false;
    const block = item as Block;
    return typeof block.name === "string" && typeof block.kind === "string";
  });
  const title = escapeHtml(readJsonString(app, "title={") || "Your app");
  const summary = escapeHtml(readJsonString(app, "const summary = ") || readJsonString(home, "summary"));
  const agentRow =
    agents.length === 0
      ? ""
      : `<div class="agents">${agents
          .map((agent) => `<span class="agent">${escapeHtml(agent.name)} · ${escapeHtml(agent.role)}</span>`)
          .join("")}</div>`;

  if (blocks.length === 0 && !app) {
    const names = files.map((file) => file.path).slice(0, 6);
    const wires = names.map((name) => `<p class="wire"></p><p>${escapeHtml(name)}</p>`).join("");
    return shell(theme, `<header><h1>Building the app</h1></header><section class="hero"><p class="kicker">Screen</p><p class="wire wide"></p>${wires}</section>`);
  }

  const sections = blocks.map((block) => blockHtml({ ...block, purpose: block.purpose || summary })).join("");
  return shell(
    theme,
    `<header><h1>${title}</h1>${agentRow}</header>${sections}<p data-arch-note="summary">${summary}</p>`,
  );
}
