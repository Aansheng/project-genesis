# ADR-0180: Runtime System Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-008  
**Architecture Version:** v1.66 → v1.67

---

## Context

WO-S8-004 introduced the Runtime Component Model, enabling Runtime entities to own projected components. The current Runtime structure is:

```
World
 ↓
Entity
 ↓
Component
```

What remains missing is any **runtime behavior**. Currently:

- No systems exist
- No update loop exists
- No mechanism to transform the Runtime World
- The Runtime is purely structural (projection + query + action handling)

### Current Architecture

```
GameDsl
  ↓
RuntimeProjection
  ↓
World (structural only)
  ↓
(nothing — no systems, no behavior)
```

### Problem

1. **No behavior abstraction** — there is no contract for runtime transformations on the World
2. **No registry mechanism** — there is no way to collect, organize, or manage systems
3. **No testable pipeline** — there is no way to validate a system pipeline without building ECS
4. **No baseline system** — there is no identity system to validate the system contract

### Scope Boundaries

- Foundation only — no ECS framework, no scheduler, no update loop, no gameplay systems
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS implementation
- No gameplay systems
- No update loop

---

## Decision

### 1. Create `RuntimeSystem` Interface

```typescript
export interface RuntimeSystem {
  readonly name: string
  update(world: World): World
}
```

A pure, deterministic transformation over a `World`. Each system:
- Has a unique `name` for identification
- Receives an immutable `World` as input
- Produces a new `World` as output (no mutation)

### 2. Create `RuntimeSystemRegistry` Interface

A read-only contract for registering, retrieving, and clearing `RuntimeSystem` instances.

```typescript
export interface RuntimeSystemRegistry {
  register(system: RuntimeSystem): void
  getSystems(): readonly RuntimeSystem[]
  clear(): void
}
```

### 3. Create `DefaultRuntimeSystemRegistry` Implementation

Default implementation using a `Map<string, RuntimeSystem>`:
- `register()` — stores system by name (overwrites duplicates)
- `getSystems()` — returns frozen array of all registered systems
- `clear()` — removes all systems

### 4. Create `NoOpRuntimeSystem`

An identity transformation that returns the world unchanged:
- Validates the runtime system pipeline
- Provides a baseline system for testing
- Demonstrates the `RuntimeSystem` contract

### 5. Location

| File | Purpose |
|------|---------|
| `packages/runtime/src/system/RuntimeSystem.ts` | New — interface |
| `packages/runtime/src/system/RuntimeSystemRegistry.ts` | New — interface |
| `packages/runtime/src/system/DefaultRuntimeSystemRegistry.ts` | New — implementation |
| `packages/runtime/src/system/NoOpRuntimeSystem.ts` | New — identity system |
| `packages/runtime/src/system/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added system exports |
| `packages/runtime/src/__tests__/RuntimeSystem.test.ts` | New — tests |
| `docs/adr/ADR-0180-runtime-system-foundation.md` | New — this document |

### 6. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 8 | Interface, implementation, custom names, special characters, empty name, multiple systems, callable update |
| Registration | 6 | Single, multiple, custom, overwrite, NoOp, sequential |
| Retrieval | 5 | Empty, populated, after clear, invocable, correct behavior |
| Multiple Systems | 4 | Many systems, duplicate overwrite, registration order, name uniqueness |
| Clear | 5 | Empty, populated, many systems, repopulate, usability |
| Immutability | 6 | Frozen array, new array snapshot, snapshot isolation, frozen NoOp output, no input mutation, frozen custom output |
| Determinism | 5 | Same instance, cross instance, custom system, registry, empty registry |
| NoOp Behavior | 7 | Empty world, populated world, entity preservation, single entity, large world, new reference, pipeline |
| Large Collections | 4 | 100 systems, 1000 systems, clear 1000, invoke 1000 |
| Contract Validation | 6 | Readonly name, function type, World contract, empty name, default name, stateless |

---

## Consequences

### Positive

1. **First behavior abstraction** — `RuntimeSystem` provides the contract for runtime transformations
2. **Registry mechanism** — `RuntimeSystemRegistry` provides system management without ECS
3. **Testable foundation** — `NoOpRuntimeSystem` validates the pipeline without gameplay logic
4. **Deterministic and pure** — all systems are pure transformations with immutable outputs
5. **No breaking changes** — all existing types and code are unchanged

### Negative

1. **No scheduling** — systems cannot be ordered or prioritized yet (future work)
2. **No composition** — systems run independently without coordination (future work could add system composition)
3. **No update loop** — there is no mechanism to run systems repeatedly (future work)

### Neutral

1. **Foundation only** — no ECS framework, no scheduler, no update loop
2. **Explicit contract** — `World → World` transformation pattern keeps systems simple and testable

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/shared`)
- ESLint: 0 errors
- All RuntimeSystem tests pass
- All existing tests continue to pass
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS changes
- No gameplay systems
- No update loop
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/system/RuntimeSystem.ts` | New — interface |
| `packages/runtime/src/system/RuntimeSystemRegistry.ts` | New — interface |
| `packages/runtime/src/system/DefaultRuntimeSystemRegistry.ts` | New — implementation |
| `packages/runtime/src/system/NoOpRuntimeSystem.ts` | New — identity system |
| `packages/runtime/src/system/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added system exports |
| `packages/runtime/src/__tests__/RuntimeSystem.test.ts` | New — 56 tests across 10 sections |
| `docs/adr/ADR-0180-runtime-system-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.67, WO-S8-008 |
| `docs/project/CHANGELOG.md` | Updated — v1.67, WO-S8-008 |