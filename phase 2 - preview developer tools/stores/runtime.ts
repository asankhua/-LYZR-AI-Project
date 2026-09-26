"use client";

import { create } from "zustand";
import type { PreviewError } from "@/lib/types";

export type RuntimeStatus = "idle" | "booting" | "mounting" | "installing" | "starting" | "ready" | "error";

type RuntimeState = {
  status: RuntimeStatus;
  previewUrl: string;
  fallback: boolean;
  log: string;
  errors: PreviewError[];
  setStatus: (status: RuntimeStatus) => void;
  setPreviewUrl: (previewUrl: string) => void;
  setFallback: (fallback: boolean) => void;
  appendLog: (chunk: string) => void;
  pushError: (error: PreviewError) => void;
  reset: () => void;
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  status: "idle",
  previewUrl: "",
  fallback: false,
  log: "",
  errors: [],
  setStatus: (status) => set({ status }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  setFallback: (fallback) => set({ fallback }),
  appendLog: (chunk) => set((state) => ({ log: (state.log + chunk).slice(-12000) })),
  pushError: (error) => set((state) => ({ errors: [...state.errors, error].slice(-20) })),
  reset: () => set({ status: "idle", previewUrl: "", fallback: false, log: "", errors: [] }),
}));
