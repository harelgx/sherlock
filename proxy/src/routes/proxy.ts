import { FastifyInstance } from "fastify";
import { isHttpError, isConnectionError } from "../interceptor/detect.js";
import {
  assembleHttpErrorContext,
  assembleConnectionErrorContext,
} from "../interceptor/context.js";
import { publishRawError } from "../producer/kafka.js";

// const UPSTREAM = "https://jsonplaceholder.typicode.com";

// const UPSTREAM = "https://localhost:9999"

export async function proxyRoute(fastify: FastifyInstance) {
    fastify.all("/*", async function handler(request, reply) {
      console.log(`→ ${request.method} ${request.url}`);

      const upstream = (request.headers["x-sherlock-upstream"] as string);
      // const callingService = (request.headers["x-sherlock-service"] as string) ?? "unknown";


      if (!upstream) {
        reply.code(400).send("Missing required header: x-sherlock-upstream");
        return;
}
      // Turns out host from request forwarded automatically. So API thought it was localhost:3000 asking for info, so it redirected to homepage
      // So we got some weird HTML.
      // By Deconstructing the headers, fixed
      const { host, "x-sherlock-upstream": _, "x-sherlock-service": __, ...forwardHeaders } = request.headers;      

      try {
        const hasBody = !["GET", "HEAD"].includes(request.method);
        const response = await fetch(upstream + request.url, {
          method: request.method,
          headers: forwardHeaders as Record<string, string>,
          body: hasBody ? JSON.stringify(request.body) : undefined,
        });
        const responseBody = await response.text();
        if (isHttpError(response.status)) {
          console.log(`✗ ${request.method} ${request.url} → ${response.status} (HTTP error)`);
          const context = assembleHttpErrorContext(
            request,
            response,
            responseBody,
            upstream,
          );
          console.log(`  upstream: ${context.upstream} | service: ${context.callingService} | body: ${JSON.stringify(context.response?.body)}`);
          await publishRawError(context);
          reply.code(response.status).send(responseBody);
        } else {
          // forward success
          console.log(`✓ ${request.method} ${request.url} → ${response.status}`);
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
          upstream,
          nodeError,
        );
        console.log(`  upstream: ${context.upstream} | service: ${context.callingService}`);
        console.log(`✗ ${request.method} ${request.url} → ${nodeError.code} (connection error)`);
        console.log(`  message: ${nodeError.message}`);
        await publishRawError(context);
        reply.code(502).send(nodeError.message);
      }
    });
}