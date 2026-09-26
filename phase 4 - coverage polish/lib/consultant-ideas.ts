export type ConsultantIdea = {
  title: string;
  description: string;
  agents: string[];
  hoursSavedPerWeek: number;
  prompt: string;
};

export function ideasFor(input: { role: string; timeSinks: string[]; tools: string[] }): ConsultantIdea[] {
  const sink = input.timeSinks[0] ?? "repeated work";
  const tool = input.tools[0] ?? "the tools you already use";
  return [
    {
      title: `${sink} assistant`,
      description: `Takes ${sink.toLowerCase()} off a ${input.role}'s week, starting from ${tool}.`,
      agents: ["Researcher", "Writer"],
      hoursSavedPerWeek: 8,
      prompt: `Build an app for a ${input.role} that handles ${sink}. Use ${tool} as a source.`,
    },
    {
      title: "Weekly brief",
      description: `Collects what changed and writes a short brief for a ${input.role}.`,
      agents: ["Monitor", "Summarizer"],
      hoursSavedPerWeek: 4,
      prompt: `Build a weekly brief for a ${input.role} covering ${input.timeSinks.join(", ") || sink}.`,
    },
    {
      title: "Follow-up drafter",
      description: `Turns a finished task into the next message, using ${tool}.`,
      agents: ["Writer"],
      hoursSavedPerWeek: 3,
      prompt: `Build a follow-up drafter for a ${input.role} who spends time on ${sink}.`,
    },
  ];
}
