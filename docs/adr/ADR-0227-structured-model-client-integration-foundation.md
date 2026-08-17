# ADR-0227: Structured Model Client Integration Foundation

**Status:** Accepted  
**Work Order:** WO-S12-004  
**Architecture Version:** v1.113 → v1.114

## Decision

Implement `OpenAIStructuredGenerationClient` as the only vendor-specific
adapter behind `StructuredGenerationClient`. It uses the already-installed
official OpenAI SDK and returns the response text as an untrusted value. The
existing LLM candidate parser and `DefaultGameWorldValidator` remain the only
path to a `GameWorldModel`.

The web composition root selects the provider. External generation is used
only when `VITE_AI_ENABLED=true`, `VITE_AI_PROVIDER=openai`, and an API key is
present. Otherwise, it injects `DeterministicGameWorldGenerationProvider`.

## Fallback and safety

The selected model provider is wrapped by `FallbackGameWorldGenerationProvider`.
Network errors, empty responses, malformed JSON, and invalid candidates all
fall back to the deterministic provider. No key or endpoint is committed.
Synchronous APIs remain compatible; the web command path uses the existing
async pipeline so optional model calls can actually execute.

## Rejected alternatives

- No new SDK or HTTP dependency: the repository already uses the official
  `openai` package.
- No streaming, prompt optimization, memory, token accounting, or vendor
  comparison: none is required for this foundation.
