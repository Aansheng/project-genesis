# Sprint 38 Fresh Gap Analysis — Post `WO-S38-001`

Date: **2026-09-02**

Work order: **`WO-S38-001 — Generic Player-Directed Entity Interaction Reachability`**

Architecture: **v1.187 → v1.188**

Result: **PENDING — implementation complete; final real Studio input-edge evidence required before `SPRINT38_FREEZE_REVIEW`**

## Execution result

The authorized work order closes the measured cross-genre reachability gap at
the existing production seams. A normal Studio Player input edge now travels
through one generic Runtime request system, deterministic finite-range target
selection, `ENTITY_INTERACTION_REQUESTED`, the existing GameplayRule matcher,
trusted `SET_ENTITY_PROPERTY`, immutable Runtime World mutation, and a
committed Renderer feedback projection.

The mapping is explicit and bounded: Farm selects one nearest `npc`; RPG
selects one nearest `quest`; both use `Enter — Interact`. Farm and RPG keep
their existing semantic entity compositions and receive different
target-specific Gameplay Rules over the same request path. Platformer keeps
`Space — Jump`; Survival keeps `Space — Attack`.

## Fresh acceptance matrix

| Surface | Evidence | Result |
| --- | --- | --- |
| Farm front door | Automated production-path regression: `做一个农场游戏` → CreateWorld → existing 8-entity `farm` world → Runtime movement → Enter near one `npc` → `ENTITY_INTERACTION_REQUESTED` → `farm-interaction` → committed `gameplay-state.activated = true` → interaction cue. Final browser input-edge action remains pending. | **AUTOMATED PASS / BROWSER PENDING** |
| RPG front door | Automated production-path regression: `创建一个 RPG` → CreateWorld → existing 9-entity `rpg` world → Runtime movement → Enter near one `quest` → the same generic request path → `rpg-interaction` → committed `gameplay-state.activated = true` → interaction cue. Final browser input-edge action remains pending. | **AUTOMATED PASS / BROWSER PENDING** |
| Determinism / truth | nearest eligible target, stable Runtime-ID tie-break, finite range, no-target no event/no rule/no mutation, repeated activation is a Runtime no-op without duplicate positive feedback | **PASS** |
| Platformer baseline | side-view movement, gravity, Ground/Platform collision, Space Jump, stomp, goal, and current gameplay rules remain covered by existing regressions | **PASS** |
| Survival baseline | top-down X/Y movement, Space Attack, pursuit, Health/progression/replacement, fair-start, and feedback remain covered; Enter does not steal Space | **PASS** |
| Authority / architecture | target identity and Position come from Runtime; Rules own meaning/mutation; Renderer only presents committed results; no provider call occurs on Player input | **PASS** |

No universal interaction ontology, Farm/RPG engine, dialogue/quest/combat
framework, second input architecture, legacy-path reconnection, or Sprint 39
work was introduced.

## Quality evidence

- Runtime full suite: **711/711 passed**.
- AI full suite: **9442/9442 passed**.
- Renderer full suite: **513/513 passed**.
- Web full suite: **3585/3585 passed**.
- TypeScript checks passed for Shared, Runtime, AI, Renderer, and Web.
- ESLint completed with zero errors; existing warnings remain.
- The production Web regression covers both real CreateWorld entry paths and
  no-target behavior.
- Real Studio browser UI verification currently confirms v1.188, the
  discoverable controls, supported Farm/RPG rule compositions, and empty
  diagnostics. The browser control session has not yet produced a stable
  polled input edge for the final Farm/RPG mutation check, so Product Verified
  remains pending.

## Next control-plane gate

The fresh Gap Analysis is pending the final real Studio input-edge evidence.
After that check, record PASS/FAIL and stop at `SPRINT38_FREEZE_REVIEW` for
Human/CTO review. Sprint 39 is not entered, and no additional Sprint 38 work
order is generated here.
