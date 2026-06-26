import { kafka } from "./kafka.js";
import { EnrichedError } from "../../shared/src/types.js";

const producer = kafka.producer();

export async function initProducer() {
  await producer.connect();
  console.log("[kafka] enriched-errors producer connected")
}

export async function produceEnrichedError(enrichedError: EnrichedError) {
  await producer.send({
    topic: "enriched-errors",
    messages: [{ value: JSON.stringify(enrichedError) }],
  });
  console.log(`[kafka] published error to enriched-errors`);
}
