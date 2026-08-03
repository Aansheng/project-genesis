# ADR-0085: Strategy Selection Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-038  
**Architecture Version:** v0.73

---

## Context

WO-S5-029 introduced `StrategySelectionMetadata` which captures the selected strategy name and all evaluated candidates with their scores. This metadata is stored in `metadata.promptAssembly.strategySelection` but has no rendered string representation.

### Problem

1. **No human-readable rendering** — strategy selection metadata is only available as raw structured data
2. **No inspection** — downstream consumers cannot easily inspect selection reasoning as a formatted string
3. **No extension point** — no abstraction for rendering strategy selection data

---

## Decision

### StrategySelectionRenderer

Introduce a rendering interface for strategy selection metadata:

```typescript
interface StrategySelectionRenderer {
  render(metadata: StrategySelectionMetadata): string
}
```

### DefaultStrategySelectionRenderer

Default implementation producing a human-readable format:

```
Strategy Selection:

Selected:
- create (100)

Candidates:
- create: 100
- query: 20
- modify: 10
- delete: 0
```

### BuilderOptions

Add optional `strategySelectionRenderer` field.

### DefaultPromptBuilder Phase 0.915

Insert after Phase 0.91 (StrategySelectionMetadata) and before Phase 0.925 (StrategyModule resolution):

```typescript
// Phase 0.915: StrategySelectionRenderer — render selection metadata for metadata storage
if (strategySelectionMetadata !== undefined && this.strategySelectionRenderer !== undefined) {
  strategySelectionRendered = this.strategySelectionRenderer.render(strategySelectionMetadata)
}
```

Store in `metadata.promptAssembly.strategySelectionRendered`.

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- Prompt output — unchanged (metadata only)
- `BuilderOptions` — backward compatible (optional field)

---

## Consequences

### Positive

1. **Human-readable selection data** — strategy selection results available as formatted string
2. **Metadata only** — no impact on prompt output
3. **Backward compatible** — optional field, no breaking changes
4. **Pure, stateless, deterministic** — same input always produces same output

### Negative

None.

### Neutral

1. The rendered output is only stored in metadata — not injected into the final prompt
2. Phase 0.915 sits between Phase 0.91 (metadata creation) and Phase 0.925 (module resolution)

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3405 pass (zero modifications)
- **New tests**: `StrategySelectionRenderingFoundation.test.ts` with 49 test cases
- **Total tests**: 3454 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-029 — Strategy Selection Result Consumption (ADR-0076)
- `packages/ai/src/strategy/StrategySelectionRenderer.ts`
- `packages/ai/src/strategy/DefaultStrategySelectionRenderer.ts`
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/StrategySelectionRenderingFoundation.test.ts`