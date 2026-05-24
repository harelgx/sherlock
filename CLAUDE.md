# Sherlock

A proxy that intercepts HTTP errors from third-party API calls and enriches them via LLM.

## Current focus
Building the proxy service only. Other services don't exist yet.

## Proxy responsibilities
- Forward HTTP requests to upstream APIs
- Detect errors (4xx, 5xx, connection errors)
- Assemble error context object
- Publish to Kafka (mock for now with console.log)
- Return original error to caller unmodified — never block on enrichment

## Structure
sherlock/
├── CLAUDE.md
├── shared/src/types.ts   ← ErrorContext lives here
├── proxy/                ← current focus
└── docs/ 

## Proxy v1 scope
- Fastify server on port 3000
- Single catch-all route that forwards any request to an upstream URL
- Upstream URL configured via env var per service (e.g. TWILIO_URL)
- On 4xx/5xx or connection error: assemble ErrorContext, console.log it
- On success: forward response transparently
- No Kafka yet

## Error Schema
```ts
export interface ErrorContext {
  request: {
    method: string;
    url: string;
    body: unknown;
    headers: Record<string, string>;
  };
  response: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
  };
  nodeError?: { code: string; message: string };
  callingService: string;
  upstream: string;
  timestamp: string;
}
```
## Stack
- Node.js + TypeScript
- Fastify
- KafkaJS (not yet, mock for now)

## Rules
- Never make enrichment synchronous
- No database
- Proxy must be stateless