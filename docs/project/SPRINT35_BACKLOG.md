# Sprint 35 — Progression Meaning Discovery

**Authorization:** Human/CTO decision, 2026-09-01  
**Architecture at authorization:** v1.184  
**Current architecture:** v1.185
**Status:** `WO-S35-001` DONE — Code Complete = YES; Product Verified = YES; `SPRINT35_FREEZE_REVIEW` READY; Sprint 36 not entered

## Product goal

Make a committed Level transition mechanically meaningful through one small,
generic, product-verifiable gameplay consequence. Sprint 35 discovery begins
with repository truth and real Survival play. It does not assume a skill tree,
weapon system, or stat framework.

## Frozen baseline to preserve

- Sprint 34 is FROZEN at v1.184 with `WO-S34-001` Code Complete = YES and
  Product Verified = YES.
- Survival has Runtime-authoritative XP/Level, explicit Space offense,
  committed damage/outcome feedback, fair-start replacements, pursuit,
  contact pressure, and Observatory truth.
- Platformer `Space — 跳跃` and all non-Survival behavior remain unchanged.
- Runtime remains the authority for live progression and gameplay outcomes;
  AI/provider work remains generation-time only.

## Discovery result

The measured blocker is:

> **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**

The existing path commits `XP 0 → 1` and `Level 1 → 2`, but the committed Level
result changes no gameplay component, rule action parameter, target-selection
boundary, movement configuration, or Health semantics.

The smallest selected consequence is a progression-conditioned Survival offense
RuleSet composition over existing generic primitives:

- Level 1: `DAMAGE_ENTITY.amount = 25`;
- Level 2: `DAMAGE_ENTITY.amount = 50`.

See [`SPRINT35_PRODUCT_GAP_DISCOVERY.md`](SPRINT35_PRODUCT_GAP_DISCOVERY.md)
for the complete audit, real-play evidence, candidate ranking, missing
primitive, and stop gates.

## WO-S35-001 — Generic Progression-Conditioned Gameplay Capability

**Status:** DONE — Code Complete = YES; Product Verified = YES
**Priority:** P0 / selected Sprint 35 product gap  
**Architecture before:** v1.184  
**Architecture after:** v1.185
**Owner boundary:** existing Gameplay Rule builder/composition seam, reusing
`packages/shared` Rule semantics and `packages/runtime` executor contracts  
**Dependencies:** Sprint 34 FROZEN at v1.184; Sprint 35 discovery DONE

### Objective

Make one committed Level transition select one generic mechanically observable
capability value. The bounded proof is the existing Survival Player-directed
offense action: use the existing `NUMBER_COMPARE(gameState.level)` condition
and `DAMAGE_ENTITY` action to select mutually exclusive fixed values `25` and
`50` without introducing a live stat/modifier framework.

### Allowed scope

- A pure, declarative, reusable progression-conditioned RuleSet composition
  helper at the existing Gameplay Rule builder boundary.
- Mutually exclusive Level bands for the existing attack trigger and the
  existing generic `DAMAGE_ENTITY` action.
- Deterministic exactly-once/staged evaluation for the Level variant on one
  attack event; the lethal attack must not receive duplicate Level 1/Level 2
  damage.
- Focused Shared/AI/Runtime/Web tests and real Studio Product Verification of
  Level 1 → Level 2 reduced-hit-count behavior.
- Minimal current-state, capability-matrix, changelog, and control-plane
  updates for the executed result.

### Acceptance criteria

1. Level 1 valid Space attack: committed `damageAmount: 25`, Enemy Health
   `100 → 75`.
2. First Enemy defeat: existing `experience +1` and committed `level 1 → 2`;
   no duplicate damage result from the Level 2 variant on that same event.
3. Level 2 next valid Space attack: committed `damageAmount: 50`, Enemy Health
   `100 → 50`; second valid attack defeats the Enemy through the existing
   removal, XP, fair-start replacement, and outcome-feedback path.
4. Current nearest-target/range-48 selection, contact danger, Runtime
   authority, Observatory truth, replacement fair-start, and Platformer jump
   behavior are unchanged.
5. No NaN/infinite value, random reward, UI selection, provider/image call, or
   alternate gameplay authority is introduced.

### Forbidden scope

- `StatsEngine`, `ModifierManager`, `AttributeSystem`, `BuffSystem`,
  `EffectStack`, `SkillTree`, `UpgradeManager`, or any RPG stat framework.
- Dynamic attack-range, movement-speed, max/current-Health, weapon, projectile,
  timer, cooldown, wave, difficulty-scaling, or world-bounds changes.
- A deep Runtime branch keyed by `worldType === survival && level === 2`.
- New progression UI, persistence, telemetry, provider/image operation, or
  Platformer/global Level behavior.
- A second work order, Sprint 36, or unrelated cleanup.

### Execution result

The Human/CTO authorization was accepted on 2026-09-01. The existing
deterministic Survival RuleSet now composes two mutually exclusive offense
variants over the generic `NUMBER_COMPARE(gameState.level)` and
`DAMAGE_ENTITY` primitives:

- `level < 2` → `DAMAGE_ENTITY.amount = 25`;
- `level >= 2` → `DAMAGE_ENTITY.amount = 50`.

The current Runtime progression snapshot is read at attack evaluation time.
The existing target-selection, Health, defeat, XP/Level, fair-start
replacement, feedback, Observatory, and Platformer paths were preserved. No
new Runtime branch, modifier system, or progression UI was added.

Focused and affected tests passed, including exact one-rule selection at
Level 1, Level 2, and Level > 2; same-event lethal no-double-damage; Level 2
two-hit replacement defeat; committed `-25`/`-50` feedback; and Platformer
regression. Real Studio verification passed for the full authorized matrix.

### Verification result

Code Complete = YES. Product Verified = YES. Fresh Sprint 35 Gap Analysis =
PASS with no immediate blocker. Detailed evidence is recorded in
[`SPRINT35_PRODUCT_GAP_DISCOVERY.md`](SPRINT35_PRODUCT_GAP_DISCOVERY.md).

## Stop condition

Sprint 35 implementation is complete at v1.185. Sprint 34 remains FROZEN at
v1.184. `WO-S35-001` is DONE and `SPRINT35_FREEZE_REVIEW` is the only READY
next gate. This continuation stops for Human/CTO freeze review and does not
enter Sprint 36.
