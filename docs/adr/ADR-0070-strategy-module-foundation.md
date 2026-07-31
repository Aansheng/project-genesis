# ADR-0070: Strategy Module Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-023  
**Architecture Version:** v0.58

---

## Context

WO-S5-015 through WO-S5-022 established the Strategy Layer with strategy selection and rendering. The current architecture:

- `PromptStrategy` + `PromptStrategySelector` select a strategy based on `SemanticContext`
- `PromptStrategyRenderer` renders the selected strategy as `"Prompt Strategy:\n\n- {name}"`
- Strategy metadata is stored in `metadata.promptAssembly.strategy` and `strategyRendered`

However, strategies currently only produce metadata and a rendered name — they do NOT contribute prompt content that affects LLM behavior. Each strategy identifies *what* the user wants but does not guide *how* the LLM should respond.

### Problem

1. **No strategy-specific prompt content** — Strategies produce a label but no behavioral guidelines
2. **No StrategyModule abstraction** — No way for each strategy to contribute a PromptModule
3. **Disconnected from Prompt Assembly** — Strategy selection and prompt content are separate concerns

---

## Decision

### StrategyModule Interface

New interface `StrategyModule` extending `PromptModule`:

```typescript
interface StrategyModule extends PromptModule {}
```

This is a marker extension — it inherits all of `PromptModule`'s contract (`build()` and optional `buildContext()`) while establishing a semantic category for strategy-specific prompt modules.

### Concrete Strategy Modules

Four modules, one per business strategy:

| Module | Output |
|--------|--------|
| `CreateStrategyModule` | `"Creation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities"` |
| `QueryStrategyModule` | `"Query Guidelines:\n\n- Focus on retrieving information\n- Avoid changing world state"` |
| `ModifyStrategyModule` | `"Modification Guidelines:\n\n- Preserve entity identity\n- Modify only requested properties"` |
| `DeleteStrategyModule` | `"Deletion Guidelines:\n\n- Confirm target existence\n- Remove only requested entities"` |

Each module:
- Implements `StrategyModule` (which extends `PromptModule`)
- `build()` returns deterministic guideline text
- `buildContext()` returns `{ strategyRendered: <guidelines> }`
- Pure, stateless, deterministic — no side effects
- Input-independent — same output regardless of `PipelineContext`

### Foundation Only

This WO establishes the abstraction and concrete modules. **No consumption yet** — modules are not wired into `PromptBuilder`. The wiring (strategy module selection based on selected strategy) is a future WO.

### DO NOT Modify

- `PromptBuilder`
- `PromptRenderer`
- `PromptContext`
- `PromptCompression`
- `Pipeline`
- `Planner`

---

## Consequences

### Positive

1. **Strategy → Prompt bridge** — Each strategy can now contribute behavioral guidelines
2. **PromptModule conformance** — Strategy modules are compatible with the existing prompt pipeline
3. **Deterministic content** — Each module produces stable, predictable output
4. **Foundation for wiring** — Future WO can select the appropriate module based on selected strategy
5. **No breaking changes** — All existing behavior preserved

### Negative

None.

### Neutral

1. `StrategyModule` is currently a marker extension of `PromptModule` — no additional methods yet
2. All four modules write to `strategyRendered` in `buildContext()` — future wiring will need to resolve which module's output takes precedence
3. No PromptBuilder integration yet — modules exist but are not consumed

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2504 pass (zero modifications)
- **New tests**: `StrategyModuleFoundation.test.ts` with 100 comprehensive test cases
- **No PromptBuilder changes**: Verified
- **No Pipeline changes**: Verified
- **No Planner changes**: Verified

---

## References

- WO-S5-015 — Prompt Strategy Foundation (ADR-0064)
- WO-S5-016 — Prompt Strategy Consumption (ADR-0065)
- WO-S5-017 — Prompt Strategy Rendering Foundation
- WO-S5-018 — Prompt Strategy Prompt Integration
- WO-S5-019 — Create Strategy (ADR-0066)
- WO-S5-020 — Query Strategy (ADR-0067)
- WO-S5-021 — Modify Strategy (ADR-0068)
- WO-S5-022 — Delete Strategy (ADR-0069)
- `packages/ai/src/strategy/StrategyModule.ts`
- `packages/ai/src/strategy/CreateStrategyModule.ts`
- `packages/ai/src/strategy/QueryStrategyModule.ts`
- `packages/ai/src/strategy/ModifyStrategyModule.ts`
- `packages/ai/src/strategy/DeleteStrategyModule.ts`
