import { kafka } from "./kafka.js";
import { ErrorContext } from "../../shared/src/types.js";

const consumer = kafka.consumer({ groupId: "llm-worker-group" });

export async function startRawErrorsConsumer(
  onMessage: (context: ErrorContext) => Promise<void>,
) {
  await consumer.connect();
  await consumer.subscribe({ topic: "raw-errors", fromBeginning: false });
  console.log("[kafka] consumer connected to raw-errors topic")

  await consumer.run({
    // for each raw-error, parse it then send to llm for enriching
    eachMessage: async ({ message }) => {
      if (!message.value) return; // message value is the raw-error from raw-error topic
      const context: ErrorContext = JSON.parse(message.value.toString());
      console.log(`[kafka] raw-error consumed, extracting context`)
      await onMessage(context);
    },
  });
}
