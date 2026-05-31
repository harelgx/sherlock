import { kafka } from "./kafka.js";
import { ErrorContext } from "../../shared/src/types.js";

const consumer = kafka.consumer({ groupId: "llm-worker-group" });

export async function startRawErrorsConsumer(
  onMessage: (context: ErrorContext) => Promise<void>,
) {
  await consumer.connect();
  await consumer.subscribe({ topic: "raw-errors", fromBeginning: true });

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
