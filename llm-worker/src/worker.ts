import { startRawErrorsConsumer } from "./consumer.js";
import { initProducer, produceEnrichedError } from "./producer.js";
import { buildPrompt } from "./enricher/prompt.js";
import { callLLM } from "./enricher/llm.js";
import { ErrorContext, EnrichedError, DiagnosisResult } from "../../shared/src/types.js";

await initProducer();

startRawErrorsConsumer(async (context: ErrorContext) => {
  console.log("[worker] building prompt from context")
  const prompt: string = buildPrompt(context);
  console.log("[worker] calling LLM")
  const explanation: DiagnosisResult = await callLLM(prompt);
  const enrichedError: EnrichedError = {
    context,
    explanation,
    enrichedAt: new Date().toISOString(),
  };
  
  const { diagnosis, action, retryable } = explanation;
  console.log(`[worker] Error diagnosis:\n${"─".repeat(40)}`);
  console.log(`  Diagnosis:  ${diagnosis}`);
  console.log(`  Action:     ${action}`);
  console.log(`  Retryable:  ${retryable ? "YES" : "NO"}`);
  console.log(`${"─".repeat(40)}`);

  await produceEnrichedError(enrichedError);
});
