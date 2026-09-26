"use client";

import { create } from "zustand";
import type { StreamEvent } from "@/lib/types";

type ChatState = {
  events: StreamEvent[];
  streaming: boolean;
  push: (event: StreamEvent) => void;
  settleRunning: (status: "done" | "error") => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  events: [],
  streaming: false,
  push: (event) =>
    set((state) => {
      const settled =
        event.type === "step"
          ? state.events.map((item) =>
              item.type === "step" && item.status === "running" && item.label !== event.label
                ? { ...item, status: "done" as const }
                : item,
            )
          : state.events;
      if (event.type === "step") {
        const index = settled.findIndex((item) => item.type === "step" && item.label === event.label);
        if (index !== -1) {
          const events = settled.slice();
          events[index] = event;
          return { events };
        }
      }
      return { events: [...settled, event] };
    }),
  settleRunning: (status) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.type === "step" && event.status === "running" ? { ...event, status } : event,
      ),
    })),
  setStreaming: (streaming) => set({ streaming }),
  reset: () => set({ events: [] }),
}));
