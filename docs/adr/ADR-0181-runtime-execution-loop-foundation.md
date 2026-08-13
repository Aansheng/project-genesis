# ADR-0181: Runtime Execution Loop Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-009  
**Architecture Version:** v1.67 → v1.68

---

## Context

WO-S8-008 introduced the Runtime System Foundation, providing the `RuntimeSystem` interface and `RuntimeSystemRegistry`. Currently systems can exist and be registered, but there is no mechanism to **execute** them.

The current Runtime structure is:

```
World
 ↓
Entity
 ↓
Component
 ↓
System (can exist, cannot run)
```

What remains missing is:

- **No execution loop** — systems cannot be iterated over a World
- **No tick concept** — there is no single "tick" of execution
- **No World propagation** — system output is not chained as input to the next system
- **No execution metadata** — there is no record of which systems ran or in what order

### Current Architecture

```
RuntimeSystemRegistry
  ↓
(systems registered but not executable)
```

### Problem

1. **No execution abstraction** — there is no contract for running systems against a World
2. **No world propagation** — system output is not automatically fed into subsequent systems
3. **No tick metadata** — there is no way to know which systems executed or their count
4. **No pipeline validation** — there is no way to test the end-to-end system pipeline

### Scope Boundaries

- Foundation only — no ECS scheduler, no prioritized execution, no conditional execution, no async
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS scheduler
- No gameplay systems
- No async execution

---

## Decision

### 1. Create `ExecutionTickResult` Interface

```typescript
export interface ExecutionTickResult {
  readonly world: World
  readonly executedSystems: readonly string[]
  readonly systemCount: number
}
```

Captures the output World along with metadata about which systems were executed during the tick.

### 2. Create `RuntimeExecutionLoop` Interface

```typescript
export interface RuntimeExecutionLoop {
  tick(world: World): World
  tickWithResult(world: World): ExecutionTickResult
}
```

Two entry points:
- `tick()` — pure `World → World` transformation (no metadata overhead)
- `tickWithResult()` — returns `ExecutionTickResult` with execution metadata

### 3. Create `DefaultRuntimeExecutionLoop` Implementation

Accepts a `RuntimeSystemRegistry` in the constructor and executes all registered systems in registration order:

```
world → system[0].update() → system[1].update() → ... → final World
```

Behaviors:
- **Empty registry**: `tick()` returns a frozen copy of the input World; `tickWithResult()` returns `systemCount: 0` with empty `executedSystems`
- **Single system**: passes World through the system and returns the result
- **Multiple systems**: chains system outputs through each registered system in order
- **No state mutation**: the execution loop itself is stateless between ticks

### 4. Location

| File | Purpose |
|------|---------|
| `packages/runtime/src/execution/ExecutionTickResult.ts` | New — interface |
| `packages/runtime/src/execution/RuntimeExecutionLoop.ts` | New — interface |
| `packages/runtime/src/execution/DefaultRuntimeExecutionLoop.ts` | New — implementation |
| `packages/runtime/src/execution/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added execution exports |
| `packages/runtime/src/__tests__/RuntimeExecutionLoop.test.ts` | New — tests |
| `docs/adr/ADR-0181-runtime-execution-loop-foundation.md` | New — this document |

### 5. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Empty Registry | 6 | tick unchanged, entity preservation, new reference, tickWithResult empty metadata, world unchanged, frozen executedSystems |
| Single System | 5 | NoOp, custom marker, tickWithResult metadata, system output, identity |
| Multiple Systems | 4 | Two systems, three systems, all names, systemCount |
| Execution Order | 4 | Marker chain order, reordered registration, tickWithResult order, overwrite |
| World Propagation | 4 | Two-system chain, three-system chain, identity + marker, five-system chain |
| Immutability | 5 | Frozen tick world, frozen tickWithResult, no input mutation, frozen tickWithResult world, frozen executedSystems |
| Determinism | 5 | Same tick output, same tickWithResult output, across loop instances, empty registry, NoOp systems |
| Large Collections | 4 | 100 identity, 1000 identity, 1000 tickWithResult, 100 markers |
| NoOp Systems | 4 | Single, multiple, ten, tickWithResult metadata |
| Mixed Systems | 5 | NoOp → marker, marker → NoOp, alternating, identity + markers, mixed metadata |
| Result Metadata | 8 | System names in order, accurate count, zero count, single count, final world, worlds match input for empty, empty executedSystems, type fields |

---

## Consequences

### Positive

1. **First execution abstraction** — `RuntimeExecutionLoop` provides the contract for running systems
2. **World propagation** — system outputs are automatically chained through the pipeline
3. **Tick metadata** — `tickWithResult()` provides executed system names and count
4. **Two entry points** — lightweight `tick()` for production, informative `tickWithResult()` for testing and observability
5. **Deterministic and pure** — same systems + same world always produces same output
6. **No breaking changes** — all existing types and code are unchanged

### Negative

1. **No scheduling** — all systems execute every tick in a fixed order (future work could add system-level scheduling)
2. **No conditional execution** — there is no mechanism to skip systems based on World state (future work)
3. **No async** — execution is synchronous only (future work could add async tick support)

### Neutral

1. **Foundation only** — no ECS scheduler, no prioritized execution, no async
2. **Registration-order execution** — simple, predictable, and testable

---

## Verification

- TypeScript: 0 errors (`packages/runtime`, `packages/shared`)
- ESLint: 0 errors
- All RuntimeExecutionLoop tests pass
- All existing tests continue to pass
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No Projection changes
- No ECS scheduler
- No gameplay systems
- No async execution
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/runtime/src/execution/ExecutionTickResult.ts` | New — interface |
| `packages/runtime/src/execution/RuntimeExecutionLoop.ts` | New — interface |
| `packages/runtime/src/execution/DefaultRuntimeExecutionLoop.ts` | New — implementation |
| `packages/runtime/src/execution/index.ts` | New — barrel exports |
| `packages/runtime/src/index.ts` | Modified — added execution exports |
| `packages/runtime/src/__tests__/RuntimeExecutionLoop.test.ts` | New — 54 tests across 11 sections |
| `docs/adr/ADR-0181-runtime-execution-loop-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.68, WO-S8-009 |
| `docs/project/CHANGELOG.md` | Updated — v1.68, WO-S8-009 |