import type { AgentSpec, Deployment, PlanDoc, Stage } from "@/lib/types";
import { templateFiles } from "@/lib/templates/vite-react/files";

export const TRAVEL_PROMPT =
  "A shared trip planner where a group votes on flights and hotels, gets a daily itinerary, and splits costs.";

const SUPPORT_PROMPT = "A support desk that sorts tickets and drafts a first reply.";
const LEAD_PROMPT = "A lead research assistant that writes a one-page brief before a first call.";

export type SeedAgent = Omit<AgentSpec, "id" | "projectId">;
export type SeedSnapshot = { summary: string; healthy: boolean };
export type SeedDeployment = Omit<Deployment, "id" | "projectId" | "createdBy" | "createdAt" | "snapshotId">;

export type GuestBundle = {
  name: string;
  description: string;
  stage: Stage;
  prompt: string;
  plan: PlanDoc;
  approved: boolean;
  agents: SeedAgent[];
  files: { path: string; content: string }[];
  snapshots: SeedSnapshot[];
  deployments: SeedDeployment[];
  usage: { stage: string; inputTokens: number; outputTokens: number }[];
};

function agent(
  name: string,
  role: string,
  instructions: string,
  position: { x: number; y: number },
  managedBy: string | null,
): SeedAgent {
  return {
    name,
    role,
    instructions,
    framework: "default",
    model: "openai/gpt-oss-20b",
    tools: ["Sample data"],
    knowledge: [],
    managedBy,
    position,
    testPassed: managedBy === null,
  };
}

export function travelPlan(): PlanDoc {
  return {
    title: "Travel Planner",
    summary: "A shared trip planner where a group votes on flights and hotels, gets a daily itinerary, and splits costs.",
    audience: "Friends planning a trip together",
    userJourney: [
      "Someone starts a trip and invites the group.",
      "The group votes on flights and hotels.",
      "The itinerary writer drafts each day.",
      "The app splits the cost across the group.",
    ],
    screens: [
      { name: "Search", purpose: "Find flights and hotels for the dates.", components: ["Search form", "Result cards"] },
      { name: "Itinerary", purpose: "Show the days the group agreed on.", components: ["Day cards"] },
      { name: "Split", purpose: "Divide the shared cost.", components: ["Cost summary"] },
    ],
    agents: [
      { name: "Trip Manager", role: "Keeps the trip and the other agents on one plan." },
      { name: "Flight Finder", role: "Looks up flight options for the dates." },
      { name: "Hotel Scout", role: "Looks up hotels the group can vote on." },
      { name: "Itinerary Writer", role: "Turns the votes into a day-by-day plan." },
    ],
    dataModel: [
      { collection: "Trips", fields: ["name", "dates", "votes"] },
      { collection: "Expenses", fields: ["label", "amount", "paidBy"] },
    ],
    integrations: ["Calendar"],
    openQuestions: ["Should guests be able to vote without an account?"],
  };
}

function supportPlan(): PlanDoc {
  return {
    title: "Support Desk",
    summary: "Sorts incoming tickets and drafts a first reply the team can send.",
    audience: "A small support team",
    userJourney: ["A ticket arrives.", "The desk sorts it.", "A reply is drafted."],
    screens: [{ name: "Queue", purpose: "Show open tickets.", components: ["Ticket list"] }],
    agents: [{ name: "Inbox Router", role: "Sorts tickets and drafts the first reply." }],
    dataModel: [{ collection: "Tickets", fields: ["subject", "status"] }],
    integrations: ["Email"],
    openQuestions: [],
  };
}

function leadPlan(): PlanDoc {
  return {
    title: "Lead Research Assistant",
    summary: "Researches one company and writes a one-page brief before a first call.",
    audience: "A salesperson preparing for a call",
    userJourney: ["Paste a company name.", "Read the brief.", "Approve the plan before any code is written."],
    screens: [{ name: "Brief", purpose: "Show the one-page brief.", components: ["Brief"] }],
    agents: [
      { name: "Researcher", role: "Collects public facts about the company." },
      { name: "Writer", role: "Turns the facts into a one-page brief." },
    ],
    dataModel: [{ collection: "Accounts", fields: ["name", "brief"] }],
    integrations: [],
    openQuestions: ["Which sources should the brief cite?"],
  };
}

const travelSnapshots: SeedSnapshot[] = [
  { summary: "Layout and theme", healthy: true },
  { summary: "Search form", healthy: true },
  { summary: "Itinerary cards", healthy: true },
  { summary: "Flight options", healthy: true },
  { summary: "Hotel options", healthy: true },
  { summary: "Cost split", healthy: true },
  { summary: "Runtime error while splitting costs", healthy: false },
  { summary: "Restored the cost split", healthy: true },
  { summary: "Preview ready", healthy: true },
];

export function guestBundles(): GuestBundle[] {
  const travel = travelPlan();
  const support = supportPlan();
  const lead = leadPlan();
  return [
    {
      name: "Travel Planner",
      description: TRAVEL_PROMPT,
      stage: "build",
      prompt: TRAVEL_PROMPT,
      plan: travel,
      approved: true,
      agents: [
        agent("Trip Manager", "Keeps the trip and the other agents on one plan.", "Coordinate the group trip. Ask the other agents for flights, hotels, and the daily plan.", { x: 180, y: 20 }, null),
        agent("Flight Finder", "Looks up flight options for the dates.", "Return three flight options with a price and a short reason.", { x: 20, y: 180 }, "Trip Manager"),
        agent("Hotel Scout", "Looks up hotels the group can vote on.", "Return three hotels the group can vote on.", { x: 180, y: 180 }, "Trip Manager"),
        agent("Itinerary Writer", "Turns the votes into a day-by-day plan.", "Write one card per day from the winning flight and hotel.", { x: 340, y: 180 }, "Trip Manager"),
      ],
      files: [
        ...templateFiles(travel),
        {
          path: "src/data.json",
          content: JSON.stringify(
            [
              { trip: "Lisbon", votes: 3 },
              { trip: "Kyoto", votes: 2 },
            ],
            null,
            2,
          ),
        },
      ],
      snapshots: travelSnapshots,
      deployments: [],
      usage: [
        { stage: "plan", inputTokens: 1200, outputTokens: 800 },
        { stage: "codegen", inputTokens: 2400, outputTokens: 3600 },
      ],
    },
    {
      name: "Support Desk",
      description: SUPPORT_PROMPT,
      stage: "ship",
      prompt: SUPPORT_PROMPT,
      plan: support,
      approved: true,
      agents: [agent("Inbox Router", "Sorts tickets and drafts the first reply.", "Sort the ticket and draft a short reply.", { x: 180, y: 40 }, null)],
      files: templateFiles(support),
      snapshots: [{ summary: "Published the support desk", healthy: true }],
      deployments: [
        {
          status: "ready",
          url: "https://support-desk.vercel.app",
          subdomain: "support-desk",
          logs: "Ready",
          providerDeploymentId: null,
          promotedAt: null,
        },
        {
          status: "ready",
          url: "https://support-desk-previous.vercel.app",
          subdomain: "support-desk-previous",
          logs: "Ready\nPrevious production deployment.",
          providerDeploymentId: null,
          promotedAt: null,
        },
      ],
      usage: [],
    },
    {
      name: "Lead Research Assistant",
      description: LEAD_PROMPT,
      stage: "plan",
      prompt: LEAD_PROMPT,
      plan: lead,
      approved: false,
      agents: [],
      files: [],
      snapshots: [],
      deployments: [],
      usage: [],
    },
  ];
}
