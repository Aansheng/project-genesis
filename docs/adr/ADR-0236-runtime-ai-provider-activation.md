# ADR-0236: Runtime AI Provider Activation

**Status:** Accepted  
**Work Order:** WO-S12-015  
**Architecture Version:** v1.123 → v1.124

## Context

Studio Settings could configure and test the AI Server successfully, but the
Web `gameStore` selected its provider once at startup using `VITE_AI_ENABLED`.
After Settings changed the server configuration, generation still used the
deterministic provider and produced no generation trace.

## Decision

The AI Server owns runtime provider availability. Web uses the gateway whenever
the gateway URL is available and keeps the existing AI-candidate → validator →
deterministic fallback pipeline. The server's current configured/enabled state
therefore controls each request without Web rebuild, reload, or provider
recomposition.

`VITE_AI_GATEWAY_URL` remains a browser transport location and defaults to the
local AI gateway URL. `VITE_AI_ENABLED` is no longer authoritative for
production provider selection; a false value cannot silently block a provider
configured through Settings.

## Runtime Behavior

- Server configured and enabled: gateway invokes the current provider client.
- Server unavailable, disabled, or unconfigured: gateway fails safely and Web
  deterministic fallback produces the playable world with a truthful fallback
  trace.
- A Settings change affects the next generation request in the same SPA/server
  session.
- Browser code never receives or stores API keys.

## Consequences

There is one production command path. Web no longer duplicates server provider
availability state. The browser may issue a gateway request even before a
provider is configured; the existing bounded AI failure and deterministic
fallback handle that expected local-development state.

## Rejected Alternative

Web-side `GET /api/ai/config` caching was rejected because it duplicates
provider availability state and can become stale. The gateway is already the
server-owned authority.
