# ADR-0252: Game Design Codex CLI Provider Selection

## Status

Accepted — architecture v1.137 → v1.138.

## Context

Genesis already has a server-owned structured game-design provider boundary.
Local development also needs an option to use the authenticated Codex CLI
without exposing provider credentials or making the browser execute a child
process. Image generation has an independent `IMAGE_AI_*` configuration and
must remain unchanged.

## Decision

- Add `AI_GAME_DESIGN_MODE=api|codex-cli`, defaulting to `api`.
- Keep `StructuredGenerationClient` as the transport boundary. The Codex
  implementation runs `codex exec --ephemeral --json` server-side with an
  argument array, bounded timeout, process-group cleanup, JSON/JSONL candidate
  extraction, and typed safe failures.
- Keep prompt assembly, candidate parsing, validation, deterministic fallback,
  and generation traces in their existing layers.
- Extend the session-only AI settings API so the web app can switch modes at
  runtime. Public responses contain mode/provider metadata only; secrets and
  local paths never cross the gateway.
- Report the selected provider in the generation trace. The image provider
  remains selected only by `IMAGE_AI_*`.

## Consequences

API mode remains backward compatible. Codex mode requires a locally available
and authenticated CLI, but does not require an API key. CLI availability is
testable from the settings page; a failed or malformed CLI response still
flows through the existing typed failure and deterministic fallback path.

## Verification

Targeted AI-server tests cover mode switching, JSONL extraction, malformed
output, timeout abort, and safe stderr handling. TypeScript checks cover the
AI server and web settings contract. Full product verification additionally
requires starting the local gateway and exercising the settings page and a
world-generation request in a browser.
