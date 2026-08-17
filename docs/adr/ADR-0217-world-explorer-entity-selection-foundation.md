# ADR-0217: World Explorer Entity Selection Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-003
- Architecture Version: v1.103 to v1.104

## Context

The Studio World Explorer exposed real Runtime entities but had no way to
inspect one entity in context. Selection must remain a Studio UI concern and
must not mutate or duplicate Runtime Entity state.

## Decision

Store only `selectedEntityId` in the Pinia `gameStore`. Resolve the selected
entity from the current `RuntimeWorldStore` whenever the UI renders. World
updates increment the existing Studio revision signal so the Explorer and
Inspector react to runtime movement. If a world replacement removes the
selected id, selection is cleared; if the id remains, selection is retained.

World Explorer rows use native buttons with `aria-pressed`, selected styling,
and normal keyboard semantics. Inspector renders the selected entity's real
type, PositionComponent, and generic component properties as read-only data.

## Consequences

- Selection follows the authoritative Runtime world and never stores an Entity
  snapshot.
- Inspector position values update as the selected runtime entity moves.
- No Runtime, Renderer, AI, DSL, camera, editing, or Observatory selection
  architecture changes are introduced.

## Verification

Focused Studio coverage checks selection, re-selection, current position
updates, component rendering, and world replacement clearing. Manual browser
verification covers player/enemy selection and same-session runtime behavior.
