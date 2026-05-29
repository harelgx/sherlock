import { kafka } from "./kafka.js";
import { EnrichedError } from "../shared/src/types.js";

const producer = kafka.producer();

export async function initProducer() {
  await producer.connect();
}

export async function produceEnrichedError(enrichedError: EnrichedError) {
  await producer.send({
    topic: "enriched-errors",
    messages: [{ value: JSON.stringify(enrichedError) }],
  });
}
