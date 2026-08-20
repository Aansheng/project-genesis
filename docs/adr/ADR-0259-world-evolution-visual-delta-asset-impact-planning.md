# ADR-0259 — World Evolution Visual Delta & Asset Impact Planning

- Status: Accepted
- Date: 2026-08-20
- Work Order: WO-S14-004
- Architecture: v1.144 → v1.145

## Context

WO-S14-003 makes semantic evolution visible in the live Runtime while leaving
visual resources unchanged. The next boundary is not a whole-world visual
rebuild: a semantic edit must identify the smallest visual consequences,
preserve shared canonical assets, and defer provider/scheduler execution to a
later work order.

The current source of truth is split deliberately. The semantic world and
world properties live in the web session. `DefaultVisualDesignSpecificationBuilder`
and `DefaultAssetSpecificationBuilder` compile the current visual intent.
`AssetGenerationPolicy` owns generation eligibility, stable visual-generation
identity, and canonical requirement grouping. `AssetManifest` and
`AssetStore` contain resolved resource state and must not be used as planning
state or mutated by this work order.

## Decision

Add the provider-independent deterministic `DefaultVisualEvolutionPlanner` at
the web asset-policy boundary. It consumes:

1. the before semantic world;
2. the after semantic world;
3. the immutable `SemanticWorldMutationResult`;
4. the immutable `RuntimeEvolutionResult`; and
5. the current VisualDesignSpecification and AssetSpecification.

It returns an immutable `VisualEvolutionPlan` with an `AssetImpactPlan`.
The plan explicitly records operation/world/revision identity, affected entity
IDs, old/new visual archetypes, added/removed/replaced requirements,
binding-only changes, world-level visual impact, unaffected assets/archetypes,
orphaned asset IDs, and the exact canonical generation-required set.

The planner reuses `visualGenerationIdentity` and
`groupAiGenerationRequirements`. Entity IDs are bindings, not visual truth;
current semantic names and the current visual context determine archetype
identity. Therefore Cow ×3 → Sheep produces one Sheep canonical requirement
with three bindings. A partial shared-group removal is a `REBIND` with no
generation. A one-Cow → Bull replacement preserves the remaining Cow group
and adds only Bull. A removed Boss becomes orphaned only when no binding
remains. New Merchant/NPC archetypes follow the existing eligibility policy.

Asset impact actions are limited to `UNCHANGED`, `ADD`, `REPLACE`, `REMOVE`,
`REBIND`, and `REGENERATE`. `generationRequired` contains canonical
requirements, never one job per entity binding.

World-level dependencies are typed against the current model:

- `theme` changes recompute shared theme/palette/environment context and are
  broad eligible impact;
- `timeOfDay` changes update only the background context because the current
  VisualDesignSpecification has no separate time-of-day field for terrain or
  characters.

The current visual and asset specifications are stored beside the semantic and
Runtime session markers. A successful plan commits new immutable
VisualDesignSpecification/AssetSpecification values and increments the visual
revision. Stale world/session, semantic, Runtime, and visual revision markers
fail safely; repeated planning of the same operation is idempotent. Planning
failure leaves the previous specification references intact.

## Lifecycle and observability

The evolution operation adds:

- `VISUAL_IMPACT_STARTED` / `world.evolution.visual_impact_started`;
- `VISUAL_DELTA_PLANNED` / `world.evolution.visual_delta_planned`; and
- `VISUAL_DELTA_FAILED` / `world.evolution.visual_delta_failed`.

History reports semantic application, Runtime synchronization/no-impact, and
visual delta planned/failed with `Asset execution pending` or `no asset
generation required`. Diff layers semantic changes, Runtime affected IDs,
visual archetype changes, binding-only changes, orphaned assets, and pending
canonical execution. Timeline, Trace, and Event Stream retain operation/world
correlation and visual revision facts.

## Non-goals and constraints

This ADR does not call image generation, enqueue the visual scheduler, mutate
`AssetManifest`, invalidate `AssetStore`, replace Pixi textures, rebind renderer
resources, regenerate a complete visual world, add a batch prompt planner, or
change provider/scheduler contracts. Runtime, player identity/state, camera,
execution loop, and existing create-world generation remain unchanged.

Canonical visual delta execution and resource application are deferred to
WO-S14-005.

## Consequences

- Visual impact is deterministic, inspectable, and independent of image
  providers.
- Shared archetypes do not multiply work, and unaffected canonical resources
  remain explicit and reusable.
- Observatory accurately distinguishes visual planning from visual execution.
- A later execution work order can consume the canonical set without inferring
  impact again or rebuilding the semantic/Runtime world.
