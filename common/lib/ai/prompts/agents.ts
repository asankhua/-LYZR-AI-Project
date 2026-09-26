export const agentsPrompt = `Design the agents for an approved plan.
Call defineAgent once per agent. One agent is the manager (managedBy null). Helpers set managedBy to the manager's name.
Default framework is "default". Tools are names only. Do not write application code.`;
