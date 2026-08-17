# ADR-0230: AI Server Composition Root Foundation

**Status:** Accepted  
**Work Order:** WO-S12-007  
**Architecture Version:** v1.116 → v1.117

## Decision

`packages/ai-server/src/main.ts` is the executable composition root. It reads
and validates server environment, constructs the server-side
`OpenAIStructuredGenerationClient`, starts `startAIServer`, and owns SIGINT /
SIGTERM shutdown. `server.ts` remains provider-agnostic HTTP infrastructure.

The supported server provider is currently `openai`. Unknown providers fail
before the listener starts. A missing key is allowed for local development:
the composition root installs an unavailable structured client, so requests
return the existing safe gateway error and the browser deterministic fallback
remains usable. Host, port, model, and optional base URL are typed
configuration values with safe defaults for local development.

The existing development CORS behavior remains explicit and limited to the
gateway response; no authentication, deployment, or production policy is
introduced here. `GET /health` returns only `{ "status": "ok" }`.

## Local flow

With a key: `main.ts → OpenAIStructuredGenerationClient → startAIServer → /api/world-generation`.
Without a key: `main.ts → UnavailableStructuredGenerationClient → startAIServer`.

The browser still uses only `VITE_AI_GATEWAY_URL`; `AI_API_KEY` is read only by
the server composition root and is never logged or serialized.
