import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "dashboard-server",
  brokers: ["localhost:9092"],
});
