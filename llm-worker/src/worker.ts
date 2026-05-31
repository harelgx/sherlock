import { startRawErrorsConsumer } from "./consumer.js";
import { initProducer, produceEnrichedError } from "./producer.js";
import { buildPrompt } from "./enricher/prompt.js";
import { callLLM } from "./enricher/llm.js";
import { ErrorContext, EnrichedError } from "../../shared/src/types.js";

await initProducer();

startRawErrorsConsumer(async (context: ErrorContext) => {
  const prompt: string = buildPrompt(context);
  const explanation = await callLLM(prompt);
  const enrichedError: EnrichedError = {
    context,
    explanation,
    enrichedAt: new Date().toISOString(),
  };
  await produceEnrichedError(enrichedError);
});
