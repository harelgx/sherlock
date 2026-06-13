import { kafka } from "./kafka.js";
import { ErrorContext } from "../../../shared/src/types.js"

const consumer = kafka.consumer({ groupId: "dashboard-server-group" });

export async function startEnrichedErrorConsumer(
  onMessage: (context: ErrorContext) => Promise<void>,
) {
  await consumer.connect();
  console.log("Dashboard consumer connected")
  await consumer.subscribe({ topic: "enriched-errors", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      console.log({
        value: message.value.toString(),
      });
      const context: ErrorContext = JSON.parse(message.value.toString());
      await onMessage(context);
    },
  });
}
