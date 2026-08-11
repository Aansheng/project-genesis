# ADR-0165: Observatory Mapping Layer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-022  
**Architecture Version:** v1.51 → v1.52

---

## Context

The Observatory Metadata Bridge (WO-S6-020) produces `ObservatoryBridgeData` with these keys: `overview`, `trace`, `timeline`, `history`, `diff`, `runtime`, `eventStream`. The `DefaultObservatoryAdapter` expects these keys: `overview`, `trace`, `timeline`, `history`, `diffView`, `runtimeView`, `eventStreamView`. There is currently no explicit mapping between the two naming conventions.

### Problem

1. **Key mismatch** — `diff` vs `diffView`, `runtime` vs `runtimeView`, `eventStream` vs `eventStreamView`
2. **Implicit mapping** — currently done manually in the store (casting bridge data to `Record<string, unknown>`)
3. **No abstraction** — no pure, stateless, deterministic function that resolves naming differences
4. **No filtering** — bridge data should omit empty/undefined/null sections before adapter consumption

### Scope Boundaries

- Foundation only — no connection to PromptBuilder yet
- No Runtime changes
- No Planner changes
- No AI package changes
- No UI changes

---

## Decision

### 1. Mapping Layer Architecture

Create a new `mapping/` directory under `apps/web/src/adapters/observatory/mapping/`:

```
apps/web/src/adapters/observatory/mapping/
├── ObservatoryMapper.ts            # Interface
├── DefaultObservatoryMapper.ts     # Implementation
└── index.ts                        # Barrel exports
```

### 2. ObservatoryMapper Interface

```typescript
export interface ObservatoryMapper {
  map(bridgeData: ObservatoryBridgeData): Record<string, unknown>
}
```

### 3. Mapping Rules

| Bridge Key      | Adapter Key      | Action   |
|-----------------|------------------|----------|
| `overview`      | `overview`       | passthru |
| `trace`         | `trace`          | passthru |
| `timeline`      | `timeline`       | passthru |
| `history`       | `history`        | passthru |
| `diff`          | `diffView`       | rename   |
| `runtime`       | `runtimeView`    | rename   |
| `eventStream`   | `eventStreamView`| rename   |

### 4. Value Filtering Rules

| Condition          | Behavior                  |
|--------------------|---------------------------|
| `undefined`        | omitted from output       |
| `null`             | omitted from output       |
| empty array `[]`   | omitted from output       |
| empty object `{}`  | omitted from output       |
| non-empty value    | included with mapped key  |

Empty detection uses `Object.keys(value).length === 0` for objects. This means:
- `new Date()`, `RegExp`, `Error`, `Promise`, `Map`, `Set` — treated as empty (no own enumerable keys)
- `{ events: [] }` — NOT empty (has own key `events`)
- `[]` — empty (length 0)
- `''`, `0`, `false`, `NaN` — NOT empty (not objects)

### 5. Behavior Guarantees

- **Pure**: no side effects, no I/O
- **Stateless**: no mutable state between calls
- **Deterministic**: same input always produces same output
- **Immutable**: never mutates input, output is always frozen
- **Safe**: unknown keys ignored, `hasOwnProperty` check prevents prototype chain leakage
- **Non-throwing**: returns empty frozen object for any input (undefined, null, primitives, arrays)

---

## Consequences

### Positive

1. **Explicit mapping** — all key renames are documented and enforced in a single place
2. **Pure function** — `map()` is pure, stateless, deterministic
3. **Safe defaults** — all invalid/empty inputs return empty frozen object
4. **No mutation** — input is never modified, output is always frozen
5. **No AI dependencies** — the mapper has zero imports from AI packages
6. **No Runtime dependencies** — the mapper has zero imports from Runtime packages
7. **Extensible** — new mapped keys can be added without breaking changes
8. **220 tests** — comprehensive coverage of all input types, edge cases, and invariants

### Negative

- Deep "semantic" emptiness (e.g., `{ events: [] }`) is not detected — only structural emptiness (no own keys)
- Special objects (Date, RegExp, Error, Promise, Map, Set) with no own enumerable keys are treated as empty

---

## Verification

| Check | Status |
|---|---|
| TypeScript 0 errors | ✓ |
| ESLint 0 errors | ✓ |
| 220 mapper tests pass | ✓ |
| All 3385 tests pass (24 files) | ✓ |
| All 7 bridge keys mapped | ✓ |
| 3 renamed keys (diff→diffView, runtime→runtimeView, eventStream→eventStreamView) | ✓ |
| 4 passthrough keys (overview, trace, timeline, history) | ✓ |
| Empty/null/undefined sections omitted | ✓ |
| Output frozen for all inputs | ✓ |
| No UI changes | ✓ |
| No Runtime changes | ✓ |
| No Planner changes | ✓ |
| No PromptBuilder changes | ✓ |
| No AI package changes | ✓ |
| Architecture version v1.52 | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `apps/web/src/adapters/observatory/mapping/ObservatoryMapper.ts` | New — interface with `map()` method |
| `apps/web/src/adapters/observatory/mapping/DefaultObservatoryMapper.ts` | New — implementation with mapping table and isEmpty filter |
| `apps/web/src/adapters/observatory/mapping/index.ts` | New — barrel exports |
| `apps/web/src/__tests__/ObservatoryMapper.test.ts` | New — 220 tests across 39 sections |
| `docs/adr/ADR-0165-observatory-mapping-layer-foundation.md` | New — this document |