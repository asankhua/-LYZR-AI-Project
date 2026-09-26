import { createHash } from "node:crypto";
import { templateFiles } from "@/lib/templates/vite-react/files";
import type { ThemePresetId } from "@/lib/templates/themes";
import type { AgentSpec, ChangePlan, PlanDoc } from "@/lib/types";
import { projectNameFromPrompt } from "@/lib/utils";

export const PLAN_SECTIONS = [
  "summary",
  "audience",
  "userJourney",
  "screens",
  "agents",
  "dataModel",
  "integrations",
  "openQuestions",
] as const;

type PlanPack = Pick<PlanDoc, "audience" | "userJourney" | "screens" | "agents" | "dataModel" | "integrations" | "openQuestions"> & {
  test: RegExp;
  summary: (title: string) => string;
};

const planPacks: PlanPack[] = [
  {
    test: /book|library|read/,
    summary: (title) => `${title} is the shop's front table: what is new, what staff recommend, and which reading list a customer can save.`,
    audience: "A bookstore owner who wants the storefront to change every week without rebuilding the page.",
    userJourney: ["Choose this week's staff picks", "Add a one-line reason and a price", "Publish the storefront", "See which titles people save"],
    screens: [
      { name: "Storefront", purpose: "The public page: hero, staff picks, and a search.", components: ["Hero", "Staff picks", "Search"] },
      { name: "Catalog", purpose: "Every title with status, price, and shelf.", components: ["Recent list", "Filters", "Status"] },
      { name: "Reading list", purpose: "A list a customer saves and comes back to.", components: ["Saved titles", "Share"] },
    ],
    agents: [
      { name: "Manager", role: "Decides the week's table and asks the others to fill it." },
      { name: "Buyer", role: "Picks new arrivals that fit the shop." },
      { name: "Shelver", role: "Assigns each title a shelf and a status." },
      { name: "Copywriter", role: "Writes the one-line reason to open the book." },
    ],
    dataModel: [{ collection: "books", fields: ["id", "title", "author", "price", "shelf", "status", "blurb"] }],
    integrations: ["Email"],
    openQuestions: ["Should a sold-out title stay on the storefront?"],
  },
  {
    test: /travel|trip|itinerary|flight|hotel/,
    summary: (title) => `${title} turns a group's dates into a day-by-day plan, with flights, hotels, and who owes what.`,
    audience: "Friends planning a trip who do not want a shared spreadsheet.",
    userJourney: ["Set the dates and the budget", "Compare flights and a neighborhood", "Vote on the hotel", "Split the cost"],
    screens: [
      { name: "Trip", purpose: "The trip header, dates, and the running total.", components: ["Dates", "Budget", "Search"] },
      { name: "Itinerary", purpose: "Each day as a card the group can reorder.", components: ["Day cards", "Map note"] },
      { name: "Costs", purpose: "Who paid, and the split that is still open.", components: ["Ledger", "Balances"] },
    ],
    agents: [
      { name: "Manager", role: "Keeps the trip and the other agents on one plan." },
      { name: "Flight Finder", role: "Looks up flight options for the dates." },
      { name: "Hotel Scout", role: "Looks up hotels the group can vote on." },
      { name: "Itinerary Writer", role: "Turns the votes into a day-by-day plan." },
    ],
    dataModel: [{ collection: "stops", fields: ["id", "day", "title", "place", "cost", "status", "owner"] }],
    integrations: ["Calendar"],
    openQuestions: ["Does the group need a vote, or can one person decide?"],
  },
  {
    test: /receipt|invoice|shop|order|finance/,
    summary: (title) => `${title} takes a pile of receipts, flags the ones missing a total, and exports the rows a bookkeeper can use.`,
    audience: "A shop owner or finance lead who is tired of retyping receipts.",
    userJourney: ["Drop in today's receipts", "Fix the ones missing a total", "Assign a category", "Export the ready rows"],
    screens: [
      { name: "Inbox", purpose: "New receipts, with duplicates called out.", components: ["Upload", "Search", "Duplicates"] },
      { name: "Review", purpose: "Each receipt with vendor, total, and category.", components: ["Recent list", "Category", "Status"] },
      { name: "Export", purpose: "The rows that are ready to download.", components: ["Ledger", "Download"] },
    ],
    agents: [
      { name: "Manager", role: "Routes each receipt to the right helper." },
      { name: "Scanner", role: "Reads the vendor, date, and total off the photo." },
      { name: "Bookkeeper", role: "Assigns a category and flags duplicates." },
      { name: "Exporter", role: "Builds the file the books can take." },
    ],
    dataModel: [{ collection: "receipts", fields: ["id", "vendor", "total", "category", "status", "duplicate", "createdAt"] }],
    integrations: ["Sheets"],
    openQuestions: ["Which categories does the shop already use?"],
  },
  {
    test: /candidate|hire|recruit|resume/,
    summary: (title) => `${title} ranks a screening queue, keeps interview notes together, and names the next conversation.`,
    audience: "A recruiter running a role with more resumes than time.",
    userJourney: ["Load the screening queue", "Read the notes from each interviewer", "Mark who moves forward", "Schedule the next conversation"],
    screens: [
      { name: "Queue", purpose: "Resumes ranked by the role's must-have skills.", components: ["Search", "Rank", "Status"] },
      { name: "Notes", purpose: "What each interviewer wrote, on one record.", components: ["Recent list", "Interviewers"] },
      { name: "Next", purpose: "Who to call, and the question still open.", components: ["Schedule", "Question"] },
    ],
    agents: [
      { name: "Manager", role: "Keeps the role's bar and the helpers aligned." },
      { name: "Screener", role: "Ranks resumes against the must-have skills." },
      { name: "Interviewer", role: "Collects notes into one record per candidate." },
      { name: "Scheduler", role: "Names the next conversation and the open question." },
    ],
    dataModel: [{ collection: "candidates", fields: ["id", "name", "role", "score", "status", "notes", "nextStep"] }],
    integrations: ["Calendar", "Email"],
    openQuestions: ["Who is allowed to move a candidate forward?"],
  },
  {
    test: /digest|market|founder|competitor/,
    summary: (title) => `${title} watches a short list of competitors and writes the weekly brief a founder actually reads.`,
    audience: "A founder who wants the market change, not another unread newsletter.",
    userJourney: ["Name the competitors to watch", "Review what changed this week", "Edit the brief", "Send it"],
    screens: [
      { name: "Watchlist", purpose: "The companies and the signals that matter.", components: ["Companies", "Search"] },
      { name: "Brief", purpose: "This week's changes, ready to edit.", components: ["Recent list", "Highlights"] },
      { name: "Send", purpose: "Who receives the brief and when.", components: ["Recipients", "Schedule"] },
    ],
    agents: [
      { name: "Manager", role: "Decides what is worth a founder's attention." },
      { name: "Researcher", role: "Gathers launches, filings, and pricing changes." },
      { name: "Editor", role: "Turns the findings into a one-page brief." },
    ],
    dataModel: [{ collection: "signals", fields: ["id", "company", "kind", "summary", "status", "week"] }],
    integrations: ["Email"],
    openQuestions: ["Which competitors are in the first watchlist?"],
  },
  {
    test: /question|support|docs|knowledge|answer/,
    summary: (title) => `${title} answers a repeated question from the docs, shows the source, and saves the answer for next time.`,
    audience: "A support lead who answers the same questions from the same documents.",
    userJourney: ["Ask the question", "Read the answer and the source", "Correct it if the source is wrong", "Save it for the next person"],
    screens: [
      { name: "Ask", purpose: "The question, and the recent ones beside it.", components: ["Search", "Recent list"] },
      { name: "Answer", purpose: "The reply, the source passage, and a correction.", components: ["Answer", "Sources", "Actions"] },
      { name: "Saved", purpose: "Answers the team has already approved.", components: ["Library", "Status"] },
    ],
    agents: [
      { name: "Manager", role: "Decides which helper should answer." },
      { name: "Researcher", role: "Finds the passage in the docs." },
      { name: "Writer", role: "Turns that passage into the answer the user reads." },
    ],
    dataModel: [{ collection: "answers", fields: ["id", "question", "answer", "source", "status", "createdAt"] }],
    integrations: [],
    openQuestions: ["Which documents are the source of truth?"],
  },
];

