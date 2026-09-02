# ADR-0298 — Generic Player-Directed Entity Interaction Reachability

- **Status:** Accepted / implementation complete; Product Verification pending
- **Date:** 2026-09-02
- **Architecture:** v1.187 → v1.188
- **Work order:** `WO-S38-001`

## Context

Sprint 38 discovery confirmed that the existing Farm and RPG semantic
compositions were reachable from the real CreateWorld front door, but their
characteristic entities were not reachable through an explicit Player action.
Farm had a deferred contact-triggered rule and RPG had no Gameplay Rules.
Movement changed authoritative Player Position, but no Farm/RPG interaction
could commit a result or present a truthful outcome on the Game surface.

## Decision

Add one generic, Runtime-authoritative interaction path:

```text
explicit Player input edge
  → finite-range Runtime target selection
  → ENTITY_INTERACTION_REQUESTED
  → matching GameplayRule
  → trusted SET_ENTITY_PROPERTY mutation
  → authoritative World result
  → transient Renderer feedback / Observatory truth
```

The existing input provider now tracks `Enter`. The production Studio
composition registers the generic request system only for Farm and RPG, with
explicit category allowlists:

- Farm: nearest `npc`
- RPG: nearest `quest`

The request system uses Runtime Position, a finite range of `48`, nearest
Euclidean distance, and stable Runtime ID order as the tie-break. It emits no
request and mutates no state when there is no eligible target. It does not
interpret genre meaning or call a provider.

Farm and RPG each receive exactly one deterministic Gameplay Rule using the
same interaction event path and existing `SET_ENTITY_PROPERTY` action. The
trusted Runtime executor stores the bounded property in an immutable
`gameplay-state` component and emits an `ENTITY_PROPERTY_UPDATED` mutation.
The Renderer projects only a committed `activated` mutation as a generic
interaction cue. No-op, failed, or out-of-range attempts produce no fake
success feedback.

The Studio control footer exposes `Enter — Interact` through existing i18n.
Platformer `Space — Jump` and Survival `Space — Attack` remain unchanged.

## Alternatives rejected

- Remapping or globally reusing `Space`, which would interfere with existing
  Platformer and Survival semantics.
- Farm- or RPG-specific Runtime systems, engines, dialogue, quest, combat, or
  economy frameworks.
- A universal `InteractableComponent`, ontology, classifier, or second input
  authority without evidence that the current bounded seam is insufficient.
- Provider/runtime decisions or a GameViewport-only mutation path.
- Contact-only interaction, which does not provide an explicit Player action.

## Consequences and non-goals

Farm and RPG now prove one characteristic Player-reachable result while
remaining intentionally partial. Crop simulation, inventory, schedules,
merchant economy, dialogue, quest progression, combat expansion, AOE,
cooldowns, and broad genre parity remain deferred. Runtime identity and
authoritative state remain independent of Pixi assets and shared visuals.

## Verification

The production regression enters through `做一个农场游戏` and `创建一个 RPG`,
registers the normal Studio systems, moves the Runtime Player, presses Enter,
and verifies one target-specific authoritative mutation. Focused Runtime,
AI, Renderer, and Web tests cover deterministic targeting, rule execution,
feedback, no-target behavior, and Platformer/Survival non-regression. Full
quality and real Studio verification are recorded in
`docs/project/SPRINT38_GAP_ANALYSIS.md`.
