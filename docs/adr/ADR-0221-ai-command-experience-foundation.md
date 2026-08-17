# ADR-0221: AI Command Experience Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-007
- Architecture Version: v1.107 to v1.108

## Context

Genesis Studio already routed command input through the real Web command
executor and RuntimeWorldStore, but its activity surface exposed only a raw
message. The first creation workflow needs clear lifecycle feedback and a
truthful summary without adding AI-specific execution or Runtime state.

## Decision

Keep command lifecycle state in the Web Pinia store as `idle`, `running`,
`success`, or `error`. Add a small `StudioCommandActivity` presentation
component. Successful creation displays a creation label and the real entity
count returned by the command executor. Errors display a concise status while
retaining the real human-readable message for accessibility and compatibility.

The command executor remains synchronous because the current production
pipeline is synchronous. No artificial delay, fake progress stages, model
metadata, token usage, or genre metadata is introduced. Runtime and AI
contracts remain unchanged apart from an optional Web command result entity
count.

## Consequences

- Users can see where to enter a request, that it is being handled, and what
  the resulting world contains.
- Unknown commands remain truthful and actionable.
- Existing Enter submission and gameplay keyboard isolation are preserved.
- World type is not shown because the projected Runtime `World` does not carry
  that semantic field; adding a duplicate derivation would be misleading.

## Verification

Focused Studio shell and command-routing tests cover generated-world summaries,
real entity counts, unknown commands, and shared RuntimeWorldStore behavior.
Browser verification remains pending for Enter submission and visual behavior.
