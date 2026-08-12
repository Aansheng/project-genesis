# ADR-0170: PromptBuilder Observatory Metadata Emission Consumption

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-027  
**Architecture Version:** v1.56 → v1.57

---

## Context

The Observatory metadata emission pipeline was created in WO-S6-026 (ADR-0169) with `PromptObservatoryMetadataEmitter` and `DefaultPromptObservatoryMetadataEmitter`, but the emitter is not yet connected to `DefaultPromptBuilder`. The Observatory still relies entirely on mock data.

### Problem

1. **No PromptBuilder integration** — `PromptObservatoryMetadataEmitter` exists but is not consumed
2. **No emission path** — `PromptBuilder` never emits Observatory metadata
3. **Observatory still on mock data** — the entire pipeline from emission to UI depends on this integration
4. **Phase gap** — there is no phase between `observatorySnapshot` (0.9599779) and `strategyResolver` (0.96) for metadata emission

### Previous Consumption Patterns

The BuilderOptions + Phase insertion pattern has been established in prior work orders:

- **WO-S5-003** — `intentAnalyzer` in BuilderOptions + Phase consumption
- **WO-S5-067** — `promptAssemblyTimelineBuilder` in BuilderOptions + Phase 0.95996
- **WO-S5-095** — `promptAssemblyObservatorySnapshotBuilder` in BuilderOptions + Phase 0.9599779
- **WO-S6-027** (this ADR) — `promptObservatoryMetadataEmitter` in BuilderOptions + Phase 0.959978

### Scope Boundaries

- Metadata only — no prompt output changes
- No Runtime changes
- No Planner changes
- No Pipeline changes
- No AgentLoop changes
- No Bridge changes
- No Mapper changes
- No Store changes
- No UI changes

---

## Decision

### 1. Add `promptObservatoryMetadataEmitter` to `BuilderOptions`

```typescript
import type { PromptObservatoryMetadataEmitter } from '../observatory'

export interface BuilderOptions {
  // ...existing fields...

  /**
   * Optional PromptObservatoryMetadataEmitter (defaults to undefined — no metadata emission).
   * Since WO-S6-027.
   */
  promptObservatoryMetadataEmitter?:
    PromptObservatoryMetadataEmitter
}
```

### 2. Wire through `DefaultPromptBuilder`

**Private field:**
```typescript
private readonly promptObservatoryMetadataEmitter?:
  PromptObservatoryMetadataEmitter
```

**BuilderOptions constructor path:**
```typescript
this.promptObservatoryMetadataEmitter =
  opts.promptObservatoryMetadataEmitter
```

**Legacy constructor path:**
```typescript
this.promptObservatoryMetadataEmitter = undefined
```

### 3. Insert Phase 0.959978

Between Phase 0.9599779 (observatorySnapshot) and Phase 0.96 (strategyResolver):

```typescript
// Phase 0.959978: PromptObservatoryMetadataEmitter — emit typed metadata contract
let observatoryMetadata:
  | PromptObservatoryMetadata
  | undefined

if (this.promptObservatoryMetadataEmitter !== undefined) {
  observatoryMetadata =
    this.promptObservatoryMetadataEmitter.emit(
      promptAssemblyMetadata,
    )
}
```

### 4. Store in metadata output

Using additive spread pattern (never overwrites existing metadata):

```typescript
...(observatoryMetadata !== undefined
  ? { observatoryMetadata }
  : {}),
```

### 5. Flow

```
PromptBuilder.build()
    ↓
Phase 0.9599779: observatorySnapshot
    ↓
Phase 0.959978: Emitter.emit(promptAssemblyMetadata)
    ↓
PromptObservatoryMetadata (frozen contract)
    ↓
Stored at metadata.promptAssembly.observatoryMetadata
    ↓
Phase 0.96: strategyResolver
```

### 6. Behavior Guarantees

| Property | Guarantee |
|----------|-----------|
| Pure | No side effects, no I/O |
| Stateless | No mutable state between calls |
| Deterministic | Same input always produces same output |
| Additive spread | Never overwrites existing metadata |
| No prompt changes | Prompt output is identical with/without emitter |
| Frozen output | Result is frozen via `Object.freeze()` |

---

## Consequences

### Positive

1. **First PromptBuilder integration** — the emitter is now consumed by DefaultPromptBuilder
2. **Metadata only** — no prompt output changes, backward compatible
3. **Additive spread** — existing metadata keys are preserved
4. **Phase 0.959978** — correctly positioned between snapshot and strategy resolver
5. **320+ tests** — comprehensive coverage of all integration points

### Negative

1. **One additional phase** — Phase 0.959978 adds to the phase sequence
2. **Additional test surface** — 320 new tests

### Neutral

1. **Internal implementation detail** — the emitter is an internal component
2. **No public API changes** — existing exports continue unchanged

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 320 tests passing in `packages/ai/src/__tests__/PromptObservatoryMetadataEmissionConsumption.test.ts`
- All existing AI package tests continue to pass
- No PromptBuilder changes (additive only)
- No Runtime changes
- No UI changes

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/prompt/BuilderOptions.ts` | Modified — added `promptObservatoryMetadataEmitter` field |
| `packages/ai/src/prompt/DefaultPromptBuilder.ts` | Modified — wired emitter, Phase 0.959978, metadata spread |
| `packages/ai/src/__tests__/PromptObservatoryMetadataEmissionConsumption.test.ts` | New — 320 tests |
| `docs/adr/ADR-0170-prompt-observatory-metadata-emission-consumption.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.57, WO-S6-027 |
| `docs/project/AI_ARCHITECTURE.md` | Updated — v1.57 header |
| `docs/project/CHANGELOG.md` | Updated — v1.57, WO-S6-027 |