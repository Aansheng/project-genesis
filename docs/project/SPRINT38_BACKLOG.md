# Sprint 38 Backlog — Cross-Genre Playability Fidelity

This is a one-item Sprint 38 backlog generated from the real Studio discovery.
Sprint 37 is FROZEN at v1.187. The item below is READY and has not been
implemented. Sprint 39 is not entered.

## WO-S38-001 — Generic Player-Directed Entity Interaction Reachability

status: **READY — discovery complete; not executed**
priority: **P0 / highest-priority shared Farm and RPG playability blocker**
architecture_before: **v1.187**
architecture_after: **v1.187 unless implementation evidence requires an
accepted architecture change**
code_complete: **NO — not executed**
product_verified: **PENDING — execution not authorized in this continuation**

### Product blocker

**SUPPORTED ARCHETYPE ENTITIES ARE NOT PLAYER-REACHABLE THROUGH AN EXPLICIT
PLAYER INTERACTION PATH.**

Farm generates its correct semantic entities but only exposes generic movement
and jump; its `farm-interact` rule is deferred and contact-triggered. RPG
generates NPC, Quest, Enemy, and Boss entities but has no Gameplay Rule beyond
movement. Neither archetype gives the Player a discoverable action that
selects a characteristic target, commits an authoritative result, and
communicates that result on the Game surface.

### Mission

At the existing input → Runtime event → GameplayRule → authoritative result →
Renderer/Observatory boundary, establish the smallest generic explicit
Player-directed interaction path and prove it against one characteristic Farm
interaction and one characteristic RPG interaction. Reuse existing target,
selector, mutation, feedback, and observability contracts where they fit.

### Allowed scope

- Trace and extend the existing production input contract only as required for
  a discoverable Player interaction; choose the exact key from evidence during
  execution rather than preselecting E, F, Enter, or Space here.
- Resolve one deterministic finite-range current Runtime target using existing
  entity identity/category/semantic selectors.
- Reuse or minimally extend the existing GameplayRule event/condition/action
  boundary so a Farm target and an RPG target can each produce a bounded
  characteristic result.
- Commit the result in authoritative Runtime state and project a clear
  Game-surface outcome; Observatory may verify the result but cannot be the
  only interaction surface.
- Preserve the existing Platformer side-view movement/jump baseline and
  Survival top-down movement/attack/damage/progression baseline.
- Add focused regression and real Studio verification for the two archetypes,
  current supported baselines, world identity, Runtime truth, and browser
  diagnostics.

### Required acceptance contract

1. `做一个农场游戏` still reaches CreateWorld and the existing `farm`
   eight-entity composition.
2. In normal Studio play, the Player can perform at least one discoverable,
   characteristic Farm interaction with a field, NPC, quest, or other
   semantically Farm-relevant entity; the result changes authoritative Runtime
   state and is visible as a meaningful outcome.
3. `创建一个 RPG` still reaches CreateWorld and the existing `rpg`
   nine-entity composition.
4. In normal Studio play, the Player can perform at least one discoverable,
   characteristic RPG interaction with an NPC, quest, enemy, or other
   semantically RPG-relevant entity; the result changes authoritative Runtime
   state and is visible as a meaningful outcome.
5. The same interaction path is not an Observatory-only control and does not
   rely on direct state mutation outside Runtime Gameplay Rules.
6. Platformer and Survival controls and their existing authoritative rules
   remain regression-clean. Exact control mapping, range, target policy, and
   result are bounded by the implementation audit and must not be invented
   beyond the minimum proof.
7. Provider candidates remain candidate-only; unknown genres remain bounded;
   no new genre registry, ontology, or second command router is introduced.

### Forbidden scope and non-goals

- No Farm engine, FarmingSystem, crop simulation, inventory, schedules,
  merchant economy, or broad farming loop.
- No RPG dialogue engine, quest framework, combat system, stats, party, or
  progression expansion.
- No genre parity requirement, arbitrary interaction ontology, or open-ended
  NLU/classifier framework.
- No forced E/F/Enter/Space decision before the execution audit.
- No Renderer-only patch, Observatory-only interaction, provider authority,
  second input authority, or legacy-path reconnection.
- No changes to the frozen Sprint 37 alias/routing decision unless a separate
  measured blocker proves it is required.
- No second Sprint 38 WO and no Sprint 39 entry.

### Execution boundary

This work order is **READY only**. Human/CTO authorization is required before
execution. The next action is to execute this single WO, verify the two
characteristic interactions in the real Studio, and then perform a fresh
Sprint 38 Gap Analysis before any Sprint 39 decision.
