import { kafka } from "./kafka.js";
import { EnrichedError } from "../../../shared/src/types.js"

const consumer = kafka.consumer({ groupId: "dashboard-server-group" });

export async function startEnrichedErrorConsumer(
  onMessage: (error: EnrichedError) => Promise<void>,
) {
  await consumer.connect();
  console.log("Dashboard consumer connected")
  await consumer.subscribe({ topic: "enriched-errors", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const error: EnrichedError = JSON.parse(message.value.toString());
      await onMessage(error);
    },
  });
}
