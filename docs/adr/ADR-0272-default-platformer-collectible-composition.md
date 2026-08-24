# ADR-0272 — Default Platformer Collectible Composition

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.157 → v1.158
- Work order: WO-S17-001

## Context

The v1.157 deterministic platformer template contained `player`, `terrain`,
`platform`, `enemy`, `goal`, and `checkpoint`. The existing deterministic
`GameplayRuleBuilder` correctly excludes goal/flag/checkpoint items from
collectible selection, so a normal platformer request produced no
`collect-reward` or `level-up` rule. The generic contact, trusted mutation, and
Runtime progression path was already verified when an eligible coin existed.

## Decision

Extend only the existing deterministic platformer composition boundary with one
stable semantic item:

- id: `collectible`
- category: `item`
- name: `Coin`
- deterministic layout anchor: `(220, 320)`

The existing `GameplayRuleBuilder.collectible()` selection, GameplayRuleSet,
Runtime execution loop, WorldStore, Renderer, and Observatory projections remain
unchanged. The item is placed before the goal without sharing an existing fixed
layout coordinate.

The default deterministic platformer therefore contains seven entities and
automatically derives the existing supported `collect-reward` and `level-up`
rules. No new GameplayEvent, Condition, Action, Runtime system, manager,
provider authority, generated executable code, or genre-specific Runtime is
introduced.

## Explicit boundary

This ADR does not define a provider-candidate completeness policy, death,
failure, restart, respawn, hazards, enemy autonomy, score, spawning, pacing,
or Sprint 18 work. A later product-level gate is required because the currently
configured AI gateway can return a structurally valid but mechanically sparse
platformer candidate; that separate gap is recorded as `WO-S17-002`.

## Consequences

The deterministic generation and fallback path now composes the first required
collectible interaction in the generic platformer loop. Existing rules can
remove only the collectible and commit Runtime progression without a new
architecture layer. Provider candidates remain subject to the existing
validation boundary; this ADR does not claim that structural validation alone
proves a complete gameplay loop.

## Verification

- Focused AI template/layout/create-world tests: 178 passed.
- Runtime gameplay regressions: 79 passed; Web gameplay regressions: 9 passed.
- Affected AI/Runtime/Web TypeScript checks passed; package ESLint exited with
  no errors (repository-existing warnings remain); Web production build passed.
- Deterministic fallback Studio verification generated seven entities, observed
  collectible removal, `Experience: 1`, `Level: 2`, and six remaining Runtime
  entities with no browser warning/error logs.
- Real configured AI gateway verification remains blocked by a validated
  two-entity platformer candidate (`player`, `platform`) that bypasses the
  deterministic baseline; no Product Verified claim is made for that path.
