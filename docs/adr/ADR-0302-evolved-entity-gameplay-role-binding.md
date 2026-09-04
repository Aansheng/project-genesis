# ADR-0302 — Evolved-Entity Gameplay Role Binding

- **Status:** Accepted / implemented / Product Verified / Sprint 42 frozen
- **Date:** 2026-09-04
- **Architecture:** v1.191 → v1.192
- **Work order:** `WO-S42-001`

## Context

Sprint 42 Discovery found that World Evolution could add an RPG `Quest` to the
same world, create its Runtime entity, render it, and reach it with normal
Enter input, but the existing `rpg-interaction` Rule rejected it because the
Rule required the exact semantic archetype `Quest Giver`. The Rule was not
bound to a concrete Runtime ID, yet its exact-name condition made it
entity-specific in effect. Farm's evolved `Wheat Field` and Survival's evolved
Enemies were already gameplay-capable, so the first remaining break was the
semantic capability-binding boundary rather than a missing event, action,
Runtime mutation, or input path.

The product must distinguish at least these RPG meanings:

- Quest Giver — may accept the current quest;
- Main Quest or another quest objective — may receive the completion
  consequence after the acceptance prerequisite;
- Merchant, NPC, and Enemy — must not receive either quest consequence.

Provider-authored free-form `role` metadata is candidate input, not gameplay
authority. A category-wide RPG rule, a per-ID rule copy, or a complete
RuleSet/world rebuild would either fabricate meaning or exceed the measured
gap.

## Decision

Add the smallest typed contract at the existing semantic composition boundary:

```text
GameplayEntityRole = quest-acceptor | quest-objective
```

Genesis derives the role deterministically from trusted semantic composition:
for an RPG `quest`, the semantic name `Quest Giver`/`quest-giver` resolves to
`quest-acceptor`; another RPG quest resolves to `quest-objective`. Non-RPG
entities and non-quest RPG entities have no gameplay role. Concrete entity IDs
are not consulted, and the resolver does not read a provider-supplied
free-form role.

Add the generic condition:

```text
ENTITY_GAMEPLAY_ROLE_EQUALS(entity, role)
```

The existing RPG Rules then remain bounded and distinct:

- `rpg-interaction` remains bound to the exact `Quest Giver` archetype and
  commits `activated=true, questAccepted=true`. The entity also carries
  `quest-acceptor`, but this rule does not consume that role in v1.192.
- `rpg-complete-main-quest` requires `eventTarget` role `quest-objective` plus
  the existing authoritative `questAccepted=true` prerequisite and commits
  `questCompleted=true`.

The semantic DSL builder and Runtime composition project the same role fact
for CreateWorld and World Evolution. The evolution synchronizer updates or
removes the projected role with the semantic entity. The existing validator
accepts only the bounded role values and verifies that the role exists in the
current semantic world. The authoritative Runtime evaluator resolves the
role from the semantic world first, with only a validated component fallback.
The targeted reconciler includes role conditions in its dependency
fingerprint, so a semantic revision can revalidate the existing Rules without
duplicating them or rebuilding the whole world.

## Resulting flow

```text
CreateWorld / World Evolution
  → trusted semantic entity composition
  → deterministic GameplayEntityRole projection
  → existing GameplayRule validation/reconciliation
  → Runtime semantic facts and role condition evaluation
  → trusted SET_ENTITY_PROPERTY
  → authoritative state / Game and Observatory projection
```

This is a typed role projection, not a new ontology, inheritance system,
registry, workflow engine, or genre Runtime. Existing world identity,
Runtime identity, entity state, Rule IDs, and the Survival control remain
unchanged.

## Alternatives rejected

- **Relax Quest Giver to category `quest`:** unsafe; it would erase the
  Quest Giver/Main Quest distinction and could accept from the wrong entity.
- **Reuse the current `role` selector:** it is only a category alias and does
  not express the required RPG semantic distinction.
- **Copy a Rule for each evolved Runtime ID:** machine-ID-specific, non-generic,
  and contrary to World Evolution continuity.
- **Rebuild the complete RuleSet/world or add a dynamic registry:** larger than
  the measured missing fact; targeted reconciliation already handles the
  affected known Rules.
- **Rename every evolved Quest to Quest Giver:** fabricates semantics and
  changes the meaning of the natural-language mutation.
- **Add QuestEngine, RPGRuntime, FarmRuntime, inventory/resources/rewards/
  economy/dialogue, or a progression/workflow framework:** none is required
  for the first condition-level break.

## Verification

Real Studio, using the deterministic fallback while the local Provider
environment remained unavailable, verified:

1. `创建一个 RPG` produced world-1; Quest Giver Enter committed
   `questAccepted=true`.
2. `再加一个任务` remained World Evolution in world-1, retained the prior
   acceptance state, and added visible `quest-1` with
   `gameplayRole=quest-objective`.
3. Normal movement plus Enter reached `quest-1` and committed
   `questCompleted=true`; a repeated Enter was a truthful no-op. The original
   Quest Giver still showed `questAccepted=true` after the evolved completion.

Automated coverage verifies the Farm evolved-field harvest, RPG
pre-acceptance and role-negative cases, exact Quest Giver/Main Quest
semantics, same-world/state preservation, and Survival +5 behavior. Shared,
AI, Runtime, and Web full package suites pass; affected Renderer tests pass;
all five TypeScript checks, all five ESLint checks, and the direct Web
production build pass. The full Renderer suite passes at 27 files / 517 tests.
Browser error/warning diagnostics were empty after the real Studio run.
