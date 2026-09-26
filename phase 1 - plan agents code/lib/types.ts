export type Mode = "simple" | "developer";
export type Stage = "plan" | "agents" | "build" | "ship";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  mode: Mode;
  isAnonymous: boolean;
  onboardingDone: boolean;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  stage: Stage;
  template: string;
  updatedAt: string;
};

export type ProjectMessage = {
  id: string;
  projectId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
};

export type PlanScreen = { name: string; purpose: string; components: string[] };
export type PlanAgent = { name: string; role: string };
export type PlanCollection = { collection: string; fields: string[] };

export type PlanDoc = {
  title: string;
  summary: string;
  audience: string;
  userJourney: string[];
  screens: PlanScreen[];
  agents: PlanAgent[];
  dataModel: PlanCollection[];
  integrations: string[];
  openQuestions: string[];
};

export type AgentFramework = "default" | "lyzr" | "langgraph" | "crewai" | "openai-agents" | "gitagent";

export type AgentSpec = {
  id: string;
  projectId: string;
  name: string;
  role: string;
  instructions: string;
  framework: AgentFramework;
  model: string;
  tools: string[];
  knowledge: string[];
  managedBy: string | null;
  position: { x: number; y: number };
  testPassed: boolean;
};

export type ProjectFile = {
  projectId: string;
  path: string;
  content: string;
  sha: string;
};

export type Snapshot = {
  id: string;
  projectId: string;
  summary: string;
  manifest: Record<string, string>;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  projectId: string;
  agentName: string;
  source: "test" | "preview" | "deployed";
  input: string;
  output: string;
  steps: { agent: string; tool?: string; ms: number; note?: string }[];
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status: string;
  createdAt: string;
};

export type ChangePlan = {
  summary: string;
  files: string[];
  agents: string[];
  risks: string[];
};

export type StreamEvent =
  | { type: "step"; label: string; status: "running" | "done" | "error" }
  | { type: "plan-section"; key: string; title: string; body: string }
  | { type: "agent"; spec: AgentSpec }
  | { type: "file-op"; op: "create" | "update" | "delete"; path: string }
  | { type: "snapshot"; snapshotId: string }
  | { type: "usage"; stage: string; inputTokens: number; outputTokens: number }
  | { type: "change-plan"; plan: ChangePlan }
  | { type: "trace"; run: AgentRun }
  | { type: "text"; text: string }
  | { type: "intent"; intent: string; confidence: number }
  | { type: "error"; message: string };
