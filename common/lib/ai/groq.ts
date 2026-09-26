import "server-only";
import { createGroq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { agentSchema, changePlanSchema, parseWithOneRetry, planSchema } from "@/lib/ai/schemas";
import { MODELS, localModels } from "@/lib/ai/models";
import { agentsPrompt } from "@/lib/ai/prompts/agents";
import { codegenPrompt } from "@/lib/ai/prompts/codegen";
import { planChangePrompt } from "@/lib/ai/prompts/plan-change";
import { planPrompt } from "@/lib/ai/prompts/plan";
import type { ChangePlan, PlanDoc } from "@/lib/types";

function client() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY });
}

export async function modelPlan(prompt: string): Promise<PlanDoc | null> {
  if (localModels()) return null;
  try {
    const proposePlan = tool({
      description: "Record the product plan.",
      inputSchema: planSchema,
    });
    const result = await generateText({
      model: client()(MODELS.reasoning),
      system: planPrompt,
      prompt,
      tools: { proposePlan },
      toolChoice: "required",
      providerOptions: { groq: { reasoningEffort: "medium" } },
    });
    const call = result.toolCalls.find((item) => item.toolName === "proposePlan");
    if (!call) return null;
    return parseWithOneRetry(call.input, planSchema, () => call.input);
  } catch (error) {
    console.warn("Plan model call failed.", error);
    return null;
  }
}

export async function modelChange(instruction: string): Promise<ChangePlan | null> {
  if (localModels()) return null;
  try {
    const proposeChange = tool({
      description: "Record a change plan without writing files.",
      inputSchema: changePlanSchema,
    });
    const result = await generateText({
      model: client()(MODELS.reasoning),
      system: planChangePrompt,
      prompt: instruction,
      tools: { proposeChange },
      toolChoice: "required",
    });
    const call = result.toolCalls.find((item) => item.toolName === "proposeChange");
    if (!call) return null;
    return changePlanSchema.parse(call.input);
  } catch (error) {
    console.warn("Change-plan model call failed.", error);
    return null;
  }
}

export async function modelAgentNotes(plan: PlanDoc): Promise<string | null> {
  if (localModels()) return null;
  try {
    const defineAgent = tool({
      description: "Define one agent.",
      inputSchema: agentSchema,
    });
    const result = await generateText({
      model: client()(MODELS.reasoning),
      system: agentsPrompt,
      prompt: JSON.stringify(plan.agents),
      tools: { defineAgent },
      toolChoice: "required",
    });
    return result.text || "Agents designed.";
  } catch (error) {
    console.warn("Agent model call failed.", error);
    return null;
  }
}

export async function modelFileNote(plan: PlanDoc): Promise<string | null> {
  if (localModels()) return null;
  try {
    const result = await generateText({
      model: client()(MODELS.fast),
      system: codegenPrompt,
      prompt: `Summarize the first files for ${plan.title} in one sentence.`,
    });
    return result.text;
  } catch (error) {
    console.warn("Codegen note failed.", error);
    return null;
  }
}
