"use client";

import { create } from "zustand";
import type { StreamEvent } from "@/lib/types";

type ChatState = {
  events: StreamEvent[];
  streaming: boolean;
  push: (event: StreamEvent) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  events: [],
  streaming: false,
  push: (event) => set((state) => ({ events: [...state.events, event] })),
  setStreaming: (streaming) => set({ streaming }),
  reset: () => set({ events: [] }),
}));
