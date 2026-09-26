export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  files: (id: string) => ["files", id] as const,
  messages: (id: string) => ["messages", id] as const,
  snapshots: (id: string) => ["snapshots", id] as const,
  usage: (range: { from: string; to: string }) => ["usage", range] as const,
};
