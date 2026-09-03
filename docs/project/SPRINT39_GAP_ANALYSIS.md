# Sprint 39 Fresh Gap Analysis — Post `WO-S39-001`

Date: **2026-09-03**

Work order: **`WO-S39-001 — Generic Archetype Interaction Consequence (first bounded slice)`**

Architecture: **v1.188 → v1.189**

Result: **PASS — Code Complete = YES; Product Verified = YES; `SPRINT39_FREEZE_REVIEW` selected**

Sprint 40 was not entered.

## Execution result

The authorized work order closes the measured Sprint 39 meaning gap at the
existing production seams. The same generic Enter → finite-range target →
`ENTITY_INTERACTION_REQUESTED` → GameplayRule path now commits an
archetype-specific property in addition to the existing activation marker:
Farm commits `harvested = true` on a nearby field-like terrain target, and RPG
commits `questAccepted = true` on a nearby quest target. Both mutations remain
immutable `gameplay-state` state owned by Runtime.

The implementation adds no interaction engine, genre system, provider
authority, second input path, or new mutation framework. Renderer feedback is
derived only from committed mutations, so the Game surface displays
`Harvested` or `Quest accepted` while Observatory exposes the same Runtime
truth.

## Files and architecture record

Created: `docs/adr/ADR-0299-generic-archetype-interaction-consequence.md` and
this fresh Gap Analysis. Modified implementation files are the shared
Gameplay Rule schema/export, AI Rule builder/validator/specification builder
and fixtures, Runtime Rule execution typing, Renderer outcome model/projector/
Pixi view and fixtures, Web Farm/RPG motion profile, project metadata, and Web
Observatory/interaction regressions. Modified control-plane files are
`docs/engineering/CURRENT_STATE.md`, `HUMAN_DECISION_LOG.md`, `ROADMAP.md`,
`WORK_QUEUE.md`, `docs/project/CHANGELOG.md`,
`GAMEPLAY_CAPABILITY_MATRIX.md`, `PROJECT_STATE.md`, and
`SPRINT39_BACKLOG.md`.

## Real architecture flow

```text
StudioCommandBar
  → gameStore.send
  → IntentRouter / CreateWorld
  → Provider candidate or deterministic fallback
  → Semantic World
  → Game DSL
  → Runtime projection
  → Studio motion / interaction systems
  → Enter + finite-range nearest target
  → ENTITY_INTERACTION_REQUESTED
  → GameplayRule matcher / executor
  → immutable gameplay-state mutation
  → RuntimeVisualizationLoop
  → Pixi feedback + Full Observatory
```

Target selection still uses Enter, range `48`, nearest distance, stable
Runtime-ID tie-breaking, an explicit category allowlist, no event when there
is no eligible target, and truthful repeat no-op behavior. Farm's selected
category is `terrain` with a field-like preference; RPG retains `quest`.

## Fresh acceptance matrix

| Surface | Evidence | Result |
| --- | --- | --- |
| Farm front door | Real `做一个农场游戏` Provider-accepted world with 5 entities: `player-farmer` at x=80, `terrain-farmland` at x=160, plus building/item/npc. After normal ArrowRight movement, Player was x=116 and the target distance was 47. Full Observatory recorded `ENTITY_INTERACTION_REQUESTED`, then `farm-interaction` with two committed `SET_ENTITY_PROPERTY` actions. Runtime Entity Inspector showed `gameplay-state: {"activated": true, "harvested": true}`. | **PASS** |
| RPG front door | Real `创建一个 RPG` session resolved to the 9-entity deterministic fallback after a structurally invalid Provider candidate. `quest-giver` was x=512/y=384 and Player x=473/y=400; Full Observatory recorded distance `42.15447781671599`, `rpg-interaction`, and two committed actions. Runtime Entity Inspector showed `{"activated": true, "questAccepted": true}`. | **PASS** |
| Game-surface meaning | Committed characteristic mutations are projected to interaction feedback labels `Harvested` and `Quest accepted`; the generic activation cue remains for activation-only outcomes. | **PASS** |
| Determinism / truth | Enter, finite range `48`, nearest eligible target, stable-ID tie-break, no-target no event/no mutation, and repeated activation as an immutable Runtime no-op remain covered by focused and full regressions. Real RPG repeat Enter produced `SET_ENTITY_PROPERTY:no_op, SET_ENTITY_PROPERTY:no_op` and `not-committed`. | **PASS** |
| Platformer baseline | Existing side-view movement, gravity, platform collision, `Space — Jump`, stomp, goal, damage, and lifecycle regressions remain green. | **PASS** |
| Survival baseline | Existing top-down movement, `Space — Attack`, pursuit, Health/progression/replacement, fair-start, and outcome feedback remain green; Enter does not replace Space. | **PASS** |
| Provider / authority | Provider candidates remain candidate-only. The Farm PV candidate had 5 entities; the deterministic Farm 8-entity and RPG 9-entity paths remain covered. Player input never calls a Provider or mutates state directly. | **PASS** |
| Observatory / diagnostics | Full Observatory header showed v1.189 / Sprint 39, event stream and Runtime inspector agreed with committed state, and browser warn/error diagnostics were empty. | **PASS** |

No universal interaction ontology, `InteractionOutcomeEngine`, Farm/RPG
subsystem, Provider completeness gate, spatial redesign, legacy reconnection,
second Sprint 39 WO, or Sprint 40 work was introduced.

## Automated quality evidence

- Shared full suite: **211/211 passed**.
- AI full suite: **9442/9442 passed**.
- Runtime full suite: **714/714 passed**.
- Renderer full suite: **516/516 passed**.
- Web full suite: **3585/3585 passed**.
- Focused AI: **11/11 passed**; focused Runtime: **25/25 passed**;
  focused Renderer: **17/17 passed**; focused Web reachability: **2/2
  passed**.
- TypeScript checks passed for Shared, AI, Runtime, Renderer, and Web.
- ESLint completed with zero errors; repository warnings remain (AI 115,
  Renderer 28, Web 375).
- Web production build passed; only the existing large-chunk advisory was
  emitted.

## Remaining gaps and disposition

The selected blocker is closed for this bounded slice. The following remain
deliberately deferred or separately measured:

- Provider-accepted Farm composition can be 5 entities rather than the
  deterministic 8-entity baseline; no entity-count contract was introduced.
- Farm resource production, crop lifecycle, storage, inventory, economy, and
  broader harvesting remain deferred.
- RPG dialogue, quest progression beyond `questAccepted`, combat, and
  progression remain deferred.
- Farm/RPG still inherit the existing side-view/Space-jump presentation
  behavior; this is a separate spatial/control observation.
- No generic interaction-outcome framework or cross-genre parity claim is
  implied.

## Next control-plane gate

Fresh Gap Analysis is **PASS**. `WO-S39-001` is **DONE** with Code Complete
and Product Verified both **YES**. Select `SPRINT39_FREEZE_REVIEW` for
Human/CTO review and stop there. Do not enter Sprint 40.
