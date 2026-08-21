# ADR-0263 — Gameplay Event Model & Runtime Event Observation Foundation

- Status: Accepted
- Date: 2026-08-21
- Architecture: v1.148 → v1.149
- Work order: WO-S15-002

## Context

Project Genesis now has a provider-neutral `GameplaySpecification`, but the
production Runtime still needs a truthful way to expose the small set of facts
that its existing systems can observe. Jump acceptance, landing transitions,
entity-set mutations, and explicit spatial contact are useful inputs for a
future rule boundary; collection, damage, death, completion, and rewards are
not currently produced by the Runtime.

The observation path must not turn facts into gameplay results, depend on a
renderer or provider, or make every Runtime system aware of a global event bus.
It also must remain bounded because the Observatory is a current-session
diagnostic surface, not a durable event store.

## Decision

Introduce a small immutable shared `GameplayEvent` contract and a Runtime
observation pipeline.

- The v1 vocabulary is `ENTITY_JUMPED`, `ENTITY_LANDED`,
  `ENTITY_CONTACT_STARTED`, `ENTITY_ADDED`, and `ENTITY_REMOVED`.
- Events carry primitive payloads plus deterministic `eventId`, optional
  `worldId`, `tick`, and per-tick `sequence` metadata. The collector deep
  freezes emitted events and caps one tick batch at 100 facts.
- `DefaultRuntimeExecutionLoop` owns tick ordering and attaches one injected
  `GameplayEventSink` to systems that opt in. Systems remain transformations
  over immutable Worlds; the sink is an observation boundary, not a command
  channel.
- `DefaultJumpSystem` emits `ENTITY_JUMPED` only when a grounded jump is
  accepted. `DefaultGroundCollisionSystem` emits `ENTITY_LANDED` only on an
  airborne → grounded transition and resets its bounded state for a new world
  session.
- `DefaultRuntimeWorldStore` observes committed entity ID-set differences and
  emits add/remove facts. It does not publish every world replacement as a
  synthetic gameplay event.
- `DefaultEntityContactSystem` uses explicit Runtime-owned `collision-bounds`
  AABBs and emits de-duplicated `ENTITY_CONTACT_STARTED` facts. It never
  collects, damages, removes, or otherwise mutates entities. Goal/checkpoint
  entities use the same truthful contact fact when they have explicit bounds;
  no dedicated goal-result event is invented.
- The Renderer forwards the per-tick facts to an optional
  `GameplayEventObserver`. The web Observatory projects safe event metadata
  into a 100-entry current-session Event Stream. World Evolution domain events
  remain a separate source and projection path.

The flow is:

`Runtime system facts → collector → ExecutionTickResult → renderer observer → Observatory projection`

No persistence, replay, event sourcing, generic bus, gameplay rule evaluator,
generated code, or Trigger/Condition/Action execution is introduced.

## Boundaries and consequences

The shared event contract is provider- and renderer-independent. Runtime can
report what happened without deciding what it means. The collector's tick and
sequence metadata make ordering and debugging deterministic, while the UI
bound prevents an unbounded stream from becoming application state.

Contact geometry is intentionally narrow. The existing runtime/renderer scale
contract remains authoritative for visuals; `collision-bounds` is a separate,
small Runtime fact component and does not inspect textures or Pixi objects.
Directional collision, terrain geometry, sensors, timers, damage, and richer
physics remain future capabilities.

The next work order may interpret one event-driven scenario, but must keep
facts, rule interpretation, and mutation/result execution as separate
boundaries. Gameplay event history and durable replay remain deferred.

## Verification

- Runtime tests cover accepted/held/rejected jump, landing transition and
  re-landing, contact-start de-duplication and re-entry, add/remove mutation,
  deterministic ordering/IDs, immutability, and the batch bound.
- Web integration tests cover safe Observatory projection and the 100-entry
  Event Stream bound.
- Product verification covers jump, landing, contact, mutation, world
  evolution continuity, and browser console cleanliness.
