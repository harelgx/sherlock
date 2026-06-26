import { Kafka } from "kafkajs";
import { ErrorContext } from "../../../shared/src/types.js";

const kafka = new Kafka({
  clientId: "proxy-producer",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

export async function initProducer() {
  await producer.connect();
  console.log("[kafka] producer connected")
}

export async function publishRawError(context: ErrorContext) {
  await producer.send({
    topic: "raw-errors",
    messages: [{ value: JSON.stringify(context) }],
  });
  console.log(`  [kafka] published error to raw-errors`);
}
