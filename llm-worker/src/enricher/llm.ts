import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function callLLM(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const block = message.content[0];
  if (block.type !== "text")
    throw new Error("Unexpected response type from LLM");
  console.log(block.text);
  return block.text;
}
