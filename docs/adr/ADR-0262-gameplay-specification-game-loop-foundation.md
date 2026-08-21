# ADR-0262 — GameplaySpecification & Game Loop Domain Foundation

- Status: Accepted
- Date: 2026-08-21
- Architecture: v1.147 → v1.148
- Work order: WO-S15-001

## Context

Project Genesis already creates a playable Runtime world. The production Studio
slice executes player movement, jump, gravity, vertical motion, ground
collision, and basic entity mutation. The semantic world can describe genre
entities such as enemies, goals, resources, and checkpoints, but there is no
provider-neutral gameplay authority and no general gameplay rule executor.

The next useful boundary is therefore a compact description of how a world
should play, while making the Runtime capability gap explicit. Treating every
provider suggestion as executable would make Observatory and the product
claim behavior that does not exist.

## Decision

Add an immutable shared `GameplaySpecification` with:

- `GameLoopSpecification` for objective, repeatable actions, challenges,
  rewards, progression modes, completion, success, and failure;
- mechanic definitions with stable IDs and categories for movement,
  interaction, combat, collection, spawn, progression, goal, failure, and
  state change;
- player mechanic IDs plus optional interactions, goals, failure conditions,
  progression, and spawn rules;
- explicit `supported`, `deferred`, and `unsupported` status;
- a versioned capability catalog derived from real Runtime wiring.

Gameplay generation receives a minimal immutable context containing the current
semantic entity IDs/names/categories, world type, current gameplay revision,
capability catalog, and instruction. The existing structured-generation client
and gateway are reused. The flow is:

`candidate → validator → immutable GameplaySpecification`

Validation normalizes stable IDs, rejects malformed or nonexistent semantic
references, and corrects any provider claim of `supported` when the catalog
does not contain the mechanic. Deterministic platformer, survival, farm, and
sandbox defaults provide a non-blocking fallback. Create-world stores the
specification beside the current semantic/Runtime authorities and replaces it
on world replacement.

## Boundaries

- Runtime and Renderer are not changed by this work order.
- No gameplay manager, spawner, trigger/condition/action engine, generated
  code, code evaluation, new provider registry, or global context store is
  introduced.
- Observatory exposes only a small real summary: source, validation status,
  revision, mechanic counts, support counts, and primary goal. It does not
  synthesize execution timelines or systems for deferred mechanics.
- Gameplay generation failure is diagnostic data and falls back to deterministic
  intent; it cannot block playable world creation.
- `gameplayRevision` and the current specification are session-scoped. Durable
  history and gameplay evolution remain deferred.

## Consequences

The AI and shared layers can now express coherent genre-specific loops without
cross-genre contamination and without leaking Runtime/provider details into
prompts. Users receive an honest gameplay summary immediately after creation.
The current playable behavior remains exactly the existing movement slice.

The next work order must be driven by a measured product bottleneck and extend
only the smallest Runtime capability needed to execute one deferred mechanic.
The capability matrix in `docs/project/GAMEPLAY_CAPABILITY_MATRIX.md` remains
the source for that decision.
