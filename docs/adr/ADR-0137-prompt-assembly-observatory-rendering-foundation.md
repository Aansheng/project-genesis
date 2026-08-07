# ADR-0137: Prompt Assembly Observatory Renderer Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-090  
**Architecture Version:** v1.23 → v1.24

---

## Context

PromptAssemblyObservatory is the unified aggregation container for all prompt assembly observability data, consolidating six artifacts: trace, timeline, history, traceSnapshot, timelineSnapshot, and historySnapshot.

While the observatory exists as a data structure, there is no mechanism to render it as human-readable text. Following the established pattern of PromptAssemblyTraceRenderer, PromptAssemblyTimelineRenderer, and PromptAssemblyHistoryRenderer, the observatory now requires a rendering capability.

### Problem

1. **No observatory renderer** — no mechanism to render PromptAssemblyObservatory as human-readable text
2. **No render interface** — no contract defining how observatory rendering should behave
3. **No default renderer** — no canonical implementation for rendering the observatory

---

## Decision

### PromptAssemblyObservatoryRenderer

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatoryRenderer.ts`:

```typescript
export interface PromptAssemblyObservatoryRenderer {
  render(observatory: PromptAssemblyObservatory): string
}
```

Single method contract — pure, stateless, deterministic.

### DefaultPromptAssemblyObservatoryRenderer

A default implementation in `packages/ai/src/strategy/DefaultPromptAssemblyObservatoryRenderer.ts`.

Iterates over six known observatory artifact fields in declaration order:

1. `trace`
2. `timeline`
3. `history`
4. `traceSnapshot`
5. `timelineSnapshot`
6. `historySnapshot`

**Non-empty output format:**
```
Prompt Assembly Observatory

Artifacts:

- trace
- timeline
- history
- traceSnapshot
- timelineSnapshot
- historySnapshot
```

**Empty output:**
```
Prompt Assembly Observatory

No Artifacts
```

**Rendering rules:**
- Only existing artifacts (non-undefined fields) are rendered
- Artifact order follows PromptAssemblyObservatory field declaration order
- Empty observatory produces "No Artifacts" text
- Header is always present

**Properties:**
- **Pure:** same observatory always produces same string
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies the input observatory
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `DefaultPromptBuilder`
- `BuilderOptions`
- `PromptRenderer`
- `PromptCompression`
- `Planner`
- `Runtime`
- `Pipeline`
- `AgentLoop`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Observatory rendering capability** — PromptAssemblyObservatoryRenderer provides a contract for rendering
2. **Default implementation** — DefaultPromptAssemblyObservatoryRenderer provides canonical rendering behavior
3. **Consistent pattern** — follows same design as PromptAssemblyTraceRenderer, PromptAssemblyTimelineRenderer, PromptAssemblyHistoryRenderer
4. **Foundation complete** — observatory renderer infrastructure exists for future consumption
5. **Backward compatible** — no breaking changes to any public API
6. **Tested** — 98 tests covering interface contract, empty observatory, single artifacts, multiple artifacts, rendering validation, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **98 new tests pass** — in `PromptAssemblyObservatoryRenderingFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.23 → v1.24