# Sprint 15 Backlog — Capability-Specific Generation Context

Sprint 15 begins by making generation context capability-specific while keeping
the Sprint 14 semantic world and Runtime paths authoritative. The product
pipeline remains:

`Natural Language → Intent → Semantic World → capability context → Game DSL → Runtime → Renderer → playable game`

## Architectural boundary

`current authoritative state → context builder → immutable minimum context → prompt/provider`

No global memory/history/RAG/vector store, generic context manager, second
orchestration layer, or context store is introduced. Stable entity IDs remain
bindings and current semantic names remain the source of visual archetype truth.

## Completed

### WO-S15-002 — Gameplay Event Model & Runtime Event Observation Foundation

- Audited the existing Runtime event sources: execution order and movement
  are real, accepted jump and ground transitions are derivable, WorldStore
  commit deltas are real, and entity contact required explicit Runtime-owned
  collision bounds. No timer, damage, death, completion, or gameplay result
  source existed and none was invented.
- Added immutable shared `GameplayEvent` contracts and a small fact vocabulary:
  `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_CONTACT_STARTED`,
  `ENTITY_ADDED`, and `ENTITY_REMOVED`.
- Added the Runtime collector and `ExecutionTickResult.gameplayEvents` with
  deterministic tick/sequence ordering, bounded ephemeral batches, mutation
  observation, contact-start de-duplication, and world/session reset behavior.
- Added Runtime-owned `collision-bounds` components and a narrow AABB contact
  observer. It emits facts only; it never removes, damages, collects, or
  mutates entities.
- Added Renderer observer forwarding and a real 100-entry Observatory
  Gameplay Event Stream projection. World Evolution events remain separate
  domain events and remain bounded with the same UI projection.
- Added ADR-0263, capability truth updates, regression tests, and browser
  verification for jump, landing, contact, mutation, world evolution, visual
  continuity, and console cleanliness.
- Architecture version: v1.148 → v1.149.
- Code Complete: YES.
- Product Verified: YES.

### WO-S15-001 — GameplaySpecification & Game Loop Domain Foundation

- Audited the existing playable slice: production Runtime supports movement,
  jump, gravity, vertical motion, ground collision, and basic entity mutation;
  semantic world data models genre entities but does not execute gameplay
  rules; Studio still hardcodes the platformer systems; collection, combat,
  enemy AI, goals, failure, timers, spawns, progression, and win/lose are not
  production Runtime capabilities.
- Added immutable gameplay domain contracts, categories, player mechanic IDs,
  interaction/goal/failure/progression/spawn sections, and a versioned truthful
  capability catalog. Supported status is catalog-derived, never provider-
  supplied.
- Reused the existing structured generation client and gateway with a minimal
  gameplay context. The candidate → validator → specification boundary rejects
  malformed references and corrects unsupported claims. Deterministic defaults
  cover platformer, survival, farm, and sandbox without cross-genre leakage.
- Integrated create-world, web session ownership, world replacement, fallback
  diagnostics, and small real Observatory summaries. No Runtime gameplay
  executor, trigger/condition/action engine, generated code/eval, manager,
  provider registry, or new orchestration layer was introduced.
- Added ADR-0262, `GAMEPLAY_CAPABILITY_MATRIX.md`, integration/security/failure
  tests, and browser verification for platformer, survival, farm, isolation,
  Observatory truth, and empty console warnings/errors.
- Architecture version: v1.147 → v1.148.
- Code Complete: YES.
- Product Verified: YES.

### WO-S15-000 — Capability-Specific Generation Context Foundation

- Added shared immutable contracts and builders for world evolution, image
  generation, and game design; added a typed gameplay extension point without a
  gameplay specification.
- Connected world evolution prompt assembly to current semantic snapshots and
  preserved existing stale guards and operation correlation.
- Connected image generation at initial creation and visual evolution. Image
  requests now include current semantic/visual facts, target asset facts,
  canonical bindings, revision metadata, and bounded metadata-only neighbors.
- Added deterministic prompt sections and safe Observatory context metadata;
  no provider secrets, raw payloads, URIs, image bytes, or hidden reasoning are
  surfaced.
- Added authority, minimization, immutability, revision, provider-neutrality,
  prompt, ID-truth, world-isolation, and security regression coverage.
- Architecture version: v1.146 → v1.147.
- Code Complete: YES.
- Product Verified: YES — local Studio browser session created `world-1` with three cows, evolved all cows to Sheep, inspected Generation Trace context (`Sheep`, `cow-1..3`, revisions `1/1/1`), followed up with Merchant at `2/2/2`, created `world-2`, and confirmed current-world isolation with no browser warnings/errors. The existing deterministic fallback handled an invalid local structured candidate during creation.

## Deferred by design

- Runtime gameplay execution: collect, damage, enemy AI, goals, failure,
  timers, spawn execution, XP/levels/upgrades, and win/lose rules.
- Durable gameplay revision/history and gameplay evolution.
- Conversation memory/history, RAG, vector retrieval, and global context
  stores.
- Reference-image transport and similarity search; current references are
  metadata-only bounded hints.
- Context caching, durable generated-asset persistence, and reload recovery.
- Provider-specific prompt contracts and capability-specific orchestration.

## Next work order boundary

### S15-003 — Event-Driven Gameplay Rule Boundary

Choose one concrete event-driven gameplay scenario and add only the smallest
Trigger/Condition/Action-compatible interpretation. Keep facts, rule
interpretation, and mutation/result execution as separate boundaries.
