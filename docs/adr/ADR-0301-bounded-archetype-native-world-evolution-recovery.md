# ADR-0301 — Bounded Archetype-Native World Evolution Recovery

- **Status:** Accepted / implemented / Product Verified
- **Date:** 2026-09-04
- **Architecture:** v1.190 → v1.191
- **Work order:** `WO-S41-001`

## Context

Sprint 41 discovery found the same first production divergence for Farm and
RPG. The Studio correctly routed `再加一块麦田` and `再加一个任务` to World
Evolution, but structured generation failed with `provider_error` before a
semantic delta existed. Consequently, Runtime mutation and evolved-entity
gameplay reachability could not be measured. Survival already demonstrated
that a bounded deterministic addition can use the existing semantic-delta and
Runtime synchronization path.

The active semantic world already supplies authoritative archetype context. The
first repair therefore needs only a small, deterministic interpretation for a
clear role that the current archetype already supports. It must not become a
general natural-language editor or bypass Provider candidate validation.

## Decision

Extend the existing `DeterministicWorldEvolutionCandidateProvider` with one
bounded current-world-context mapping:

- In a `farm` semantic world, a clear add request containing an existing field
  role alias (`麦田`, `麦地`, `农田`, `field`, `farmland`, and the current
  wheat-field equivalents) produces the normal `add-entity` candidate for
  `terrain` / `Wheat Field`.
- In an `rpg` semantic world, a clear add request containing an existing quest
  role alias (`任务`, `quest`, or `mission`) produces the normal `add-entity`
  candidate for `quest` / `Quest`.

The mapping is evaluated only after a clear addition signal and uses the
current semantic world type; it does not match the exact example sentences.
The result remains an untrusted candidate. It is parsed, resolved, validated,
applied as a semantic delta, reconciled against the current rules, synchronized
into the existing Runtime world, and passed through the current visual path.
The structured Provider path remains preferred whenever it returns a valid
candidate. Unsupported or ambiguous requests continue to fail honestly.

The Runtime is not called by the fallback and no world replacement occurs.
Existing Runtime entity and gameplay-state objects remain authoritative and
are retained by the add-only synchronization path. New Runtime identities are
independent even when a canonical visual asset is reused.

## Resulting production flow

```text
Studio command
  → World Evolution route
  → structured candidate
      ├─ valid → existing validated delta path
      └─ provider error + bounded supported role
            → deterministic candidate → existing validated delta path
  → semantic delta
  → current-world GameplayRule reconciliation
  → Runtime synchronization
  → visual evolution / Observatory
```

## Alternatives rejected

- **Provider/TLS repair:** the root Turbo Keychain/TLS failure is a local
  environment limitation, not the Product capability gap at the first
  divergence.
- **A second Router or a full deterministic NLP parser:** routing was already
  correct, and the bounded role mapping does not justify a new interpretation
  framework.
- **GameplayRule inheritance/rebuilding:** this is downstream of semantic
  delta creation. Farm's evolved field proved reachable with the existing
  rule; RPG's newly measurable exact-archetype binding gap is recorded for a
  later Human/CTO decision and is not silently included here.
- **FarmRuntime, RPGRuntime, InventorySystem, ResourceSystem, QuestEngine,
  ObjectiveManager, DialogueEngine, rewards, economy, or progression/workflow
  frameworks:** none is required to close the first provider-error boundary.
- **Direct Web/Runtime insertion:** it would bypass semantic authority,
  validation, observability, and same-world revision guards.

## Consequences and non-goals

Provider-unavailable clear Farm and RPG additions now remain usable through the
same validated World Evolution contract. Farm's new field can be harvested.
RPG's new quest is semantic/Runtime-present and Enter-reachable, but the
current `rpg-interaction` rule is bound to the initial exact `Quest Giver`
archetype, so it does not yet commit `questAccepted=true` for the evolved
`Quest`. This is the fresh downstream Gap Analysis result, not an unreported
failure or an implementation expansion.

This decision does not add a third gameplay stage, inventory/resources,
rewards/economy, dialogue, a quest engine, a domain Runtime, a dynamic rule
registry, a capability inheritance framework, or a world rebuild. Provider
calls remain generation-time only; Runtime remains the gameplay authority.

## Verification

Automated tests passed:

- AI focused World Evolution tests: 16 passed; full AI suite: 156 files / 9,444
  tests passed.
- Web focused World Evolution integration: 30 passed; full Web suite: 52
  files / 3,590 tests passed.
- Shared: 211; Runtime: 716; Renderer: 517 tests passed.
- All affected package TypeScript checks passed. ESLint passed with 0 errors;
  existing repository warnings remain. Direct Web production build passed.

Real Studio passed the first-slice Product Verification through the normal
front door:

- Farm world-5: `做一个农场游戏` → `再加一块麦田` kept the world ID,
  added `wheat-field-1` as a visible Runtime `terrain`, preserved the existing
  committed state, and committed `activated=true, harvested=true` on the new
  field after normal Enter input.
- RPG world-6: `创建一个 RPG` → `再加一个任务` kept the world ID,
  preserved `quest-giver.questAccepted=true`, and added visible Runtime
  `quest-1` as `Quest`. Enter at distance 16 emitted the interaction request;
  existing RPG rules returned `conditions_failed`, which is recorded as the
  new downstream gap.
- Survival world-4: `生成一个幸存者游戏` → `再加五只怪` kept the world,
  added exactly five enemies, retained target-directed pursuit/contact damage,
  and retained canonical visual reuse.
- `增加一个商人` still added a Runtime merchant. `再加一只独角兽` left the
  world unchanged and failed honestly. Full Observatory event streams agreed
  with Runtime inspection. Browser diagnostics contained no feature warnings
  or errors.
