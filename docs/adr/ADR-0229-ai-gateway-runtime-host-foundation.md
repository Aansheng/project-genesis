# ADR-0229: AI Gateway Runtime Host Foundation

**Status:** Accepted  
**Work Order:** WO-S12-006  
**Architecture Version:** v1.115 → v1.116

## Decision

Add a production-oriented, framework-free HTTP host in
`packages/ai-server/src/server.ts`. `startAIServer(client, options)` receives a
`StructuredGenerationClient`, creates one local Node `http.Server`, and exposes
`POST /api/world-generation`. `stopAIServer` closes that server gracefully.
There is no global server singleton and no provider construction in the HTTP
layer.

The host adapts Node requests to the existing `createAIGatewayHandler` and
maps its `Response` back to Node. It supports development CORS, rejects unknown
routes, limits request bodies, and preserves the gateway's safe error contract.

## Configuration and local development

The browser uses only:

- `VITE_AI_ENABLED`
- `VITE_AI_GATEWAY_URL` (default example:
  `http://127.0.0.1:8787/api/world-generation`)

The server-side composition root supplies `StructuredGenerationClient` using
`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, and `AI_PORT`. The runtime host itself
does not read or return provider credentials.

The local flow is:

`Studio → BrowserStructuredGenerationClient → POST /api/world-generation →
createAIGatewayHandler → StructuredGenerationClient → provider → candidate →
validator → deterministic fallback when unavailable → World → Pixi`.

## Rejected alternatives

- No Express/Fastify dependency: Node's built-in HTTP server is sufficient.
- No streaming, authentication, rate limiting, billing, or model routing.
- No global lifecycle registry: each test or process owns its server handle.
