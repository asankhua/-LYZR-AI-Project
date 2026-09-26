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
