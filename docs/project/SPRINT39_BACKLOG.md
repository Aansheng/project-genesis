# Sprint 39 Backlog — Cross-Genre Interaction Meaning

This is a one-item Sprint 39 backlog generated from the real Studio
interaction-meaning discovery. Sprint 38 is FROZEN at v1.188 with
WO-S38-001 Code Complete = YES, Product Verified = YES, and the fresh Gap
Analysis PASS. Sprint 39 discovery is complete; the single READY item below
is not executed, and Sprint 40 is not entered.

## WO-S39-001 — Generic Archetype Interaction Consequence (first bounded slice)

status: **READY — not executed**

priority: **P0 / highest-priority shared Farm and RPG meaning blocker**

architecture_before: **v1.188**

architecture_after: **v1.189 expected only if later authorized and executed**

### Product blocker

**SUPPORTED ARCHETYPE INTERACTIONS LACK MECHANICALLY MEANINGFUL CONSEQUENCES**

Farm and RPG now share the verified explicit interaction path:

    Enter
      → finite-range Runtime target
      → ENTITY_INTERACTION_REQUESTED
      → archetype GameplayRule
      → SET_ENTITY_PROPERTY
      → gameplay-state.activated=true

The current committed mutation proves reachability but does not create a
characteristic Farm or RPG state transition, readable result, or next loop.

### Mission

Use the existing trusted Runtime action/state seam to make one existing
supported Farm or RPG interaction mechanically meaningful. Select the
smallest archetype and existing typed action/state mechanism during the
implementation audit. The exact Farm/RPG consequence is deliberately not
preselected during discovery.

### Dependencies and allowed scope

- Sprint 38 freeze and WO-S38-001 reachability at v1.188.
- Existing Studio input, Runtime target selector, interaction event,
  GameplayRule matcher, immutable World mutation, and committed feedback.
- Deterministic Farm 8-entity and RPG 9-entity baselines remain the
  regression paths; Provider candidates remain candidate-only.
- Reuse existing trusted actions/state. No new interaction framework is
  implied.

### Required acceptance

1. Farm and RPG front doors preserve their current semantic baselines and
   Sprint 38 reachability.
2. At least one selected Farm or RPG interaction commits a characteristic
   authoritative state transition beyond activated=true.
3. The result is understandable on the Game surface without Observatory and
   makes the next action, or the bounded lack of one, truthful.
4. No-target and repeated-input truth remains intact.
5. Platformer and Survival baselines, Runtime authority, candidate-only
   Provider behavior, and Observatory truth remain regression-clean.

### Forbidden scope

No Farm engine, FarmingSystem, crop/inventory/economy system, RPG dialogue or
quest framework, combat/progression expansion, Provider completeness repair,
entity-count gate, spatial redesign, FarmRenderer/RPGRenderer, universal
ontology, InteractionManager, new input authority, legacy reconnection,
second Sprint 39 WO, or Sprint 40 entry.

### Verification and completion

Add a focused production-path regression for the selected archetype; run
affected tests, TypeScript, ESLint, relevant regressions, and Web build when
applicable. Perform real Studio Product Verification from the exact normal
prompt, verify before/after Game-surface meaning, cross-check Runtime and
Observatory truth, and record browser warnings/errors. Completion must report
architecture transition, files, real flow, tests, TypeScript, ESLint, manual
verification, remaining gaps, Code Complete, and Product Verified.

**Execution boundary:** READY for later review only. Do not execute this item
in the current Sprint 39 discovery continuation.
