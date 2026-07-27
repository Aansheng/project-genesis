# ADR-0059: Semantic Context Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-012  
**Architecture Version:** v0.47

---

## Context

ADR-0058 established the Semantic Layer foundation with `SemanticContext`, `SemanticContextBuilder`, and `DefaultSemanticContextBuilder`. However, SemanticContext was explicitly NOT integrated into any pipeline component — it existed as a standalone abstraction with no consumers.

The Prompt Assembly pipeline has two independent semantic analysis stages: `IntentAnalyzer` and `EntityAnalyzer`. Both produce structured results (`IntentResult`, `EntityResult`) that are independently stored in `AIRequest.metadata.promptAssembly`. Downstream consumers must access two separate metadata keys.

### Problem

1. **No consumption** — SemanticContext exists but is never built by the pipeline
2. **No unified metadata** — `AIRequest.metadata.promptAssembly` stores `intent` and `entity` separately
3. **No Builder integration** — `BuilderOptions` has no `SemanticContextBuilder` field
4. **No pipeline phase** — The Prompt Assembly pipeline has no SemanticContext phase

### Constraints

1. **Consumption only** — No rendering, no prompt integration, no prompt section changes
2. **No breaking changes** All existing interfaces unchanged
3. **Frozen interfaces** — `PromptRenderer`, `PromptContext`, `PromptCompression`, `Pipeline`, `Planner`, `Runtime`, `Provider`, `AgentLoop`, all Sprint 4 Frozen interfaces must NOT be modified
4. **Backward compatible** — `BuilderOptions` field is optional, default behavior identical
5. **Additive** — New fields only, no deletion of existing fields (`intent`, `intentRendered`, `entity`, `entityRendered` all preserved)

---

## Decision

### 1. BuilderOptions: New `semanticContextBuilder` Field

Add an optional `semanticContextBuilder?: SemanticContextBuilder` field to `BuilderOptions`.

```typescript
interface BuilderOptions {
  // ... existing fields unchanged ...
  /** Optional SemanticContextBuilder (defaults to undefined — no semantic context) */
  semanticContextBuilder?: SemanticContextBuilder
}
```

- **Optional** — no breaking changes, backward compatible
- **Default undefined** — existing behavior completely unchanged
- **Injectable** — any `SemanticContextBuilder` implementation via BuilderOptions

### 2. DefaultPromptBuilder: New Phase 0.8

Add a new pipeline phase between EntityRenderer (Phase 0.875) and MemoryRanking (Phase 1):

```
PromptModules
    ↓
IntentAnalyzer          ← Phase 0 (existing)
    ↓
IntentRenderer          ← Phase 0.25 (existing)
    ↓
EntityAnalyzer          ← Phase 0.75 (existing)
    ↓
EntityRenderer          ← Phase 0.875 (existing)
    ↓
SemanticContextBuilder  ← Phase 0.8 (NEW)
    ↓
MemoryRanking           ← Phase 1 (existing)
    ↓
PromptBudget            ← Phase 2 (existing)
    ↓
...
```

The phase number `0.8` slots between `0.875` (EntityRenderer) and `1` (MemoryRanking). This is intentional — the semantic context is built from intent and entity results after both analyzers and renderers have run.

### 3. metadata.promptAssembly.semantic

The `SemanticContext` result is written to `AIRequest.metadata.promptAssembly.semantic`.

```typescript
AIRequest.metadata.promptAssembly = {
  intent: IntentResult,          // ← preserved (existing)
  intentRendered: string,        // ← preserved (existing)
  entity: EntityResult,          // ← preserved (existing)
  entityRendered: string,        // ← preserved (existing)
  semantic: SemanticContext,     // ← NEW (Phase 0.8)
  ranking: MemoryRankingResult,
  budget: PromptBudgetResult,
  selection: PromptSelectionResult,
  providerBudget?: ProviderBudgetResult,
}
```

- **All existing fields preserved** — no deletions, no renames
- **`semantic` is additive** — only present when `SemanticContextBuilder` is injected
- **No rendering** — `semantic` is metadata only, NOT injected into PromptContext
- **No prompt section** — SemanticContext does NOT add a new section to the rendered prompt

### 4. No Other Changes

This WO does NOT modify:
- `PromptRenderer` — no new rendering logic
- `PromptContext` — no new context fields
- `PromptCompression` — no new compression logic
- `Pipeline` — no pipeline changes
- `Planner` — Planner still receives raw text
- `AgentLoop` — no semantic-aware loop behavior
- `IntentAnalyzer` — completely independent
- `EntityAnalyzer` — completely independent
- Any Sprint 4 Frozen Interface

---

## Consequences

**Positive:**
- `SemanticContext` is now consumed by the Prompt Assembly pipeline
- `AIRequest.metadata.promptAssembly.semantic` provides unified semantic context
- All existing code continues unchanged — no interface modifications
- `BuilderOptions.semanticContextBuilder` is optional — zero impact on existing usage
- Default behavior is completely unchanged
- All existing fields (`intent`, `intentRendered`, `entity`, `entityRendered`) preserved
- `DefaultSemanticContextBuilder` works out of the box with no configuration
- Provider-agnostic — works identically with Mock, OpenAI, DeepSeek
- Backward compatible — no existing tests modified

**Negative:**
- SemanticContext is metadata-only — not yet rendered in prompt
- Builders without `semanticContextBuilder` do not produce SemanticContext

**Neutral:**
- Builder becomes the sole consumer of SemanticContext
- Architecture version bumped to v0.47

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Semantic Rendering | Render SemanticContext in prompt as a new section |
| Semantic → Planner | Pass SemanticContext to Planner for semantic-aware planning |
| Semantic → AgentLoop | Semantic-aware loop behavior |
| Semantic Budget | Budget-aware semantic context construction |

---

## References

- ADR-0058: Semantic Context Foundation
- WO-S5-012: Semantic Context Consumption (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state