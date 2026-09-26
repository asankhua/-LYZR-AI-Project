"use client";

import { create } from "zustand";

export type WorkspaceTab = "preview" | "plan" | "agents" | "code" | "terminal" | "database" | "env" | "git";

type UiState = {
  activeTab: WorkspaceTab;
  setTab: (tab: WorkspaceTab) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeTab: "plan",
  setTab: (activeTab) => set({ activeTab }),
}));
