"use client";

import { create } from "zustand";
import type { AgentSpec, PlanDoc, ProjectFile } from "@/lib/types";

type ProjectState = {
  plan: PlanDoc | null;
  agents: AgentSpec[];
  files: ProjectFile[];
  setPlan: (plan: PlanDoc | null) => void;
  setAgents: (agents: AgentSpec[]) => void;
  setFiles: (files: ProjectFile[]) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  plan: null,
  agents: [],
  files: [],
  setPlan: (plan) => set({ plan }),
  setAgents: (agents) => set({ agents }),
  setFiles: (files) => set({ files }),
}));
