import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "llm-worker",
  brokers: ["localhost:9092"],
});
