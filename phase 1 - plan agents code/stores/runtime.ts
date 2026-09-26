"use client";

import { create } from "zustand";

type RuntimeStatus = "idle" | "booting" | "mounting" | "installing" | "starting" | "ready" | "error";

type RuntimeState = {
  status: RuntimeStatus;
  setStatus: (status: RuntimeStatus) => void;
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
