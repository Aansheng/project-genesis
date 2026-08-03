# ADR-0079: Prompt Assembly Strategy Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-032  
**Architecture Version:** v0.67

---

## Context

WO-S5-031 introduced the PromptAssemblyStrategy foundation:

- `PromptAssemblyStrategy` interface — `apply(sections)` transforms prompt sections
- `DefaultPromptAssemblyStrategy` — identity function (returns sections unchanged)
- `PromptAssemblyStrategyResolver` interface — resolves strategy name to assembly strategy
- `DefaultPromptAssemblyStrategyResolver` — always returns DefaultPromptAssemblyStrategy

These types exist but are not yet consumed by DefaultPromptBuilder.

### Problem

1. **No integration** — PromptAssemblyStrategyResolver is not wired into DefaultPromptBuilder
2. **No metadata** — no promptAssemblyStrategy metadata recorded in prompt assembly
3. **No Phase 0.96** — no resolution step between strategy rendering and section assembly

---

## Decision

### BuilderOptions

Add optional `promptAssemblyStrategyResolver` to BuilderOptions:

```typescript
interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyStrategyResolver?: PromptAssemblyStrategyResolver
}
```

Optional field — backward compatible.

### DefaultPromptBuilder

Wire `promptAssemblyStrategyResolver` through constructor:

```typescript
private readonly promptAssemblyStrategyResolver?: PromptAssemblyStrategyResolver
```

### Phase 0.96

Insert after Phase 0.95 (PromptStrategyRenderer) and before Phase 1 (MemoryRanking):

```typescript
// Phase 0.96: PromptAssemblyStrategyResolver — resolve assembly strategy for metadata
let promptAssemblyStrategy: { strategyName: string } | undefined
if (this.promptAssemblyStrategyResolver !== undefined) {
  const assemblyStrategy = this.promptAssemblyStrategyResolver.resolve(selectedStrategy.name)
  promptAssemblyStrategy = { strategyName: assemblyStrategy.strategyName }
}
```

### Metadata

Store in `metadata.promptAssembly.promptAssemblyStrategy`:

```json
{
  "strategyName": "default"
}
```

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptContext` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- Prompt sections — not altered, reordered, or filtered

---

## Consequences

### Positive

1. **Resolver integrated** — PromptAssemblyStrategyResolver consumed by DefaultPromptBuilder
2. **Metadata recorded** — `promptAssemblyStrategy` stored in promptAssembly metadata
3. **Backward compatible** — all fields optional, no prompt behavior changes
4. **Foundation consumed** — WO-S5-031 types now flow through the builder
5. **All existing tests pass** — zero breaking changes

### Negative

None.

### Neutral

1. The resolver is metadata-only — `apply()` is NOT called on prompt sections yet
2. The `promptAssemblyStrategy` metadata is a plain `{ strategyName: string }` — future work may add more fields
3. Phase 0.96 is between strategy rendering and memory ranking — this is the correct position for assembly strategy resolution

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2915 pass (zero modifications)
- **New tests**: `PromptAssemblyStrategyConsumption.test.ts` with 47 comprehensive test cases
- **Total tests**: 2962 passing
- **No breaking changes** to any Public API
- **No prompt behavior changes** — prompt output identical with and without resolver

---

## References

- WO-S5-031 — Prompt Assembly Strategy Foundation (ADR-0078)
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyStrategyConsumption.test.ts`
