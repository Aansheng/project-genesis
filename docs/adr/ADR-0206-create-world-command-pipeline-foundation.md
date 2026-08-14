# ADR-0206: Create World Command Pipeline Foundation

**Status:** Accepted  
**Date:** Sprint 10  
**Work Order:** WO-S10-002  
**Architecture Version:** v1.92 → v1.93

---

## Context

The Game Intent pipeline has individual components — `IntentRouter`, `GameIntentExtractor`, `SemanticWorldGenerator`, `SemanticGameDslBuilder`, and `RuntimeProjection` — but there is no orchestration layer that wires them together into an executable command pipeline.

### Problem

1. **No orchestration** — components exist in isolation, with no integration point to execute a full create-world flow
2. **No command abstraction** — there is no `CreateWorldCommand` to represent a user's request to create a game
3. **No pipeline result contract** — consumers have no standard way to receive the output of a creation attempt
4. **No early exit for unknown routes** — unknown requests (e.g., "hello", "what is the weather") have no defined failure path

### Scope Boundaries

Foundation only.
- No Renderer changes
- No Bootstrap changes
- No UI changes
- No Networking
- No LLM integration
- No ECS changes
- No Planner removal (MockPlanner preserved)

---

## Decision

Introduce a `CreateWorldPipeline` abstraction that orchestrates the full creation flow.

### Architecture

```
User Input (string)
    ↓
CreateWorldCommand { input }
    ↓
DefaultCreateWorldPipeline.execute(command)
    ├── IntentRouter.route(input)
    │     ├── 'create-world' → continue
    │     └── otherwise      → return { success: false, route: 'unknown' }
    ├── Build PromptAssemblyDomainModel (overview.title = input)
    ├── GameIntentExtractor.extract(model)
    ├── SemanticWorldGenerator.generate(model) → GameWorldModel
    ├── SemanticGameDslBuilder.build(model)    → GameDsl
    ├── Projection.project(dsl)               → { world }
    └── Return { route: 'create-world', world, success: true }
```

### Interfaces

| Interface | Role |
|-----------|------|
| `CreateWorldCommand` | Input command with `readonly input: string` |
| `CreateWorldPipeline` | Pipeline contract with `execute(command): CreateWorldPipelineResult` |
| `CreateWorldPipelineResult` | Output with `route`, `world`, `success` |
| `Projection` | Local projection interface (avoids `@genesis/runtime` import) |

### Result Contract

| Field | Type | Description |
|-------|------|-------------|
| `route` | `string` | The routed intent (`'create-world'` or `'unknown'`) |
| `world` | `World` | Projected Runtime world (empty when `success: false`) |
| `success` | `boolean` | Whether the pipeline completed successfully |

---

## Consequences

### Positive

1. **Executable pipeline** — the full create-world flow is now executable via a single `.execute()` call
2. **Early exit** — unknown routes short-circuit before any generation work
3. **Dependency injection** — all five dependencies are injected via constructor
4. **Projection decoupling** — `Projection` interface avoids `@genesis/runtime` import in `@genesis/ai`
5. **Pure orchestration** — pipeline is stateless, deterministic, and produces frozen outputs

### Negative

1. **Local Projection interface** — duplicates the method signature from `@genesis/runtime`'s `RuntimeProjection`
2. **GameIntentExtractor result unused** — extracted intent could be included in pipeline result for downstream consumers

### Neutral

1. All existing components remain unchanged
2. No breaking changes to any Public API
3. Future WOs can add more pipeline types (e.g., ModifyWorldPipeline)

---

## Files Created

| File | Purpose |
|------|---------|
| `packages/ai/src/game-intent/pipeline/CreateWorldCommand.ts` | Command interface |
| `packages/ai/src/game-intent/pipeline/CreateWorldPipelineResult.ts` | Result interface |
| `packages/ai/src/game-intent/pipeline/CreateWorldPipeline.ts` | Pipeline interface |
| `packages/ai/src/game-intent/pipeline/DefaultCreateWorldPipeline.ts` | Default implementation |
| `packages/ai/src/game-intent/pipeline/index.ts` | Barrel exports |
| `packages/ai/src/__tests__/CreateWorldPipeline.test.ts` | Test suite (97 tests) |
| `docs/adr/ADR-0206-create-world-command-pipeline-foundation.md` | This document |

---

## Verification Criteria

- [x] TypeScript 0 errors
- [x] ESLint 0 errors
- [x] All tests pass (9305/9305, including 97 pipeline tests)
- [x] "create mario" → `create-world` with non-empty world
- [x] "创建 mario" → `create-world` with non-empty world
- [x] "create farm" → `create-world` with non-empty world
- [x] "create rpg" → `create-world` with non-empty world
- [x] "create survival" → `create-world` with non-empty world
- [x] "hello" → `unknown` with empty world and `success: false`
- [x] Empty input → `unknown` with `success: false`
- [x] Architecture Version updated to v1.93