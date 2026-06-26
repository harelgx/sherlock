import Fastify from "fastify";
import { initProducer } from "./producer/kafka.js";
import { proxyRoute } from "./routes/proxy.js";

const fastify = Fastify({ logger: false });

fastify.register(proxyRoute)

const PORT = 3000;

try {
  await fastify.listen({ port: PORT }, () => { console.log(`Sherlock proxy up and running on http://localhost:${PORT}`)});
  initProducer();
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
