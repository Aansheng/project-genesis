# ADR-0295 — Generic Progression-Conditioned Gameplay Capability

- **Date:** 2026-09-01
- **Status:** Accepted after implementation and verification gates
- **Architecture:** v1.184 → v1.185
- **Work order:** `WO-S35-001 — Generic Progression-Conditioned Gameplay Capability`

## Context

Sprint 35 discovery found that Runtime XP/Level truth was already committed
and observable, but the Level 1 → 2 transition changed no gameplay outcome.
The smallest meaningful consequence was the existing Survival Player-directed
offense path: an Enemy with Health `100` should take four Level 1 hits at 25
damage and two Level 2 hits at 50 damage.

The repository already supports typed `NUMBER_COMPARE` conditions over the
Runtime-owned `gameState` progression snapshot and fixed generic
`DAMAGE_ENTITY` actions. The missing capability was RuleSet composition that
selects mutually exclusive action variants from the current progression state.
No live stat, modifier, weapon, or progression UI system is required for this
bounded proof.

## Decision

Keep progression-conditioned capability selection at the existing Gameplay
Rule builder/composition boundary:

1. Preserve `survival-player-offense` for `level < 2` with
   `DAMAGE_ENTITY.amount = 25`.
2. Add one same-trigger offense variant for `level >= 2` with
   `DAMAGE_ENTITY.amount = 50`.
3. Reuse the existing `NUMBER_COMPARE(gameState.level)` and
   `DAMAGE_ENTITY` schemas and Runtime evaluator/action executor.
4. Keep the existing `ENTITY_ATTACK_REQUESTED` target-selection path and
   evaluate the current progression snapshot at attack time.
5. Keep the threshold bounded at Level 2: values above Level 2 use the same
   50-damage variant and do not introduce additional scaling.

The conditions are mutually exclusive, so the ordered executor can evaluate
both candidates for one attack event without committing two damage actions.
The Level 1 lethal attack may still commit the existing defeat, XP, and Level
transition actions in that same event; the Level 2 offense variant remains
condition-failed and cannot add a second hit.

## Consequences

- A committed Level transition now has a direct, deterministic, visible
  gameplay consequence through existing Health and outcome feedback.
- Runtime remains the authority for progression, Health, defeat, replacement,
  and committed action facts; Web and Renderer remain projections/composition.
- No cache or world rebuild is needed when Level changes; the next attack in
  the same world/session reads the new committed value.
- Survival contact damage, attack range `48`, movement speed, Player Health,
  fair-start replacement, and Platformer `Space → Jump` remain unchanged.
- Further Level thresholds, stat stacking, upgrades, equipment, projectiles,
  cooldowns, timers, waves, and progression UI require separate decisions.

## Verification

- AI RuleSet composition and create-world integration: **10/10 focused tests**.
- Runtime gameplay execution regression: **22/22 focused tests**.
- Web production Survival offense and outcome feedback: **11/11 focused tests**.
- Full affected-package suites: AI **9430/9430**, Runtime **711/711**,
  Renderer **510/510**, Web **3575/3575**.
- Exact one-rule selection at Level 1, Level 2, and Level > 2; same-event
  lethal no-double-damage; Level 2 two-hit replacement defeat; committed
  `-25` and `-50` feedback; and Platformer regression: **pass**.
- Full affected-package tests, TypeScript, ESLint, Web build, real Studio
  Product Verification, and browser diagnostics: **pass**.
- Fresh Sprint 35 Gap Analysis: **PASS**; the repository stops at
  `SPRINT35_FREEZE_REVIEW` and does not enter Sprint 36.
