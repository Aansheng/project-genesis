# Sprint 38 Fresh Gap Analysis — Post `WO-S38-001`

Date: **2026-09-02**

Work order: **`WO-S38-001 — Generic Player-Directed Entity Interaction Reachability`**

Architecture: **v1.187 → v1.188**

Result: **PASS — Code Complete = YES; Product Verified = YES; `SPRINT38_FREEZE_REVIEW` selected**

## Execution result

The authorized work order closes the measured cross-genre reachability gap at
the existing production seams. A normal Studio Player input edge now travels
through one generic Runtime request system, deterministic finite-range target
selection, `ENTITY_INTERACTION_REQUESTED`, the existing GameplayRule matcher,
trusted `SET_ENTITY_PROPERTY`, immutable Runtime World mutation, and a
committed Renderer feedback projection.

The mapping is explicit and bounded: Farm selects one nearest `npc`; RPG
selects one nearest `quest`; both use `Enter — Interact`. Farm and RPG receive
different target-specific Gameplay Rules over the same request path. The
deterministic Farm fallback and RPG baseline remain covered by their existing
production regressions; Provider candidate entity-count variance is recorded
separately. Platformer keeps `Space — Jump`; Survival keeps `Space — Attack`.

## Fresh acceptance matrix

| Surface | Evidence | Result |
| --- | --- | --- |
| Farm front door | Automated deterministic-fallback regression: `做一个农场游戏` → CreateWorld → existing 8-entity `farm` world → Runtime movement → Enter near one `npc` → `ENTITY_INTERACTION_REQUESTED` → `farm-interaction` → committed `gameplay-state.activated = true` → interaction cue. Real Studio Provider-accepted Farm verification also committed the same result in a 5-entity candidate. | **PASS** |
| RPG front door | Automated production-path regression and real Studio verification: `创建一个 RPG` → CreateWorld → 9-entity `rpg` world → Runtime movement → Enter near one `quest` → `ENTITY_INTERACTION_REQUESTED` → `rpg-interaction` → committed `gameplay-state.activated = true` → interaction cue. | **PASS** |
| Determinism / truth | nearest eligible target, stable Runtime-ID tie-break, finite range, no-target no event/no rule/no mutation, repeated activation is a Runtime no-op without duplicate positive feedback | **PASS** |
| Platformer baseline | side-view movement, gravity, Ground/Platform collision, Space Jump, stomp, goal, and current gameplay rules remain covered by existing regressions | **PASS** |
| Survival baseline | top-down X/Y movement, Space Attack, pursuit, Health/progression/replacement, fair-start, and feedback remain covered; Enter does not steal Space | **PASS** |
| Authority / architecture | target identity and Position come from Runtime; Rules own meaning/mutation; Renderer only presents committed results; no provider call occurs on Player input | **PASS** |

No universal interaction ontology, Farm/RPG engine, dialogue/quest/combat
framework, second input architecture, legacy-path reconnection, or Sprint 39
work was introduced.

## Separate product observation — Provider candidate composition variance

The real Studio Farm verification used a Provider-accepted `farm` candidate
with 5 entities. The deterministic fallback path remains covered by the
production regression with the historical 8-entity Farm composition. The
5-vs-8 difference is classified as **PROVIDER CANDIDATE SEMANTIC COMPOSITION
COMPLETENESS VARIANCE**, not as an interaction-reachability failure and not as
a blocker for this WO. No fallback forcing, candidate-acceptance weakening,
Farm-template patch, entity-count patch, or Provider retry was introduced.
This may become a future measured Product Gap only if fresh evidence shows it
is frequent and the highest-priority user-visible blocker.

## Quality evidence

- Runtime full suite: **711/711 passed**.
- AI full suite: **9442/9442 passed**.
- Renderer full suite: **513/513 passed**.
- Web full suite: **3585/3585 passed**.
- TypeScript checks passed for Shared, Runtime, AI, Renderer, and Web.
- ESLint completed with zero errors; existing warnings remain.
- The production Web regression covers both real CreateWorld entry paths and
  no-target behavior.
- Real Studio verification confirms both normal-play input edges and committed
  outcomes: Farm `player-farmer → npc-merchant` at distance `31` committed
  `farm-interaction`, RPG `player → quest-giver` at distance approximately
  `36.67` committed `rpg-interaction`, and both target entities show
  `gameplay-state.activated = true`. Repeated interactions are truthful
  `no_op` results, and browser warning/error diagnostics are empty.

## Next control-plane gate

The fresh Gap Analysis is **PASS**. The repository stops at
`SPRINT38_FREEZE_REVIEW` for Human/CTO review. Sprint 39 is not entered, and
no additional Sprint 38 work order is generated here.
