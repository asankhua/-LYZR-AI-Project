export const promptLibrary = [
  { role: "Support", task: "Reply", title: "Ticket reply", prompt: "Draft a short reply to a customer who is waiting on a refund." },
  { role: "Support", task: "Triage", title: "Sort the queue", prompt: "Triage today's tickets into billing, bug, and how-to, and name the next step for each." },
  { role: "Sales", task: "Research", title: "Account brief", prompt: "Research one company and write a one-page brief before a first call." },
  { role: "Sales", task: "Write", title: "First email", prompt: "Write a first email that mentions one specific fact about the company." },
  { role: "Ops", task: "Summarize", title: "Weekly digest", prompt: "Summarize what changed this week in three sections: shipped, blocked, and next." },
] as const;

export function filterPrompts(role: string, task: string) {
  return promptLibrary.filter((item) => (role === "All" || item.role === role) && (task === "All" || item.task === task));
}