const defaultPack: PlanPack = {
  test: /$^/,
  summary: (title) => `${title} is a working app for the job in the prompt: a dashboard, a record list, a board, and the agents that keep it current.`,
  audience: "The person who has the job and wants the outcome on one screen.",
  userJourney: ["Open the dashboard", "Review the records that need a decision", "Update one record", "Ask an agent to draft the next step"],
  screens: [
    { name: "Dashboard", purpose: "The counts, the recent records, and what changed.", components: ["Stats", "Activity", "Search"] },
    { name: "Records", purpose: "Every item with a status the user can change.", components: ["Recent list", "Status", "Filters"] },
    { name: "Board", purpose: "The same records grouped by status.", components: ["Columns", "Cards"] },
  ],
  agents: [
    { name: "Manager", role: "Splits the job across helpers and combines their answers." },
    { name: "Researcher", role: "Gathers the facts the record depends on." },
    { name: "Writer", role: "Drafts the text the user will actually send or publish." },
    { name: "Reviewer", role: "Checks the draft against the record before it is saved." },
  ],
  dataModel: [{ collection: "records", fields: ["id", "title", "status", "owner", "summary", "updatedAt"] }],
  integrations: [],
  openQuestions: ["Which status names does this team already use?"],
};

export function draftPlan(prompt: string): PlanDoc {
  const title = projectNameFromPrompt(prompt);
  const text = `${title} ${prompt}`.toLowerCase();
  const pack = planPacks.find((item) => item.test.test(text)) ?? defaultPack;
  return {
    title,
    summary: `${pack.summary(title)} It starts from this request: ${prompt.trim()}`,
    audience: pack.audience,
    userJourney: pack.userJourney,
    screens: pack.screens,
    agents: pack.agents,
    dataModel: pack.dataModel,
    integrations: pack.integrations,
    openQuestions: pack.openQuestions,
  };
}

