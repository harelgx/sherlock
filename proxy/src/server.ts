import Fastify from "fastify";
import { initProducer } from "./producer/kafka.js";
import { proxyRoute } from "./routes/proxy.js";

const fastify = Fastify({ logger: true });

fastify.register(proxyRoute)

try {
  await fastify.listen({ port: 3000 });
  initProducer();
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
