import { createHash } from "node:crypto";
import { templateFiles } from "@/lib/templates/vite-react/files";
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

export function draftPlan(prompt: string): PlanDoc {
  const title = projectNameFromPrompt(prompt);
  const subject = title.toLowerCase();
  return {
    title,
    summary: `${title} helps someone finish a job that currently takes a lot of manual work. It starts from this request: ${prompt.trim()}`,
    audience: "A person who wants the outcome without building the workflow by hand.",
    userJourney: [
      "Describe the job in plain language",
      `Review what ${subject} found`,
      "Edit the result",
      "Save it and come back later",
    ],
    screens: [
      { name: "Home", purpose: "Start a new request and see recent results.", components: ["Prompt", "Recent list"] },
      { name: "Result", purpose: "Read the answer, the sources, and the next action.", components: ["Answer", "Sources", "Actions"] },
    ],
    agents: [
      { name: "Manager", role: "Splits the request across helpers and combines their answers." },
      { name: "Researcher", role: "Gathers the facts the answer depends on." },
      { name: "Writer", role: "Turns the facts into the result the user reads." },
    ],
    dataModel: [{ collection: "items", fields: ["id", "title", "status", "summary", "createdAt"] }],
    integrations: [],
    openQuestions: [],
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
    tools: agent.name === "Researcher" ? ["Web search"] : ["Sample data"],
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

export function filesForPlan(plan: PlanDoc): { path: string; content: string }[] {
  return templateFiles(plan);
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