export function sectionBody(plan: PlanDoc, key: (typeof PLAN_SECTIONS)[number]): string {
  const value = plan[key];
  if (typeof value === "string") return value;
  if (key === "userJourney" || key === "integrations" || key === "openQuestions") return (value as string[]).join("\n");
  if (key === "screens") return plan.screens.map((screen) => `${screen.name}: ${screen.purpose}`).join("\n");
  if (key === "agents") return plan.agents.map((agent) => `${agent.name}: ${agent.role}`).join("\n");
  return plan.dataModel.map((row) => `${row.collection} (${row.fields.join(", ")})`).join("\n");
}

export function sectionTitle(key: (typeof PLAN_SECTIONS)[number]): string {
  const titles: Record<(typeof PLAN_SECTIONS)[number], string> = {
    summary: "Summary",
    audience: "Who it's for",
    userJourney: "User journey",
    screens: "Screens",
    agents: "Agents",
    dataModel: "Data",
    integrations: "Integrations",
    openQuestions: "Open questions",
  };
  return titles[key];
}

export function draftAgents(projectId: string, plan: PlanDoc): AgentSpec[] {
  const manager = plan.agents.find((agent) => agent.name === "Manager") ?? plan.agents[0];
  return plan.agents.map((agent, index) => ({
    id: crypto.randomUUID(),
    projectId,
    name: agent.name,
    role: agent.role,
    instructions: `You are ${agent.name}. ${agent.role} Stay within the plan "${plan.title}". Use sample data when a live integration is not connected, and say so.`,
    framework: "default",
    model: agent.name === manager?.name ? "openai/gpt-oss-120b" : "openai/gpt-oss-20b",
    tools: /research|finder|scout|search|scanner/i.test(agent.name) ? ["Web search", "Sample data"] : agent.name === "Manager" ? ["Delegate", "Sample data"] : ["Sample data"],
    knowledge: [],
    managedBy: agent.name === manager?.name ? null : manager?.name ?? null,
    position: agent.name === manager?.name ? { x: 220, y: 40 } : { x: 40 + (index - 1) * 240, y: 220 },
    testPassed: false,
  }));
}

export function draftChangePlan(instruction: string, paths: string[]): ChangePlan {
  const touched = paths.filter((path) => path.endsWith(".tsx") || path.endsWith(".ts")).slice(0, 4);
  return {
    summary: instruction.trim(),
    files: touched.length > 0 ? touched : ["src/App.tsx", "src/lib/agents.ts"],
    agents: [],
    risks: ["The live preview is not running yet, so this change is saved as files only."],
  };
}

export function filesForPlan(plan: PlanDoc, theme?: ThemePresetId): { path: string; content: string }[] {
  return templateFiles(plan, theme);
}

export function sha1(content: string): string {
  return createHash("sha1").update(content).digest("hex");
}

export function frameworkScaffold(name: string, framework: string): { path: string; content: string } | null {
  if (framework === "default") return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    path: `agents/${slug}/README.md`,
    content: `# ${name}\n\nFramework scaffold for ${framework}. This file is exported with the project. The running preview uses the default framework only.\n`,
  };
}

export function sampleRun(agentName: string, input: string) {
  return {
    output: `${agentName} drafted a sample answer for: ${input}`,
    steps: [
      { agent: agentName, tool: "Sample data", ms: 12, note: "Sample data" },
      { agent: agentName, ms: 20 },
    ],
  };
}
