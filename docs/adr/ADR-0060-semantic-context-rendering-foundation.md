# ADR-0060: Semantic Context Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-013  
**Architecture Version:** v0.48

---

## Context

WO-S5-011 established the Semantic Layer with `SemanticContext`, `SemanticContextBuilder`, and `DefaultSemanticContextBuilder`. WO-S5-012 integrated `SemanticContextBuilder` consumption into the Prompt Builder pipeline, writing `SemanticContext` to `metadata.promptAssembly.semantic`.

However, there is no rendering layer for `SemanticContext`. The raw `SemanticContext` object (with nested `IntentResult` and `EntityResult`) is available in metadata, but there is no human-readable string representation comparable to `IntentRenderer` and `EntityRenderer`.

### Problem

1. **No Semantic renderer** — `SemanticContext` cannot be rendered to a string
2. **No metadata string** — `metadata.promptAssembly` has `intentRendered` and `entityRendered` but no `semanticRendered`
3. **No `BuilderOptions` field** — No way to inject a `SemanticContextRenderer` into the builder
4. **No pipeline phase** — No rendering phase after `SemanticContextBuilder.build()`

### Constraints

1. **Render only into metadata** — No PromptContext modification, no PromptRenderer modification
2. **No Prompt integration** — No new prompt sections added
3. **Interface first** — `SemanticContextRenderer` defines the contract; `DefaultSemanticContextRenderer` is the simplest valid implementation
4. **Pure, stateless, deterministic** — Same input always produces same output
5. **Immutable** — Never modifies inputs
6. **No breaking changes** — All existing interfaces unchanged
7. **No frozen interface modifications** — Sprint 4 frozen interfaces must NOT be modified

---

## Decision

### 1. New File: `SemanticContextRenderer.ts`

```typescript
export interface SemanticContextRenderer {
  render(context: SemanticContext): string
}
```

- Single-method interface
- Accepts `SemanticContext`, returns formatted string
- Pure function contract: same input always produces same output
- No dependencies on any other component

### 2. New File: `DefaultSemanticContextRenderer.ts`

```typescript
class DefaultSemanticContextRenderer implements SemanticContextRenderer {
  render(context: SemanticContext): string { ... }
}
```

Rendering rules:

| Input | Output |
|-------|--------|
| Empty context (no intent, no entity) | `""` (empty string) |
| Intent only | `"Semantic Context:\n\nIntent:\n- {type}"` |
| Entity only | `"Semantic Context:\n\nEntities:\n- {type}"` |
| Both | `"Semantic Context:\n\nIntent:\n- {type}\n\nEntities:\n- {type}"` |

Properties:
- Pure, stateless, deterministic
- Immutable: never modifies input, returns new string
- Zero dependencies

### 3. BuilderOptions: New `semanticContextRenderer` Field

```typescript
interface BuilderOptions {
  // ... existing fields unchanged ...
  /** Optional SemanticContextRenderer (defaults to undefined — no semantic rendering) */
  semanticContextRenderer?: SemanticContextRenderer
}
```

- **Optional** — no breaking changes, backward compatible
- **Default undefined** — existing behavior completely unchanged

### 4. DefaultPromptBuilder: New Phase 0.85

```
SemanticContextBuilder  ← Phase 0.8 (existing)
    ↓
SemanticContextRenderer  ← Phase 0.85 (NEW)
    ↓
MemoryRanking           ← Phase 1 (existing)
```

### 5. metadata.promptAssembly.semanticRendered

```typescript
AIRequest.metadata.promptAssembly = {
  intent: IntentResult,
  intentRendered: string,
  entity: EntityResult,
  entityRendered: string,
  semantic: SemanticContext,       // ← Phase 0.8
  semanticRendered: string,        // ← NEW (Phase 0.85)
  ranking: MemoryRankingResult,
  budget: PromptBudgetResult,
  selection: PromptSelectionResult,
  providerBudget?: ProviderBudgetResult,
}
```

- **All existing fields preserved** — no deletions, no renames
- **`semanticRendered` is additive** — only present when `SemanticContextRenderer` is injected
- **Metadata only** — NOT injected into PromptContext
- **No prompt section** — not rendered in final prompt

### 6. No Other Changes

This WO does NOT modify:
- `PromptRenderer` — no new rendering logic
- `PromptContext` — no new context fields
- `PromptCompression` — no new compression logic
- `Pipeline` — no pipeline changes
- `Planner` — Planner still receives raw text
- `AgentLoop` — no semantic-aware loop behavior
- Any Sprint 4 Frozen Interface

---

## Consequences

**Positive:**
- `SemanticContext` now has a rendering layer comparable to `IntentRenderer` and `EntityRenderer`
- `metadata.promptAssembly.semanticRendered` provides human-readable string representation
- All existing code continues unchanged — no interface modifications
- `BuilderOptions.semanticContextRenderer` is optional — zero impact on existing usage
- Default behavior is completely unchanged
- Provider-agnostic — works identically with Mock, OpenAI, DeepSeek

**Negative:**
- Rendered string is metadata-only — not yet included in prompt
- Builders without `semanticContextRenderer` do not produce `semanticRendered`

**Neutral:**
- Architecture version bumped to v0.48

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Semantic → Prompt | Render semantic context as a new section in the final prompt |
| Semantic → Planner | Pass rendered semantic context to Planner |
| Alternative Formats | XML, JSON, LLM-optimized renderers |

---

## References

- ADR-0058: Semantic Context Foundation
- ADR-0059: Semantic Context Consumption
- WO-S5-013: Semantic Context Rendering Foundation (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state