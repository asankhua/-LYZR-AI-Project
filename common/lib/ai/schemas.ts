import { z } from "zod";

export const planSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  userJourney: z.array(z.string()).min(1),
  screens: z.array(z.object({ name: z.string(), purpose: z.string(), components: z.array(z.string()) })).min(1),
  agents: z.array(z.object({ name: z.string(), role: z.string() })).min(1),
  dataModel: z.array(z.object({ collection: z.string(), fields: z.array(z.string()) })).min(1),
  integrations: z.array(z.string()),
  openQuestions: z.array(z.string()),
});

export const agentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  instructions: z.string().min(1),
  framework: z.enum(["default", "lyzr", "langgraph", "crewai", "openai-agents", "gitagent"]),
  model: z.string().min(1),
  tools: z.array(z.string()),
  knowledge: z.array(z.string()),
  managedBy: z.string().nullable(),
});

export const changePlanSchema = z.object({
  summary: z.string().min(1),
  files: z.array(z.string()),
  agents: z.array(z.string()),
  risks: z.array(z.string()),
});

export const fileOpSchema = z.object({
  op: z.enum(["create", "update", "delete"]),
  path: z.string().min(1),
  content: z.string().optional(),
});

export function parseWithOneRetry<T>(raw: unknown, schema: z.ZodType<T>, repair: (error: string) => unknown): T {
  const first = schema.safeParse(raw);
  if (first.success) return first.data;
  const second = schema.safeParse(repair(first.error.message));
  if (second.success) return second.data;
  throw new Error(second.error.message);
}
