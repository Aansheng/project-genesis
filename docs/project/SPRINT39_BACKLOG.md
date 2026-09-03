# Sprint 39 Backlog — Cross-Genre Interaction Meaning

This was a one-item Sprint 39 backlog generated from the real Studio
interaction-meaning discovery. Sprint 38 is FROZEN at v1.188 with
WO-S38-001 Code Complete = YES, Product Verified = YES, and the fresh Gap
Analysis PASS. The authorized item below is complete at v1.189; the
repository is ready for `SPRINT39_FREEZE_REVIEW`, and Sprint 40 is not
entered.

## WO-S39-001 — Generic Archetype Interaction Consequence (first bounded slice)

status: **DONE — Code Complete = YES; Product Verified = YES**

priority: **P0 / highest-priority shared Farm and RPG meaning blocker**

architecture_before: **v1.188**

architecture_after: **v1.189**

### Product blocker

**SUPPORTED ARCHETYPE INTERACTIONS LACK MECHANICALLY MEANINGFUL CONSEQUENCES**

Farm and RPG now share the verified explicit interaction path:

    Enter
      → finite-range Runtime target
      → ENTITY_INTERACTION_REQUESTED
      → archetype GameplayRule
      → SET_ENTITY_PROPERTY
      → immutable gameplay-state consequence

`WO-S39-001` closes this bounded meaning gap by reusing the existing typed
action/state seam. Farm selects one nearby field-like `terrain` target and
commits `activated=true` plus `harvested=true`; RPG retains one nearby `quest`
target and commits `activated=true` plus `questAccepted=true`. The Game surface
derives `Harvested` / `Quest accepted` from committed mutations.

### Mission

Reuse the existing trusted Runtime action/state seam to make the supported
Farm and RPG interactions mechanically meaningful within one bounded slice.
Do not add domain engines: extend the existing typed property allowlist,
compose the two existing archetype Rules, preserve generic targeting, and
project committed state through the existing feedback path.

### Dependencies and allowed scope

- Sprint 38 freeze and WO-S38-001 reachability at v1.188.
- Existing Studio input, Runtime target selector, interaction event,
  GameplayRule matcher, immutable World mutation, and committed feedback.
- Deterministic Farm 8-entity and RPG 9-entity baselines remain the
  regression paths; Provider candidates remain candidate-only.
- Reuse existing trusted actions/state. No new interaction framework is
  implied.
- The implementation audit selected `harvested` for a field-like Farm
  `terrain` target and `questAccepted` for the existing RPG `quest` target;
  both retain `activated` as the generic activation marker.

### Required acceptance

1. Farm and RPG front doors preserve their current semantic baselines and
   Sprint 38 reachability.
2. Farm commits `harvested=true` on a nearby eligible terrain target and RPG
   commits `questAccepted=true` on a nearby quest target, beyond
   `activated=true`.
3. The committed result is understandable on the Game surface without
   Observatory through the existing feedback projection.
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

Focused production-path regressions cover both archetypes. Shared 211/211,
AI 9442/9442, Runtime 714/714, Renderer 516/516, and Web 3585/3585 full
suites pass; focused AI/Runtime/Renderer/Web checks pass 11/11, 25/25, 17/17,
and 2/2. Shared, AI, Runtime, Renderer, and Web TypeScript checks pass;
ESLint has zero errors; and the Web production build passes. Real Studio
Product Verification confirms the Provider-accepted Farm candidate commits
`harvested=true`, the 9-entity RPG deterministic fallback commits
`questAccepted=true`, Full Observatory agrees with Runtime state, and a
repeated RPG Enter produces truthful `no_op` results with empty browser
diagnostics. Full details are in `docs/project/SPRINT39_GAP_ANALYSIS.md` and
`docs/adr/ADR-0299-generic-archetype-interaction-consequence.md`.

**Execution boundary:** This was the only authorized Sprint 39 WO and is now
complete. Stop at `SPRINT39_FREEZE_REVIEW` for Human/CTO review. Do not enter
Sprint 40.
