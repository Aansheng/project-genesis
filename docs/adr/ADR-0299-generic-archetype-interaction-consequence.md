# ADR-0299 — Generic Archetype Interaction Consequence

- **Status:** Accepted / implemented / Product Verified
- **Date:** 2026-09-03
- **Architecture:** v1.188 → v1.189
- **Work order:** `WO-S39-001`

## Context

Sprint 39 discovery confirmed that the Sprint 38 Farm/RPG interaction path
was genuinely reachable, but its authoritative meaning stopped at
`gameplay-state.activated = true`. The shared request, target, event, Rule,
Runtime mutation, and feedback seams were already sufficient; the missing
capability was one bounded archetype-specific consequence after a successful
interaction.

## Decision

Reuse the existing typed `SET_ENTITY_PROPERTY` action and immutable
`gameplay-state` component. Extend the existing property allowlist with the
two bounded characteristic properties needed by the selected interaction
rules:

- Farm selects one eligible nearby `terrain` target, preferring field-like
  identifiers/names, and commits `activated = true` plus `harvested = true`.
- RPG retains the existing nearby `quest` target and commits `activated =
  true` plus `questAccepted = true`.

The production path remains:

```text
Enter edge
  → finite-range Runtime target selection
  → ENTITY_INTERACTION_REQUESTED
  → archetype GameplayRule
  → trusted SET_ENTITY_PROPERTY actions
  → immutable authoritative gameplay-state
  → committed Renderer feedback / Observatory truth
```

The interaction request mechanism remains generic. It continues to own
Enter, range `48`, nearest-target selection, stable Runtime-ID tie-breaking,
no-target truth, and repeated-input no-op behavior. Runtime remains the sole
mutation authority; the Renderer derives `Harvested` and `Quest accepted`
labels from committed mutations and does not invent state.

## Alternatives rejected

- Adding an `InteractionOutcomeEngine`, Farm/Farming/Harvest/Resource/
  Inventory/Economy system, or RPG Quest/Dialogue framework for a one-slice
  consequence.
- Introducing a second action contract or a genre-specific Runtime authority
  when the existing typed property mutation already provides immutable,
  serializable state and truthful no-op semantics.
- Making Provider output authoritative or adding an entity-count/completeness
  gate. Provider candidates remain candidate-only and structurally invalid
  candidates still use the existing deterministic fallback.
- Reworking spatial targeting, input ownership, or the generic interaction
  event path.

## Consequences and non-goals

Farm and RPG now expose one meaningful committed state transition on the Game
surface while preserving the shared interaction architecture. The selected
properties remain bounded archetype state on the existing component; they do
not imply a Farm simulation, resource/inventory/economy loop, RPG dialogue,
quest progression, combat, or a universal genre ontology. Platformer
`Space — Jump`, Survival `Space — Attack`, and all existing no-target and
repeat semantics remain unchanged.

## Verification

Focused AI, Runtime, Renderer, and Web regressions passed. Full Shared, AI,
Runtime, Renderer, and Web suites passed, as did package TypeScript checks,
ESLint with no errors, and the Web production build. Real Studio verification
confirmed a Provider-accepted Farm candidate commits `harvested = true` and a
9-entity RPG deterministic-fallback world commits `questAccepted = true`.
Full Observatory showed the corresponding committed actions and Runtime
entity state; repeating the RPG interaction produced two truthful
`SET_ENTITY_PROPERTY:no_op` results. Fresh Gap Analysis is recorded in
`docs/project/SPRINT39_GAP_ANALYSIS.md`.
