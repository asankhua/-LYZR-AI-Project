export const marketplaceApps = [
  {
    id: "support-desk",
    name: "Support Desk",
    description: "A shared inbox that drafts replies and shows the source.",
    agents: 3,
    prompt: "A support desk that triages tickets and drafts replies with sources.",
  },
  {
    id: "lead-research",
    name: "Lead Research Assistant",
    description: "Looks up a company and writes a call brief.",
    agents: 2,
    prompt: "A lead research assistant that writes a one-page brief before a sales call.",
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    description: "Drafts a week of posts from one topic.",
    agents: 2,
    prompt: "A content calendar that drafts a week of posts from a topic.",
  },
] as const;

export function marketplaceApp(id: string) {
  return marketplaceApps.find((app) => app.id === id) ?? null;
}
