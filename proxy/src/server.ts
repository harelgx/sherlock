import Fastify from "fastify";
import { isHttpError, isConnectionError } from "./interceptor/detect.js";
import {
  assembleHttpErrorContext,
  assembleConnectionErrorContext,
} from "./interceptor/context.js";

const fastify = Fastify({ logger: true });

const UPSTREAM = "https://jsonplaceholder.typicode.com";

fastify.all("/*", async function handler(request, reply) {
  console.log("forwarding to:", UPSTREAM + request.url);

  // Turns out host from request forwarded automatically. So API thought it was localhost:3000 asking for info, so it redirected to homepage
  // So we got some weird HTML.
  // By Deconstructing the headers, fixed
  const { host, ...forwardHeaders } = request.headers;

  try {
    const response = await fetch(UPSTREAM + request.url, {
      method: request.method,
      headers: forwardHeaders as Record<string, string>,
      body: JSON.stringify(request.body),
    });
    const responseBody = await response.text();
    if (isHttpError(response.status)) {
      const context = assembleHttpErrorContext(
        request,
        response,
        responseBody,
        UPSTREAM,
      );
      console.log("ERROR CONTEXT:", JSON.stringify(context, null, 2));
      reply.status(response.status).send(responseBody);
    } else {
      // forward success
      reply
        .code(response.status)
        .headers(Object.fromEntries(response.headers.entries()))
        .send(responseBody);
    }
  } catch (error) {
    const nodeError =
      error instanceof Error
        ? { code: (error as any).code ?? "UNKNOWN", message: error.message }
        : { code: "UNKNOWN", message: "Unknown connection error" };

    const context = assembleConnectionErrorContext(
      request,
      UPSTREAM,
      nodeError,
    );
    console.log("ERROR CONTEXT:", JSON.stringify(context, null, 2));
    reply.code(502).send(nodeError.message);
  }

  //   const data = await response.text();
  //   return data;
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
