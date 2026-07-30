# ADR-0065: Prompt Strategy Prompt Integration

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-018  
**Architecture Version:** v0.53

---

## Context

WO-S5-017 introduced `PromptStrategyRenderer` and `DefaultPromptStrategyRenderer`, storing the rendered strategy string in `metadata.promptAssembly.strategyRendered`. However, the strategy rendered string existed only in metadata — it was never part of `PromptContext` and never rendered into the final prompt.

All preceding Sprint 5 semantic layers had prompt integration:
- Intent → `intentRendered` in PromptContext + CANONICAL_ORDER + compression support (WO-S5-005)
- Entity → `entityRendered` in PromptContext + CANONICAL_ORDER + compression support (WO-S5-010)
- Semantic Context → `semanticRendered` in PromptContext + CANONICAL_ORDER + compression support (WO-S5-014)
- Strategy → ❌ Metadata-only (WO-S5-017)

### Problem

1. **Strategy section missing from prompt** — Strategy information is metadata-only, never visible in the final prompt
2. **Incomplete prompt integration** — All other Sprint 5 layers have full prompt integration; Strategy is the only one missing
3. **No PromptContext field** — `PromptContext` has no `strategyRendered` field
4. **No canonical order entry** — `DefaultPromptRenderer.CANONICAL_ORDER` doesn't include `strategyRendered`
5. **No compression support** — `DefaultPromptCompression.isPromptContextKey()` doesn't recognize `strategyRendered`

### Constraints

1. **Follow existing patterns** — Must match Intent, Entity, and Semantic Context prompt integration exactly
2. **No interface modifications** — `PromptRenderer`, `PromptBuilder`, `Pipeline`, `Planner`, `Runtime`, `Provider`, `Memory`, `AgentLoop`, `BuilderOptions`, `PromptStrategyRenderer` — all unchanged
3. **Additive only** — New fields, new entries in arrays — no deletions, no modifications to existing fields
4. **No breaking changes** — All existing tests pass with zero modifications
5. **No Sprint 4 frozen interface modifications**

---

## Decision

### PromptContext Extension

Add optional `strategyRendered` field to `PromptContext`:

```typescript
interface PromptContext {
  // ... existing fields unchanged ...
  strategyRendered?: string  // ← NEW
}
```

Optional — fully backward compatible.

### CANONICAL_ORDER Update

Insert `'strategyRendered'` between `'semanticRendered'` and `'system'`:

```typescript
static readonly CANONICAL_ORDER: Array<keyof PromptContext> = [
  'intentRendered',
  'entityRendered',
  'semanticRendered',
  'strategyRendered',   // ← NEW
  'system',
  'userInput',
  'memory',
  'reflections',
  'worldState',
  'observations',
]
```

New canonical order:
```
Intent → Entities → Semantic Context → Prompt Strategy → System
→ User Input → Memory → Reflection → World State → Observations
```

### Compression Support

Add `'strategyRendered'` to the valid keys list in `DefaultPromptCompression.isPromptContextKey()`:
- Strategy section is preserved through compression (not stripped)
- Empty strategy section is stripped by compression (unchanged behavior)

### Builder Update

Inject `strategyRendered` into `promptContext` after Phase 0.95 (same pattern as `intentRendered`, `entityRendered`, `semanticRendered`):

```
Phase 0.95: PromptStrategyRenderer.render(selectedStrategy)
    ↓
Inject strategyRendered into promptContext.strategyRendered
Inject strategyRendered into renderContext.strategyRendered
```

### Full Pipeline

```
Phase 0:   IntentAnalyzer.analyze()
Phase 0.5: IntentRenderer.render()           → promptContext.intentRendered
Phase 0.75: EntityAnalyzer.analyze()
Phase 0.875: EntityRenderer.render()         → promptContext.entityRendered
Phase 0.8:  SemanticContextBuilder.build()
Phase 0.85: SemanticContextRenderer.render() → promptContext.semanticRendered
Phase 0.9:  PromptStrategySelector.select()
Phase 0.95: PromptStrategyRenderer.render()  → promptContext.strategyRendered  ← INJECTED
Phase 1:    MemoryRanking.rank()
Phase 2:    PromptBudget.calculate()
Phase 2.5:  ProviderBudget.getBudget()
Phase 3:    PromptSelection.select()
Phase 4:    PromptCompression.compress()
Phase 6:    PromptRenderer.render()          → strategyRendered appears in prompt
```

### Comparison with Intent/Entity/Semantic Prompt Integration

| Aspect | Intent | Entity | Semantic | Strategy |
|--------|--------|--------|----------|----------|
| PromptContext field | `intentRendered` | `entityRendered` | `semanticRendered` | `strategyRendered` |
| CANONICAL_ORDER | Yes | Yes | Yes | Yes |
| Compression support | Yes | Yes | Yes | Yes |
| Builder injection | Phase 0.5 | Phase 0.875 | Phase 0.85 | Phase 0.95 |
| Metadata storage | Yes | Yes | Yes | Yes |
| Prompt section | Yes | Yes | Yes | **NEW** |

---

## Consequences

### Positive

1. **Strategy is now an official prompt section** — Strategy information is visible in the final prompt
2. **Complete Sprint 5 integration** — All Sprint 5 layers now have full prompt integration
3. **Consistent pattern** — Follows the exact same pattern as Intent, Entity, and Semantic Context
4. **No breaking changes** — All existing code works unchanged
5. **No interface modifications** — Only additive changes to data structures

### Negative

None.

### Neutral

1. Strategy section always appears in prompts when `DefaultPromptStrategyRenderer` is active (which is always, since it's the default) — users see `"Prompt Strategy:\n\n- default"` in every prompt

---

## Alternatives Considered

### Skip strategy section when empty

Accepted — compression strips empty `strategyRendered`, so non-rendered strategies (empty/blank names) don't appear as sections.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: Updated assertions where prompt output changed (strategy section now appears)
- **New tests**: `PromptStrategyPromptIntegration.test.ts` with comprehensive coverage

---

## References

- WO-S5-015 — Prompt Strategy Foundation
- WO-S5-016 — Prompt Strategy Consumption
- WO-S5-017 — Prompt Strategy Rendering Foundation
- WO-S5-018 — Prompt Strategy Prompt Integration
- ADR-0062 — Prompt Strategy Foundation
- ADR-0063 — Prompt Strategy Consumption
- ADR-0064 — Prompt Strategy Rendering Foundation
- `packages/ai/src/prompt/PromptContext.ts`
- `packages/ai/src/prompt/DefaultPromptRenderer.ts`
- `packages/ai/src/prompt/DefaultPromptCompression.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptStrategyPromptIntegration.test.ts`