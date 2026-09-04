# ADR-0300 — Generic Post-Interaction Gameplay Loop Continuity

- **Status:** Accepted / implemented / Product Verified
- **Date:** 2026-09-03
- **Architecture:** v1.189 → v1.190
- **Work order:** `WO-S40-001`

## Context

Sprint 40 discovery showed that Farm and RPG could reach a meaningful first
interaction consequence, but gameplay stopped immediately afterward:

```text
Farm: CreateWorld → Harvest → harvested=true → stop
RPG:  CreateWorld → Accept Quest → questAccepted=true → stop
```

The repository already had the required generic seams: finite-range Player
interaction events, immutable `gameplay-state` entity properties,
`GameplayRule` conditions/actions, current Runtime World lookup, and
Observatory/Renderer observation. The missing capability was a consumer of the
committed first property that gates one later Player action. No new workflow
engine or domain-specific Runtime was justified.

## Decision

Enable the existing `BOOLEAN_EQUALS` condition for typed boolean values read
from the current Runtime World entity property. A missing boolean property is
treated as `false` for the bounded gameplay-state gate; unsupported reference
shapes remain unavailable rather than being inferred. The existing trusted
`SET_ENTITY_PROPERTY` action remains the only mutation path.

Compose exactly one later interaction Rule for each supported archetype:

- Farm: `wheat-field.harvested=true` gates a later interaction with
  `harvest-quest`, which commits `questCompleted=true`.
- RPG: `quest-giver.questAccepted=true` gates a later interaction with
  `main-quest`, which commits `questCompleted=true`.

The production flow is therefore:

```text
CreateWorld
  → semantic entities → Game DSL → Runtime World
  → Player interaction A → event → Rule A → committed state A
  → later Player interaction B → event → Rule B reads state A
  → committed state B → Game/Observatory projection
```

The two moments are separate input edges. Rule B never executes merely because
Rule A committed; it requires a later interaction event and the current World
state. Repeating either step is idempotent: the first step's property writes
and the second step's completion write become truthful `no_op` results when the
same value is already present. Runtime remains authoritative, and the Runtime
loop has no Farm/RPG branch; archetype meaning is composed in the AI gameplay
Rule builder.

## Alternatives rejected

- `InventorySystem`, `ResourceSystem`, `QuestEngine`, `ObjectiveManager`,
  `DialogueEngine`, `FarmRuntime`, `RPGRuntime`, and a multi-stage progression
  framework: these would exceed the first bounded generic capability.
- Automatically chaining two or more actions from one interaction: that would
  fail the requirement for two distinct gameplay moments and would hide the
  missing Player choice.
- A Renderer-only “next action” prompt: it would not create a Runtime-gated
  consequence and would make Observatory state untruthful.
- Adding numeric XP/Level, goal completion, entity removal, or spawning to this
  slice: the existing property state is sufficient, and these primitives are
  intentionally preserved for later evidence-driven work.
- Forcing Provider candidates into a fixed entity count or repairing Provider
  composition: valid Provider candidates remain authoritative at generation
  time; the deterministic Farm/RPG baseline proves the bounded composition.

## Consequences and non-goals

Farm and RPG now demonstrate a bounded two-step gameplay loop using the same
generic event → condition → action → World boundary. The second state is
Player-readable through the existing committed feedback projection and is
visible in the Observatory Runtime inspector. The implementation does not
claim open-ended quest progression, inventory/resources, economy, rewards,
dialogue, combat, XP/Level advancement, or a universal workflow system.

Provider-authored rule candidates that omit the continuation remain a known
generation-time composition gap; the provider is not called at Runtime.
Farm/RPG spatial/control composition remains a secondary UX observation.

## Verification

Focused and full Shared, AI, Runtime, Renderer, and Web suites passed. Package
TypeScript checks and ESLint passed with no errors; the Web production build
passed. Root Turbo orchestration was unavailable in this environment because
its local API client could not initialize TLS without a Keychain, so equivalent
package-level gates and the direct affected Web build were run successfully.

Real Genesis Studio verification passed through the natural-language front
door. Farm recorded `player → wheat-field` with committed `harvested=true`,
then `player → harvest-quest` with committed `questCompleted=true`; the second
interaction repeated as `SET_ENTITY_PROPERTY:no_op`. RPG recorded a
precondition-failed `player → main-quest`, then committed
`questAccepted=true` on `quest-giver`, then committed `questCompleted=true` on
`main-quest`; repeated completion was `no_op`. Studio Runtime inspectors agreed
with the Observatory event/rule stream, and browser logs contained no warn or
error entries.
