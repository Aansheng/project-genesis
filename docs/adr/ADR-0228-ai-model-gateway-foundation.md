# ADR-0228: AI Model Gateway Foundation

**Status:** Accepted  
**Work Order:** WO-S12-005  
**Architecture Version:** v1.114 → v1.115

## Decision

Move structured model invocation behind `@genesis/ai-server`. The server package
owns `OpenAIStructuredGenerationClient` and exposes a framework-neutral
`createAIGatewayHandler` that accepts `WorldGenerationRequest` and returns only
`WorldGenerationResponse { candidate }`.

`apps/web` owns only `BrowserStructuredGenerationClient`, which sends HTTP to
`VITE_AI_GATEWAY_URL`. It never reads `VITE_AI_API_KEY`, imports the OpenAI SDK,
or receives provider credentials.

## Runtime behavior

- `VITE_AI_ENABLED=false`: deterministic provider.
- `VITE_AI_ENABLED=true` with a gateway URL: browser client → gateway → server
  `StructuredGenerationClient`.
- Timeout, provider error, malformed response, or invalid candidate: existing
  `FallbackGameWorldGenerationProvider` returns the deterministic world.

The gateway validates the input shape and hides internal/provider errors. It does
not know Runtime, Renderer, Studio, Pixi, DSL, or world mutation.

## Configuration

Browser: `VITE_AI_ENABLED`, `VITE_AI_GATEWAY_URL`.  
Server: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` (plus optional `AI_BASE_URL`,
`AI_TEMPERATURE`, and `AI_MAX_TOKENS`).

No streaming, accounts, billing, rate limiting, routing, memory, or fine tuning.
