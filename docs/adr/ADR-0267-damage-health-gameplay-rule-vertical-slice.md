# ADR-0267 — Damage / Health Gameplay Rule Vertical Slice

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.152 → v1.153
- Work order: WO-S15-006

## Context

The S15-005 rule path can already consume a truthful contact fact and commit
generic Runtime mutations, but the normal platformer still has no bounded
damage state. The approved next slice is the smallest generic path in which a
player contacting an enemy from a non-top direction loses Health without
introducing death, respawn, or game-over behavior.

The Runtime already owns immutable components, collision geometry, the
post-system GameplayRule phase, and `WorldMutator.replaceEntity`. Health must
use those existing boundaries. It must not become an enemy-specific system or
make a zero value imply a broader failure flow.

## Decision

Add a frozen shared `health` component with `{ current, max }` numeric
properties. The semantic-to-DSL builder gives entities of category `player`,
`enemy`, or `npc` a default `100/100` Health component; terrain and items do
not receive combat state. The component factory clamps construction values to
finite, non-negative current Health no greater than a positive max.

Promote the typed `DAMAGE_ENTITY` action to a supported generic Runtime
primitive. Its contract is:

1. The amount must be positive and finite.
2. The target must resolve in the current Runtime World and carry a valid
   Health component.
3. The action retains `max` and updates only `current` to
   `max(0, current - amount)`.
4. `current === 0` is state only. It does not remove the entity or trigger
   death, respawn, lives, or game-over behavior.

The action reuses `WorldMutator.replaceEntity` and returns a separate
`HEALTH_UPDATED` mutation fact. Raw `ENTITY_CONTACT_STARTED` events, rule
results, and the committed Runtime World remain separate observable surfaces.
Missing or invalid Health fails safely without mutating the World.

The deterministic platformer RuleSet adds `enemy-contact-damage`: player and
enemy category conditions, player Health existence, and the existing narrow
negated `CONTACT_DIRECTION_EQUALS top` condition lead to
`DAMAGE_ENTITY(eventActor, amount: 1)`. The condition intentionally means
non-top contact (`bottom`, `left`, or `right`) so the generic rule remains
bounded to the already typed contact vocabulary. Provider support claims still
cannot promote unsupported primitives.

## Boundaries

- Health and damage remain shared, generic Runtime concepts; no
  `EnemyDamageSystem`, Mario-specific system, or enemy AI is introduced.
- Zero Health is observable state only. Death, respawn, invincibility,
  knockback, score, XP, goals, timers, spawners, progression, and win/lose
  remain deferred.
- Rule execution remains after finalized Runtime systems and uses the existing
  world/session/semantic-revision binding, exactly-once guard, and immutable
  mutation path. World A facts cannot mutate World B.
- The Renderer consumes the resulting Runtime World; it does not interpret
  damage or Health. Observatory records the raw contact and the separate
  committed `DAMAGE_ENTITY` outcome truthfully.
- No generic manager, transaction framework, generated code, eval, or full
  Runtime/Renderer rebuild is added.

## Consequences

The production Studio can now show a player with authoritative Health,
contact-driven generic damage, and a committed Inspector update while keeping
the existing playable loop continuous. The action is reusable by future
validated generic rules, but this ADR deliberately stops before depletion
semantics or failure flow.

## Verification

- Shared tests cover immutable Health construction, clamping, and category
  defaults.
- AI tests cover Health projection, Health-aware validation, supported
  `DAMAGE_ENTITY` capability truth, and deterministic rule construction.
- Runtime tests cover non-top contact damage, current-only mutation, safe
  missing-Health failure, deferred/stale gates, and immutable World behavior.
- Web tests cover real Health Inspector mapping, Observatory rule projection,
  and updated runtime structure diagnostics.
- Shared, Runtime, AI, Renderer, and Web affected-package tests pass; direct
  TypeScript and ESLint checks pass; the Web build passes.
- Local Chrome Studio verification created MarioWorld, observed real
  `ENTITY_CONTACT_STARTED` and committed `enemy-contact-damage` entries in the
  full Observatory event stream, and observed Inspector Health fall from
  `100/100` to `93/100`.
