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

const MODEL_LIMIT_MS = 40_000;

function client() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY });
}

function limited<T>(work: (signal: AbortSignal) => Promise<T>, parent?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(MODEL_LIMIT_MS);
  const signal = parent ? AbortSignal.any([parent, timeout]) : timeout;
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error(parent?.aborted ? "Aborted" : "The model timed out."));
    if (signal.aborted) {
      fail();
      return;
    }
    signal.addEventListener("abort", fail, { once: true });
    work(signal).then(
      (value) => {
        signal.removeEventListener("abort", fail);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", fail);
        reject(error);
      },
    );
  });
}

export async function modelPlan(prompt: string, signal?: AbortSignal): Promise<PlanDoc | null> {
  if (localModels()) return null;
  try {
    const proposePlan = tool({
      description: "Record the product plan.",
      inputSchema: planSchema,
    });
    const result = await limited(
      (abortSignal) =>
        generateText({
          model: client()(MODELS.reasoning),
          system: planPrompt,
          prompt,
          tools: { proposePlan },
          toolChoice: "required",
          abortSignal,
          providerOptions: { groq: { reasoningEffort: "medium" } },
        }),
      signal,
    );
    const call = result.toolCalls.find((item) => item.toolName === "proposePlan");
    if (!call) return null;
    return parseWithOneRetry(call.input, planSchema, () => call.input);
  } catch (error) {
    console.warn("Plan model call failed.", error);
    return null;
  }
}

export async function modelChange(instruction: string, signal?: AbortSignal): Promise<ChangePlan | null> {
  if (localModels()) return null;
  try {
    const proposeChange = tool({
      description: "Record a change plan without writing files.",
      inputSchema: changePlanSchema,
    });
    const result = await limited(
      (abortSignal) =>
        generateText({
          model: client()(MODELS.reasoning),
          system: planChangePrompt,
          prompt: instruction,
          tools: { proposeChange },
          toolChoice: "required",
          abortSignal,
        }),
      signal,
    );
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
    const result = await limited((abortSignal) =>
      generateText({
        model: client()(MODELS.reasoning),
        system: agentsPrompt,
        prompt: JSON.stringify(plan.agents),
        tools: { defineAgent },
        toolChoice: "required",
        abortSignal,
      }),
    );
    return result.text || "Agents designed.";
  } catch (error) {
    console.warn("Agent model call failed.", error);
    return null;
  }
}

export async function modelFileNote(plan: PlanDoc): Promise<string | null> {
  if (localModels()) return null;
  try {
    const result = await limited((abortSignal) =>
      generateText({
        model: client()(MODELS.fast),
        system: codegenPrompt,
        prompt: `Summarize the first files for ${plan.title} in one sentence.`,
        abortSignal,
      }),
    );
    return result.text;
  } catch (error) {
    console.warn("Codegen note failed.", error);
    return null;
  }
}
