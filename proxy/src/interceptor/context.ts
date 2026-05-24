import { FastifyRequest } from "fastify";
import { ErrorContext } from "../../../shared/src/types.js";
import { IncomingHttpHeaders } from "http";

function extractCallingService(headers: IncomingHttpHeaders): string {
  const rawService = headers["x-calling-service"];
  const callingService = Array.isArray(rawService)
    ? rawService[0]
    : (rawService ?? "unknown");
  return callingService;
}

export function assembleHttpErrorContext(
  request: FastifyRequest,
  response: Response,
  responseBody: unknown,
  upstream: string,
): ErrorContext {
  const callingService = extractCallingService(request.headers);

  const errorContext: ErrorContext = {
    request: {
      method: request.method,
      url: request.url,
      body: request.body,
      headers: request.headers as Record<string, string>,
    },
    response: {
      statusCode: response.status,
      body: responseBody,
      headers: Object.fromEntries(response.headers.entries()),
    },
    callingService: callingService,
    upstream: upstream,
    timestamp: new Date().toISOString(),
  };
  return errorContext;
}

export function assembleConnectionErrorContext(
  request: FastifyRequest,
  upstream: string,
  nodeError?: { code: string; message: string },
): ErrorContext {
  const callingService = extractCallingService(request.headers);

  const errorContext: ErrorContext = {
    request: {
      method: request.method,
      url: request.url,
      body: request.body,
      headers: request.headers as Record<string, string>,
    },
    callingService: callingService,
    nodeError,
    upstream: upstream,
    timestamp: new Date().toISOString(),
  };
  return errorContext;
}
