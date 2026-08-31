# ADR-0290 — Generic Rule-Driven Runtime Entity Creation

- Status: Accepted; Code Complete; Product Verification pending manual
- Date: 2026-08-28
- Architecture: v1.179 → v1.180
- Work Order: WO-S30-001

## Context

Sprint 30 asked whether a generated Survival session can continue after an
Enemy defeat without rebuilding the Semantic World or adding a commercial wave
engine. The source audit found that `SPAWN_ENTITY` was already a typed shared
and AI-validated action, `ENTITY_REMOVED` was an authoritative Runtime fact,
and `WorldMutator.addEntity()` could commit an immutable addition. The missing
capability was trusted Gameplay Rule execution plus reuse of the existing
Enemy composition and visual binding for a Runtime-only entity. Runtime ticks
exist, but timer and entity-count rule semantics do not; neither is required
for one bounded replacement cycle.

Existing combat removal changes only the active Runtime World while the
persistent Semantic World remains the design authority. That repository fact
supports ephemeral gameplay entities and forbids routing each live spawn
through AI World Evolution.

## Decision

Promote only the generic `SPAWN_ENTITY` action and the bounded Survival
`enemy-spawn` mechanic. On a committed `ENTITY_REMOVED` event whose payload
reports `health <= 0` and whose target is an Enemy, the deterministic Survival
RuleSet executes one `SPAWN_ENTITY` action. The trusted executor:

1. resolves an existing semantic Enemy template;
2. chooses a deterministic unique Runtime identity and safe free position;
3. composes semantic identity, Position, Survival Health, collision bounds,
   and target-directed movement through the shared composition helper; and
4. commits the entity with immutable `WorldMutator.addEntity()` in the current
   active World.

The Runtime event collector carries the committed action's zero Health fact so
semantic World Evolution removals (which retain their prior Health) do not
trigger gameplay replenishment. Web observes the committed add and copies the
resolved canonical Enemy manifest entry into a Runtime-binding entry. This is
an asset binding only: no provider/image-generation request is made and the
Runtime entity identity remains distinct from visual asset identity.

## Boundaries and consequences

- Runtime remains live execution authority; AI is generation-time only.
- The replacement remains ephemeral to Runtime and does not mutate Semantic
  World or invoke a provider.
- The primitive is generic and category/template based; Survival composition
  selects it. Platformer has no spawn rule and is unchanged.
- The bounded cycle is one defeat → one replacement. Timer, entity-count,
  periodic wave, difficulty, encounter, scheduler, manager, factory, prefab,
  procedural placement, boss, loot, and new visual generation are deferred.
- The replacement has the existing pressure/offense-compatible category rules,
  so it can pursue, damage Player, take damage, and be defeated.

## Verification

Automated production reachability traverses generated Survival composition,
four contact defeats, the committed zero-Health removal fact, trusted
`SPAWN_ENTITY`, `WorldMutator.addEntity()`, replacement composition, contact
pressure, and active-session continuity. Runtime visual-binding tests prove
resolved canonical reuse without duplicate generation. Full Shared (211), AI
(9430), Runtime (705), Renderer (499), and Web (3565) suites pass; all package
TypeScript checks, package ESLint (zero errors), Web build, and diff hygiene
pass. Root Turbo lint is blocked by the host's missing TLS keychain, while
package lint commands exit 0 with pre-existing warnings only.

Real provider-backed Studio verification is still required. The in-app browser
session was reaped after a model switch and fresh local navigation was denied
by security review, so Product Verified remains PENDING MANUAL and the Sprint
30 Freeze Review is not selected.
