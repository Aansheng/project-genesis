# ADR-0234: Structured AI Generation Reliability Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S12-012
- Architecture Version: v1.121 → v1.122

## Decision

Structured generation uses a small vendor-neutral reliability contract with an
output-token budget and per-request timeout. The candidate provider performs at
most one retry for timeout, transport/provider errors, or provider-reported and
parse-detected truncation. Validation errors are terminal; retries never bypass
`GameWorldValidator`.

The server defaults are 4000 output tokens, 30 seconds, and two total attempts.
The OpenAI-compatible adapter maps the generic budget to `max_tokens` and owns
AbortSignal/transport behavior. This keeps DeepSeek and other compatible
providers behind the adapter rather than in semantic generation code.

Text responses are parsed strictly as JSON. Empty, malformed, and likely
truncated JSON are rejected with explicit failure reasons; arbitrary explanatory
prose is not extracted. Any terminal failure enters the existing deterministic
fallback, and the trace preserves attempt count and failure reason.

## Consequences

Studio remains usable when the provider fails, while Observatory can distinguish
first-attempt AI success, retry success, and deterministic fallback. No retries,
repair agent, streaming, cost dashboard, or schema/gameplay expansion is added.
