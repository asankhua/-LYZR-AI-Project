import type { PlanDoc } from "@/lib/types";
import { themeCss } from "@/lib/templates/themes";

export type GeneratedFile = { path: string; content: string };

const shims = `declare module "react" {
  export function useState<T>(initial: T): [T, (value: T) => void];
}
declare module "react/jsx-runtime" {
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
}
declare module "react-dom/client" {
  export function createRoot(element: Element): { render(node: unknown): void };
}
declare module "*.css";
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

function blockKind(name: string): "hero" | "grid" | "products" | "quotes" | "footer" | "section" | "skip" {
  const value = name.toLowerCase();
  if (value === "header") return "skip";
  if (value.includes("hero") || value.includes("banner") || value.includes("prompt")) return "hero";
  if (value.includes("categor") || value.includes("grid") || value.includes("list")) return "grid";
  if (value.includes("product") || value.includes("feature") || value.includes("carousel") || value.includes("deal")) return "products";
  if (value.includes("testimonial") || value.includes("quote") || value.includes("review")) return "quotes";
  if (value.includes("footer")) return "footer";
  return "section";
}

export function templateFiles(plan: PlanDoc): GeneratedFile[] {
  const title = plan.title.replace(/[<>&]/g, "");
  const agentLines = plan.agents
    .map((agent) => `  { name: ${JSON.stringify(agent.name)}, role: ${JSON.stringify(agent.role)} },`)
    .join("\n");
  const blocks = plan.screens.flatMap((screen) =>
    screen.components
      .map((name) => ({ name, purpose: screen.purpose, kind: blockKind(name) }))
      .filter((block) => block.kind !== "skip"),
  );
  if (blocks.length === 0) {
    for (const screen of plan.screens) blocks.push({ name: screen.name, purpose: screen.purpose, kind: "section" });
  }
  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "generated-app",
          private: true,
          type: "module",
          scripts: { dev: "vite --host 127.0.0.1 --port 5173", build: "vite build" },
          dependencies: { react: "19.0.0", "react-dom": "19.0.0", "react-router-dom": "7.1.1" },
          devDependencies: { vite: "6.0.7", "@vitejs/plugin-react": "4.3.4", typescript: "5.7.2" },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM"],
            jsx: "react-jsx",
            strict: true,
            noEmit: true,
            module: "ESNext",
            moduleResolution: "bundler",
            skipLibCheck: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
    },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script>
      (function () {
        function send(payload) { parent.postMessage(payload, "*"); }
        window.addEventListener("error", function (event) {
          send({ type: "architect:error", kind: "runtime", message: String(event.message), file: "src/App.tsx", line: event.lineno });
        });
        window.addEventListener("unhandledrejection", function (event) {
          send({ type: "architect:error", kind: "runtime", message: String(event.reason), file: "src/App.tsx" });
        });
        var original = console.error;
        console.error = function () {
          var message = Array.prototype.join.call(arguments, " ");
          send({ type: "architect:console", message: message });
          send({ type: "architect:error", kind: "console", message: message, file: "src/App.tsx" });
          original.apply(console, arguments);
        };
        window.addEventListener("message", function (event) {
          if (event.data && event.data.type === "architect:picker") window.__archPicker = Boolean(event.data.on);
        });
        document.addEventListener("click", function (event) {
          if (!window.__archPicker) return;
          var node = event.target && event.target.closest ? event.target.closest("[data-arch-src]") : null;
          if (!node) return;
          event.preventDefault();
          send({ type: "architect:pick", src: node.getAttribute("data-arch-src") });
        }, true);
      })();
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function archSrc() {
  return {
    name: "arch-src",
    transform(code, id) {
      if (!id.includes("/src/") || !id.endsWith(".tsx")) return null;
      const rel = id.slice(id.indexOf("/src/") + 1);
      return code.replace(/<([A-Za-z][\\w.]*)(\\s|>)/, (match, tag, rest) => {
        if (match.includes("data-arch-src")) return match;
        return \`<\${tag} data-arch-src="\${rel}:1"\${rest}\`;
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), archSrc()],
  server: { host: "127.0.0.1", port: 5173 },
});
`,
    },
    { path: "src/theme.css", content: themeCss("minimal") },
    { path: "src/shims.d.ts", content: shims },
    {
      path: "src/lib/agents.ts",
      content: `export const agents = [
${agentLines}
] as const;

export const manager = "Manager";

export async function runAgent(name: string, input: string): Promise<string> {
  const url = import.meta.env.VITE_ARCHITECT_URL;
  const key = import.meta.env.VITE_ARCHITECT_KEY;
  if (!url) return name + " is ready for: " + input;
  const response = await fetch(url + "/api/public/agents/run", {
    method: "POST",
    headers: { "content-type": "application/json", "x-architect-key": key ?? "" },
    body: JSON.stringify({ agentName: name, input }),
  });
  return response.ok ? name + " replied" : name + " could not reach Architect";
}
`,
    },
    {
      path: "src/lib/db.ts",
      content: `type Bucket = { getItem(key: string): string | null; setItem(key: string, value: string): void };

function bucket(): Bucket | null {
  const host = globalThis as { localStorage?: Bucket };
  return host.localStorage ?? null;
}

export function collection(name: string) {
  const key = "architect:" + name;
  return {
    list(): string[] {
      const raw = bucket()?.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    },
    insert(value: string) {
      const next = this.list().concat(value);
      bucket()?.setItem(key, JSON.stringify(next));
      return next;
    },
  };
}
`,
    },
    {
      path: "src/components/Header.tsx",
      content: `export function Header({ title }: { title: string }) {
  return (
    <header data-arch-src="src/components/Header.tsx:1">
      <h1>{title}</h1>
    </header>
  );
}
`,
    },
    {
      path: "src/pages/Home.tsx",
      content: `const blocks: { name: string; purpose: string; kind: "hero" | "grid" | "products" | "quotes" | "footer" | "section" }[] = ${JSON.stringify(blocks)};

function label(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const card = { border: "1px solid #e4e7ee", borderRadius: 8, padding: "0.9rem 1rem", background: "#fff" };

export function Home({ summary }: { summary: string }) {
  return (
    <div data-arch-src="src/pages/Home.tsx:1">
      {blocks.map((block) => {
        const title = label(block.name);
        if (block.kind === "hero") {
          return (
            <section key={block.name} style={{ padding: "2rem 0 1.25rem" }}>
              <p style={{ margin: 0, color: "var(--app-accent)", fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>{title}</p>
              <h2 style={{ fontSize: "2.25rem", lineHeight: 1.15, margin: "0.45rem 0" }}>{title}</h2>
              <p style={{ margin: "0 0 1rem", maxWidth: "40rem", fontSize: "1.05rem" }}>{summary}</p>
              <a href="#featured" style={{ display: "inline-block", background: "var(--app-accent)", color: "white", textDecoration: "none", borderRadius: 6, padding: "0.55rem 0.9rem" }}>Get started</a>
            </section>
          );
        }
        if (block.kind === "grid") {
          const items = ["For you", "Top rated", "New today", "Staff picks"];
          return (
            <section key={block.name} style={{ padding: "1.25rem 0", borderTop: "1px solid #e4e7ee" }}>
              <h2 style={{ margin: "0 0 0.75rem" }}>{title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {items.map((item) => (
                  <article key={item} style={card}>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem" }}>{item}</h3>
                    <p style={{ margin: 0 }}>{block.purpose}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }
        if (block.kind === "products") {
          const items = ["Highlight", "Best seller", "Just in"];
          return (
            <section id="featured" key={block.name} style={{ padding: "1.25rem 0", borderTop: "1px solid #e4e7ee" }}>
              <h2 style={{ margin: "0 0 0.75rem" }}>{title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {items.map((item) => (
                  <article key={item} style={card}>
                    <div style={{ height: 72, borderRadius: 6, background: "#eef0f6", marginBottom: 8 }} />
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>{item}</h3>
                  </article>
                ))}
              </div>
            </section>
          );
        }
        if (block.kind === "quotes") {
          return (
            <section key={block.name} style={{ padding: "1.25rem 0", borderTop: "1px solid #e4e7ee" }}>
              <h2 style={{ margin: "0 0 0.75rem" }}>{title}</h2>
              <blockquote style={{ margin: 0, ...card }}>
                <p style={{ margin: 0 }}>{block.purpose}</p>
              </blockquote>
            </section>
          );
        }
        if (block.kind === "footer") {
          return (
            <footer key={block.name} style={{ padding: "1.5rem 0 0.25rem", borderTop: "1px solid #e4e7ee" }}>
              <p style={{ margin: 0 }}>{title}</p>
            </footer>
          );
        }
        return (
          <section key={block.name} style={{ padding: "1.25rem 0", borderTop: "1px solid #e4e7ee" }}>
            <h2 style={{ margin: "0 0 0.35rem" }}>{title}</h2>
            <p style={{ margin: 0 }}>{block.purpose}</p>
          </section>
        );
      })}
    </div>
  );
}
`,
    },
    {
      path: "src/App.tsx",
      content: `import { useState } from "react";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { collection } from "./lib/db";
import { runAgent } from "./lib/agents";

const summary = ${JSON.stringify(plan.summary)};

export function App() {
  const [note, setNote] = useState(summary);
  const items = collection("items");
  return (
    <main data-arch-src="src/App.tsx:1">
      <Header title={${JSON.stringify(title)}} />
      <Home summary={summary} />
      <p data-arch-note="summary" data-arch-src="src/App.tsx:3">{${JSON.stringify(plan.summary)}}</p>
      <button
        type="button"
        data-arch-src="src/App.tsx:4"
        onClick={() => {
          setNote(note);
          void items.insert("saved");
          void runAgent("Manager", note);
        }}
      >
        Refresh
      </button>
    </main>
  );
}
`,
    },
    {
      path: "src/main.tsx",
      content: `import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
`,
    },
  ];
}

export const previewBatches: { label: string; paths: string[] }[] = [
  { label: "Layout and theme", paths: ["package.json", "tsconfig.json", "index.html", "vite.config.ts", "src/theme.css"] },
  { label: "Pages", paths: ["src/pages/Home.tsx", "src/App.tsx", "src/main.tsx"] },
  { label: "Components", paths: ["src/components/Header.tsx"] },
  { label: "Wiring agents", paths: ["src/lib/agents.ts", "src/lib/db.ts"] },
  { label: "Checking", paths: ["src/shims.d.ts"] },
];
