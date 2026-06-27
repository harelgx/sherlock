# Sherlock

> HTTP proxy that intercepts API errors and enriches them with LLM context via an async Kafka pipeline, streaming results to a real-time dashboard over WebSocket.

**Stack:** Fastify · Node.js · TypeScript · React · Kafka · Anthropic API · WebSocket · Docker

---

## What it does

When a service routes its outgoing HTTP calls through Sherlock, any error (4xx, 5xx, or connection failure) is automatically captured, enriched by an LLM with a structured diagnosis, and streamed live to a dashboard — without adding any latency to the original request.

The on-call engineer sees not just *what* failed, but *why* it failed and *what to do about it*.

---

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
          dashboard/server (4000) → WebSocket → dashboard/client (5173)
```

**Key design decisions:**

- **Async enrichment** — the proxy never waits on the LLM. It returns the error to the caller immediately and publishes to Kafka in the background.
- **No database** — Kafka retains messages. The dashboard server replays from the topic on startup, so history survives restarts.
- **Structured LLM output** — enrichment uses Anthropic tool use to enforce response structure at the API level, not via prompt instructions.
- **Proxy is stateless** — upstream and calling service identity are passed as request headers, making the proxy reusable across multiple services.

---

## Services

| Service | Port | Description |
|---|---|---|
| `proxy` | 3000 | Fastify HTTP proxy. Forwards requests, intercepts errors, publishes to Kafka |
| `llm-worker` | — | Kafka consumer. Enriches errors via Anthropic, publishes `EnrichedError` |
| `dashboard/server` | 4000 | Fastify + WebSocket server. Consumes enriched errors, streams to browser |
| `dashboard/client` | 5173 | React + Vite dashboard. Live feed of enriched error cards |
| `demo-app` | — | Fires random requests through the proxy every 3–5s for demo purposes |

---

## How to run locally

**Prerequisites:** Node.js, Docker

**1. Clone and install**
```bash
git clone https://github.com/harelgx/sherlock.git
cd sherlock
npm run install:all
```

**2. Set environment variables**

```bash
cp llm-worker/.env.example llm-worker/.env
```

Open `llm-worker/.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

**3. Start Kafka**
```bash
docker compose up -d
```

**4. Start everything**
```bash
npm run dev
```

Open `http://localhost:5173` to see the dashboard.

---

## How to integrate

Point your HTTP calls at the Sherlock proxy instead of the upstream API directly, and pass two headers:

```typescript
const res = await fetch("http://sherlock-host:3000/posts/99999", {
  headers: {
    "x-sherlock-upstream": "https://your-api.com",
    "x-sherlock-service": "my-service",
  }
});
```

| Header | Description |
|---|---|
| `x-sherlock-upstream` | The actual API host to forward to |
| `x-sherlock-service` | Your service name, shown in the dashboard |

Sherlock strips both headers before forwarding — the upstream API never sees them. Multiple services can point at the same Sherlock instance simultaneously.

---

## Project structure

```
sherlock/
├── docker-compose.yml
├── package.json          # root — install:all + concurrently dev script
├── proxy/
├── llm-worker/
├── dashboard/
│   ├── server/
│   └── client/
├── demo-app/
└── shared/
    └── src/types.ts      # ErrorContext, EnrichedError, DiagnosisResult
```
