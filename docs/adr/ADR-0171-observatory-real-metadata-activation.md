# ADR-0171: Observatory Real Metadata Activation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-028  
**Architecture Version:** v1.57 → v1.58

---

## Context

The Observatory data pipeline has been built incrementally across Sprint 6:

1. **WO-S6-020/021** — `ObservatoryMetadataBridge` extracts known sections from raw metadata
2. **WO-S6-022/023** — `ObservatoryMapper` maps bridge key names to adapter key names
3. **WO-S6-024/025** — `PromptObservatoryMetadata` contract + consumption in store
4. **WO-S6-026/027** — `PromptObservatoryMetadataEmitter` consumption in `DefaultPromptBuilder`
5. **WO-S6-028A** — Architecture review concluded: **Hydrator unnecessary**

### Current State

- The store (`observatoryData.ts`) has a `loadBridgeData(metadata)` method that chains Bridge → Mapper → Adapter → ViewModel
- The store initializes via `loadMockObservatory()` — the real metadata path exists but is not the primary path
- The name `loadBridgeData` is implementation-focused (describes *how* data is loaded, not *what* it is)

### Problem

1. **Real metadata path is secondary** — `loadMockObservatory()` is the de facto initialization, `loadBridgeData` is an alternative
2. **Misleading name** — `loadBridgeData` describes the implementation detail (Bridge layer) rather than the business intent (real metadata)
3. **No architecture decision recorded** — the Hydrator review concluded hydration is unnecessary, but this decision is not captured in an ADR

### Architecture Review Finding (WO-S6-028A)

The existing pipeline provides complete hydration:

```
PromptBuilder Metadata → Bridge → Mapper → Adapter → Store → UI
```

The Adapter already validates every data section independently with safe defaults. Adding a Hydrator would duplicate existing logic. The pipeline is correct and complete as-is.

---

## Decision

### 1. Rename `loadBridgeData` → `loadRealObservatory`

The primary method for loading Observatory data is renamed to reflect its purpose:

| Before | After |
|--------|-------|
| `loadBridgeData(metadata: unknown)` | `loadRealObservatory(metadata: unknown)` |

The new name communicates *what* the method does (load real observatory data), not *how* it does it (via the Bridge layer).

### 2. Make `loadRealObservatory` the Primary Path

The store's API is reordered so that `loadRealObservatory` is documented and exposed as the primary initialization path. `loadMockObservatory` remains available as a fallback for testing and development.

### 3. Preserve Mock Path

`loadMockObservatory()` is retained unchanged. The mock path is valuable for:
- Local development without a running backend
- UI component testing with deterministic data
- Regression testing of the full pipeline

### 4. Pipeline Architecture

No changes to the existing pipeline architecture:

```
Real Metadata (unknown)
  ↓
ObservatoryMetadataBridge     — key extraction, safety boundary
  ↓
ObservatoryMapper              — key rename (3→adapter keys)
  ↓
ObservatoryAdapter             — validation, ViewModel production
  ↓
Pinia Store (observatoryData.ts) — reactive ownership
  ↓
UI Components
```

No Hydrator added. No new transformation layers. No additional abstractions.

### 5. Behavior Guarantees

| Property | Guarantee |
|----------|-----------|
| Pure | No side effects, no I/O |
| Stateless | No mutable state between calls |
| Deterministic | Same input produces same output |
| Immutable | Input never mutated, output frozen where applicable |
| Defensive | Handles null, undefined, invalid input gracefully |
| Mock fallback | `loadMockObservatory()` always available |

---

## Consequences

### Positive

1. **Clear primary path** — `loadRealObservatory` is the canonical way to load Observatory data
2. **Intent-revealing name** — no implementation detail in the public API
3. **Mock path preserved** — no breaking changes for existing callers
4. **No Hydrator debt** — architecture review recommendation is followed
5. **Backward compatible** — existing tests continue to pass with updated method name

### Negative

1. **Rename breaks existing callers** — any code using `loadBridgeData` must be updated to `loadRealObservatory` (only the existing consumption test is affected)

### Neutral

1. **Internal API rename** — the store is not externally consumed beyond the web package
2. **No UI changes** — Vue components consume `viewModel` ref, not the load method directly

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- All existing tests pass (including updated `ObservatoryMetadataBridgeConsumption.test.ts`)
- New test file: `ObservatoryRealMetadataActivation.test.ts` — 40+ focused tests
- No Hydrator introduced
- Bridge → Mapper → Adapter → Store pipeline preserved
- Mock path preserved

---

## Files Created/Modified

| File | Action |
|------|--------|
| `apps/web/src/stores/observatoryData.ts` | Modified — renamed `loadBridgeData` → `loadRealObservatory`, updated JSDoc, made primary path |
| `apps/web/src/__tests__/ObservatoryMetadataBridgeConsumption.test.ts` | Modified — all `loadBridgeData` references replaced with `loadRealObservatory`, section headers updated |
| `apps/web/src/__tests__/ObservatoryRealMetadataActivation.test.ts` | New — 40+ focused tests covering real metadata activation, mock fallback, replacement, invalid, partial, immutable |
| `docs/adr/ADR-0171-observatory-real-metadata-activation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.58, WO-S6-028 |
| `docs/project/CHANGELOG.md` | Updated — v1.58, WO-S6-028 |