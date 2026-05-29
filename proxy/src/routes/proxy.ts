import { FastifyInstance } from "fastify";
import { isHttpError, isConnectionError } from "../interceptor/detect.js";
import {
  assembleHttpErrorContext,
  assembleConnectionErrorContext,
} from "../interceptor/context.js";
import { publishRawError } from "../producer/kafka.js";

const UPSTREAM = "https://jsonplaceholder.typicode.com";

export async function proxyRoute(fastify: FastifyInstance) {
    fastify.all("/*", async function handler(request, reply) {
      console.log("forwarding to:", UPSTREAM + request.url);
    
      // Turns out host from request forwarded automatically. So API thought it was localhost:3000 asking for info, so it redirected to homepage
      // So we got some weird HTML.
      // By Deconstructing the headers, fixed
      const { host, ...forwardHeaders } = request.headers;
    
      try {
        const hasBody = !["GET", "HEAD"].includes(request.method);
        const response = await fetch(UPSTREAM + request.url, {
          method: request.method,
          headers: forwardHeaders as Record<string, string>,
          body: hasBody ? JSON.stringify(request.body) : undefined,
        });
        const responseBody = await response.text();
        if (isHttpError(response.status)) {
          const context = assembleHttpErrorContext(
            request,
            response,
            responseBody,
            UPSTREAM,
          );
          console.log("Error Context:", JSON.stringify(context, null, 2));
          await publishRawError(context);
          reply.code(response.status).send(responseBody);
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
        console.log("Error Context:", JSON.stringify(context, null, 2));
        await publishRawError(context);
        reply.code(502).send(nodeError.message);
      }
    
      //   const data = await response.text();
      //   return data;
    });
}