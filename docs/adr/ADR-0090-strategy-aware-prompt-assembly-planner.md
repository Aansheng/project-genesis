# ADR-0090: Strategy-Aware Prompt Assembly Planner

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-043  
**Architecture Version:** v0.78

---

## Context

WO-S5-040 introduced `DefaultPromptAssemblyPlanner` which assigns all sections priority 100 regardless of strategy. WO-S5-041 consumed the planner in `DefaultPromptBuilder`, storing the plan in metadata. WO-S5-042 made section ordering plan-aware via `PriorityAwarePromptAssemblyStrategy`.

However, the plan content was identical for all strategies — every section received priority 100. The planner had no strategy awareness, making the plan useless for differentiated ordering.

### Problem

1. **No strategy differentiation** — all strategies produce the same plan (all sections priority 100)
2. **No semantic priority** — the plan cannot reflect the different needs of create/query/modify/delete
3. **Flat priority** — all sections are equally important, defeating the purpose of priority-based ordering

---

## Decision

### StrategyAwarePromptAssemblyPlanner

Create a strategy-aware planner that produces distinct priority plans for each business strategy:

**Create priority table:**
| Section | Priority |
|---------|----------|
| userInput | 100 |
| worldState | 90 |
| strategyModuleRendered | 80 |
| strategyRendered | 70 |
| memory | 30 |
| observations | 20 |
| (others) | 0 |

**Query priority table:**
| Section | Priority |
|---------|----------|
| userInput | 100 |
| worldState | 90 |
| memory | 80 |
| observations | 70 |
| strategyModuleRendered | 60 |
| strategyRendered | 50 |
| (others) | 0 |

**Modify priority table:**
| Section | Priority |
|---------|----------|
| userInput | 100 |
| worldState | 90 |
| entityRendered | 85 |
| memory | 70 |
| observations | 60 |
| strategyModuleRendered | 50 |
| strategyRendered | 40 |
| (others) | 0 |

**Delete priority table:**
| Section | Priority |
|---------|----------|
| userInput | 100 |
| worldState | 90 |
| entityRendered | 85 |
| observations | 80 |
| memory | 70 |
| strategyModuleRendered | 50 |
| strategyRendered | 40 |
| (others) | 0 |

**Default/unknown strategy:**
All sections priority 100.

### Implementation

- `StrategyAwarePromptAssemblyPlanner` implements `PromptAssemblyPlanner`
- Uses a static `STRATEGY_PRIORITY_TABLE` mapping strategy names to section→priority maps
- Sections not in the strategy's table receive priority 0
- Unknown strategy names fall back to all sections priority 100
- Pure, stateless, deterministic — no side effects

### Integration

The planner is consumed via the existing `promptAssemblyPlanner` field in `BuilderOptions`. No changes to `DefaultPromptBuilder` or `BuilderOptions` are needed — the planner is already invoked at Phase 0.955.

### NOT Modified

- `PromptAssemblyPlanner` interface — unchanged
- `BuilderOptions` — unchanged (no new fields)
- `DefaultPromptBuilder` — unchanged (already consumes planner)
- `PromptRenderer`, `PromptCompression`, `PromptAssemblyStrategy` — unchanged
- Runtime, Planner, AgentLoop, PromptContext — unchanged

---

## Consequences

### Positive

1. **Strategy-aware plans** — each strategy produces distinct priorities
2. **Semantic ordering** — sections are prioritized according to intent
3. **Backward compatible** — existing code continues working unchanged
4. **Drop-in replacement** — same interface, different behavior
5. **Static table** — easy to extend with new strategies

### Negative

None.

### Neutral

1. Sections not in the priority table receive 0 — they will be sorted to the end by `DefaultPriorityAwarePromptAssemblyStrategy`
2. The `default` strategy preserves the original behavior (all sections priority 100)

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3583 pass (zero modifications)
- **New tests**: `StrategyAwarePromptAssemblyPlanner.test.ts` with 47 test cases
- **Total tests**: 3630 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-040 — Section Priority Foundation (ADR-0087)
- WO-S5-041 — Prompt Assembly Planner Consumption (ADR-0088)
- WO-S5-042 — Priority-Aware Prompt Assembly (ADR-0089)
- `packages/ai/src/strategy/StrategyAwarePromptAssemblyPlanner.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyPlanner.ts`
- `packages/ai/src/__tests__/StrategyAwarePromptAssemblyPlanner.test.ts`