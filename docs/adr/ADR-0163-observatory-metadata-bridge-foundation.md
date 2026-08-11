# ADR-0163: Observatory Metadata Bridge Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-020  
**Architecture Version:** v1.49 → v1.50

---

## Context

The Observatory UI currently receives all its data from mock data in `stores/observatoryData.ts` via `DefaultObservatoryAdapter`. The target architecture is for the PromptBuilder's observability metadata to flow through the adapter layer and into the UI components. However, there is no stable abstraction layer between PromptBuilder's metadata format and the adapter's expected input format.

### Problem

1. **No abstraction layer** — there is no contract between PromptBuilder metadata and the Observatory adapter
2. **Tight coupling risk** — directly connecting PromptBuilder metadata to the adapter would create a fragile dependency
3. **No extraction logic** — metadata from PromptBuilder may contain extra fields that are not observatory-related
4. **No isolation** — there is no pure, stateless, deterministic function that extracts observatory-safe sections from metadata

### Scope Boundaries

- No PromptBuilder changes
- No Runtime changes
- No Planner changes
- No AI package behavior changes
- No metadata generation changes
- No prompt changes
- No UI changes
- Foundation only — no connection to PromptBuilder yet

---

## Decision

### 1. Bridge Layer Architecture

Create a new `bridge/` directory under `apps/web/src/adapters/observatory/bridge/` with three files:

```
apps/web/src/adapters/observatory/bridge/
├── ObservatoryBridgeData.ts      # Output type
├── ObservatoryMetadataBridge.ts   # Interface
├── DefaultObservatoryMetadataBridge.ts  # Implementation
└── index.ts                      # Barrel exports
```

### 2. ObservatoryBridgeData

```typescript
export interface ObservatoryBridgeData {
  readonly overview?: unknown
  readonly trace?: unknown
  readonly timeline?: unknown
  readonly history?: unknown
  readonly diff?: unknown
  readonly runtime?: unknown
  readonly eventStream?: unknown
}
```

Design principles:
- **All fields optional** — empty object is always valid
- **All fields `unknown`** — no coupling to PromptAssembly or adapter types
- **`readonly`** — immutable by contract
- **Frozen at runtime** — `Object.freeze()` on every result

### 3. ObservatoryMetadataBridge Interface

```typescript
export interface ObservatoryMetadataBridge {
  adapt(metadata: unknown): ObservatoryBridgeData
}
```

A single-method interface that accepts any metadata and returns a safe bridge data object.

### 4. DefaultObservatoryMetadataBridge

The implementation follows these rules:

| Input | Output |
|---|---|
| `undefined` | `{}` (empty frozen) |
| `null` | `{}` (empty frozen) |
| primitive (string, number, boolean, symbol, bigint) | `{}` (empty frozen) |
| array | `{}` (empty frozen) |
| non-null object | extract known keys only |

Known keys: `overview`, `trace`, `timeline`, `history`, `diff`, `runtime`, `eventStream`

Key behaviors:
- Uses `hasOwnProperty` to check for own properties only (no prototype chain leakage)
- Ignores unknown keys entirely
- Never mutates the input
- Always returns a frozen object
- Stateless — no mutable state between calls
- Deterministic — same input always produces same output
- Pure — no side effects, no I/O, no exceptions for valid inputs

### 5. EMPTY_BRIDGE_DATA Constant

```typescript
export const EMPTY_BRIDGE_DATA: ObservatoryBridgeData = Object.freeze({})
```

A shared frozen empty object used as the return value for all invalid/empty inputs. This is returned directly (same reference) for `undefined`, `null`, and all primitive/array inputs.

---

## Consequences

### Positive

1. **Stable abstraction** — a clear contract between metadata and adapter layers
2. **Pure function** — `adapt()` is pure, stateless, deterministic
3. **Safe defaults** — all invalid inputs return empty object
4. **No mutation** — input is never modified, output is always frozen
5. **No AI dependencies** — the bridge has zero imports from AI packages
6. **No Runtime dependencies** — the bridge has zero imports from Runtime packages
7. **No prototype pollution** — `hasOwnProperty` check prevents prototype chain leakage
8. **Extensible** — new known keys can be added without breaking changes
9. **202 tests** — comprehensive coverage of all input types, edge cases, and invariants

### Negative

- Bridge keys (`runtime`, `eventStream`) do not match adapter keys (`runtimeView`, `eventStreamView`) — a future mapping layer will be needed
- Currently no connection to PromptBuilder — this is foundation only

---

## Verification

| Check | Status |
|---|---|
| TypeScript 0 errors | ✓ |
| ESLint 0 errors | ✓ |
| 202 bridge tests pass | ✓ |
| All 2937 tests pass (22 files) | ✓ |
| Bridge accepts unknown metadata | ✓ |
| Bridge returns ObservatoryBridgeData | ✓ |
| Pure, stateless, deterministic | ✓ |
| Immutable output | ✓ |
| No Runtime changes | ✓ |
| No Planner changes | ✓ |
| No PromptBuilder changes | ✓ |
| No AI package changes | ✓ |
| No UI changes | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `apps/web/src/adapters/observatory/bridge/ObservatoryBridgeData.ts` | New — interface and EMPTY_BRIDGE_DATA constant |
| `apps/web/src/adapters/observatory/bridge/ObservatoryMetadataBridge.ts` | New — interface with `adapt()` method |
| `apps/web/src/adapters/observatory/bridge/DefaultObservatoryMetadataBridge.ts` | New — implementation |
| `apps/web/src/adapters/observatory/bridge/index.ts` | New — barrel exports |
| `apps/web/src/__tests__/ObservatoryMetadataBridge.test.ts` | New — 202 tests across 38 sections |