# ADR-0205: Intent Router Foundation

**Status:** Accepted  
**Date:** Sprint 10  
**Work Order:** WO-S10-001  
**Architecture Version:** v1.91 → v1.92

---

## Context

The GameIntent pipeline exists — `PromptAssemblyDomainModel` → `GameIntentExtractor` → `GameIntent`. However, the system still relies on the legacy `MockPlanner` action routing for natural language requests. When a user says "创建 MarioWorld", the system responds with "Unknown: 创建 MarioWorld" because there is no runtime routing layer to classify the intent.

### Problem

1. **No intent routing** — natural language requests are not classified into generation intents
2. **MockPlanner fallback** — the system still relies on legacy mock routing for action dispatch
3. **No route classification** — there is no way to distinguish "create-world" requests from unknown queries
4. **No confidence scoring** — the system cannot express certainty about its route classification

### Scope Boundaries

Foundation only.
- No LLM integration
- No runtime changes
- No renderer changes
- No DSL changes
- No Planner removal (MockPlanner preserved for backward compatibility)
- No UI changes
- No AI calls

---

## Decision

Introduce an `IntentRouter` abstraction that routes natural language inputs into semantic `IntentRoute` values with confidence scores.

### Architecture

```
User Input (string)
    ↓
IntentRouter.route(input)
    ├── has create keyword?  → create-world
    ├── has genre keyword?   → confidence boost (1.0)
    └── otherwise            → unknown (0.0)

IntentRoutingResult { route: IntentRoute, confidence: number }
```

### Route Types

| Route | Description |
|-------|-------------|
| `'create-world'` | User wants to create a new game world |
| `'unknown'` | Intent cannot be determined |

### Confidence Levels

| Level | Value | Condition |
|-------|-------|-----------|
| Definite | `1.0` | Creation keyword + genre keyword both present |
| Strong | `0.8` | Creation keyword only, no genre keyword |
| Unknown | `0.0` | No route determined |

### Routing Rules

**Creation keywords** (case-insensitive for English):
- `"create"` (English)
- `"创建"` (Chinese)
- `"生成"` (Chinese)
- `"build"` (English)

**Genre keywords** (case-insensitive) — provide confidence boost:
- `"mario"` → platformer genre detected
- `"farm"` → farm genre detected
- `"rpg"` → RPG genre detected
- `"survival"` → survival genre detected

---

## Consequences

### Positive

1. **Decoupled routing** — intent classification is separated from planner dispatch
2. **Rule-based foundation** — no LLM dependency for basic routing
3. **Confidence scoring** — enables downstream systems to act with appropriate certainty
4. **Multi-language support** — Chinese and English creation keywords both supported
5. **Deterministic routing** — same input always produces same route
6. **Zero external dependencies** — pure TypeScript implementation

### Negative

1. **Limited to creation intents** — only `create-world` is supported initially
2. **Substring matching** — "creation" and "recreate" may produce false positives
3. **No semantic understanding** — "delete my game" routes to unknown (correct but limited)

### Neutral

1. MockPlanner is preserved — no breaking changes to existing routing
2. Future WOs can add more routes (modify-world, delete-world, etc.)

---

## Files Created

| File | Purpose |
|------|---------|
| `packages/ai/src/game-intent/router/IntentRoute.ts` | Route type definition |
| `packages/ai/src/game-intent/router/IntentRoutingResult.ts` | Route result interface |
| `packages/ai/src/game-intent/router/IntentRouter.ts` | Router interface |
| `packages/ai/src/game-intent/router/DefaultIntentRouter.ts` | Default implementation |
| `packages/ai/src/game-intent/router/index.ts` | Barrel exports |
| `packages/ai/src/__tests__/IntentRouter.test.ts` | Test suite (130 tests) |

## Updated Files

| File | Change |
|------|--------|
| `packages/ai/src/game-intent/index.ts` | Added router exports |
| `packages/ai/src/index.ts` | Added IntentRoute, IntentRoutingResult, IntentRouter, DefaultIntentRouter exports |
| `docs/project/PROJECT_STATE.md` | Updated to v1.92 |
| `docs/project/CHANGELOG.md` | Added WO-S10-001 entry |

---

## Verification Criteria

- [x] TypeScript 0 errors
- [x] ESLint 0 errors
- [x] All tests pass (130+ test cases)
- [x] IntentRouter exists with correct interface
- [x] "创建 MarioWorld" → `create-world` with confidence 1.0
- [x] "生成 RPG 游戏" → `create-world` with confidence 1.0
- [x] "帮我做一个农场游戏" → `create-world` with confidence 0.8
- [x] "hello" → `unknown` with confidence 0.0
- [x] Architecture Version updated to v1.92