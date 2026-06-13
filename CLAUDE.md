# Sherlock

A proxy that sits between your services and third-party APIs. It intercepts HTTP errors, enriches them via LLM, and streams them to a shared team dashboard in real time.

## Architecture

```
demo-app → proxy (3000) → third-party API
                ↓ on error
          Kafka: raw-errors
                ↓
          llm-worker (enriches via Anthropic)
                ↓
          Kafka: enriched-errors
                ↓
          dashboard server (4000) → WebSocket → browser
```

## What's done

- **proxy** — Fastify on port 3000, forwards requests to hardcoded upstream (`jsonplaceholder.typicode.com`), detects HTTP errors (4xx/5xx) and connection errors, publishes `ErrorContext` to `raw-errors` Kafka topic
- **llm-worker** — Kafka consumer on `raw-errors`, enriches via Anthropic claude-sonnet-4-6, publishes `EnrichedError` to `enriched-errors`
- **dashboard/server** — Fastify on port 4000, Kafka consumer on `enriched-errors` (fromBeginning: true), WebSocket broadcast to all connected clients, in-memory history replayed to new connections
- **dashboard/client** — React + Vite + Tailwind, connects via WebSocket, live feed of enriched error cards
- **demo-app** — Node.js loop, fires random requests through the proxy every 3–5s, mix of successes and failures

## What's left

1. Connection errors not being triggered from demo-app
2. Docker Compose — containerize all 4 services + Kafka
3. Deploy to fly.io
4. Docs — architecture doc + README

## Structure

```
sherlock/
├── CLAUDE.md
├── docker-compose.yml
├── proxy/
├── llm-worker/
├── dashboard/
│   ├── server/
│   └── client/
├── demo-app/
├── shared/src/types.ts
└── docs/
```

## Key types

```typescript
export interface ErrorContext {
  request: {
    method: string;
    url: string;
    body?: unknown;
    headers: Record<string, string>;
  };
  response?: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
  };
  nodeError?: { code: string; message: string };
  callingService: string;
  upstream: string;
  timestamp: string;
}

export interface EnrichedError {
  context: ErrorContext;
  explanation: string;
  enrichedAt: string;
}
```

## Key decisions

- Async enrichment — proxy never waits on LLM, returns error to caller immediately
- No database — Kafka retains messages, dashboard replays from offset 0 on startup
- In-memory history on dashboard server — lost on reboot, refilled by Kafka replay on restart
- Shared TypeScript types in `shared/` imported by all services
- Upstream hardcoded in proxy v1 — known limitation, v2 would use config/headers

## Stack

- Node.js + TypeScript throughout
- Fastify (proxy + dashboard server)
- KafkaJS + Kafka in Docker (KRaft mode, no Zookeeper), port 9092, topics: `raw-errors`, `enriched-errors`
- Anthropic SDK (claude-sonnet-4-6)
- WebSocket via `ws` package
- React + Vite + Tailwind (dashboard client)
- Docker Compose (in progress)
- fly.io (deployment target)

## Current issue

Demo app needs to trigger connection errors. These require calling a URL where the host is unreachable (e.g. `http://localhost:9999`) — not just bad paths which return 404s. The proxy catches connection errors in its catch block and publishes them as `ErrorContext` with `nodeError` set and no `response` field.

## Rules

- Never make enrichment synchronous
- No database
- Proxy must be stateless
- Don't modify `shared/src/types.ts` without updating all consumers