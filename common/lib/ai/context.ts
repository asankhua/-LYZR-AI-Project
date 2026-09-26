import "server-only";
import type { AgentSpec, PlanDoc, ProjectFile } from "@/lib/types";
import { estimateTokens } from "@/lib/ai/limits";

export function buildContext(input: {
  plan: PlanDoc | null;
  agents: AgentSpec[];
  files: ProjectFile[];
  message?: string;
}) {
  const tree = input.files.map((file) => file.path).join("\n");
  const summary = input.plan?.summary ?? "";
  const agentList = input.agents.map((agent) => agent.name).join(", ");
  const text = [summary, agentList, tree, input.message ?? ""].join("\n");
  return {
    text,
    tokens: estimateTokens(text),
    paths: input.files.map((file) => file.path),
  };
}
