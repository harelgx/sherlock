import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { DiagnosisResult } from "../../../shared/src/types.js";

const client = new Anthropic();

const DIAGNOSE_TOOL: Anthropic.Tool = {
  name: "diagnose_error",
  description: "Diagnose an API error and return structured output",
  input_schema: {
    type: "object",
    properties: {
      diagnosis: { type: "string", description: "One sentence explaining the likely cause" },
      action:    { type: "string", description: "One sentence on what the engineer should do" }
    },
    required: ["diagnosis", "action"]
  }
};

export async function callLLM(prompt: string): Promise<DiagnosisResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [DIAGNOSE_TOOL],
    tool_choice: { type: "tool", name: "diagnose_error" },
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content.find(b => b.type === "tool_use");
  if (!block || block.type !== "tool_use")
    throw new Error("Model did not call the diagnose_error tool");

  return block.input as DiagnosisResult;
}