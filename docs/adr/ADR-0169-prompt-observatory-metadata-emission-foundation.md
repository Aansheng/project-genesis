# ADR-0169: PromptBuilder Observatory Metadata Emission Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-026  
**Architecture Version:** v1.55 → v1.56

---

## Context

The Observatory pipeline is architecturally complete:

```
PromptObservatoryMetadataBuilder
    ↓
PromptObservatoryMetadata
    ↓
Bridge
    ↓
Mapper
    ↓
Store
    ↓
Adapter
    ↓
ViewModel
    ↓
UI
```

However, `PromptObservatoryMetadata` is **never produced** — the Observatory still relies entirely on mock data. There is no emission layer inside AI Core that generates Observatory metadata.

### Problem

1. **No emission path** — `PromptObservatoryMetadata` is typed but never instantiated
2. **No emitter abstraction** — no pure function exists to bridge raw metadata with the typed contract
3. **Foundation dependency** — downstream work orders for PromptBuilder integration depend on this layer
4. **First official emission point** — this is the entry point for all future Observatory metadata generation

### Previous Emission Patterns

The emission+consumption pattern has been established in prior work orders:

- **WO-S6-024** (ADR-0167): Prompt Observatory Metadata Contract Foundation — created `PromptObservatoryMetadata` + `PromptObservatoryMetadataBuilder`
- **WO-S6-025** (ADR-0168): Prompt Observatory Metadata Consumption — consumed metadata via the Bridge
- **WO-S6-026** (this ADR): Creates the emission layer that produces `PromptObservatoryMetadata`

### Scope Boundaries

- Foundation only — no PromptBuilder integration yet
- No PromptBuilder changes
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

### 1. Create `PromptObservatoryMetadataEmitter` Interface

```typescript
export interface PromptObservatoryMetadataEmitter {
  emit(metadata: Record<string, unknown>): PromptObservatoryMetadata
}
```

### 2. Create `DefaultPromptObservatoryMetadataEmitter` Implementation

```typescript
export class DefaultPromptObservatoryMetadataEmitter
  implements PromptObservatoryMetadataEmitter
{
  private readonly builder: PromptObservatoryMetadataBuilder

  constructor(builder?: PromptObservatoryMetadataBuilder) {
    this.builder = builder ?? new DefaultPromptObservatoryMetadataBuilder()
  }

  emit(metadata: Record<string, unknown>): PromptObservatoryMetadata {
    return this.builder.build(metadata)
  }
}
```

### 3. Flow

```
raw metadata (Record<string, unknown>)
    ↓
DefaultPromptObservatoryMetadataEmitter.emit()
    ↓
DefaultPromptObservatoryMetadataBuilder.build()
    ↓
PromptObservatoryMetadata (frozen, typed contract)
```

### 4. Behavior

| Property | Guarantee |
|----------|-----------|
| Pure | No side effects, no I/O |
| Stateless | No mutable state between calls |
| Deterministic | Same input always produces same output |
| Frozen output | Result is always frozen via `Object.freeze()` |
| No mutation | Input is never modified |
| Non-throwing | Returns empty frozen object for any input |

### 5. Builder Delegation

- The emitter **delegates entirely** to `PromptObservatoryMetadataBuilder`
- `builder.build()` is called **exactly once** per `emit()` call
- `builder` is injectable via constructor (defaults to `DefaultPromptObservatoryMetadataBuilder`)
- The emitter **does not filter** or transform the builder output

### 6. Exports

**`packages/ai/src/observatory/index.ts`**:
```typescript
export type { PromptObservatoryMetadataEmitter } from './PromptObservatoryMetadataEmitter'
export { DefaultPromptObservatoryMetadataEmitter } from './DefaultPromptObservatoryMetadataEmitter'
```

**`packages/ai/src/index.ts`**:
```typescript
export type { PromptObservatoryMetadataEmitter } from './observatory'
export { DefaultPromptObservatoryMetadataEmitter } from './observatory'
```

---

## Consequences

### Positive

1. **First official emission path** — raw metadata → emitter → `PromptObservatoryMetadata`
2. **Thin delegation layer** — emitter delegates to builder, adding no complexity
3. **Injectable builder** — custom builders for testing or transformation
4. **All guarantees inherited** — purity, determinism, immutability, statelessness come from the builder
5. **Foundation for integration** — downstream PromptBuilder integration (WO-S6-027+) can now consume the emitter

### Negative

1. **One more abstraction** — the emitter adds a thin layer over the builder
2. **Additional test surface** — 282 new tests to verify emitter behavior

### Neutral

1. **Internal AI package detail** — the emitter is an internal component of the AI package
2. **No public API changes** — existing exports continue unchanged

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 282 tests passing in `packages/ai/src/__tests__/PromptObservatoryMetadataEmissionFoundation.test.ts`
- All existing 8110 AI package tests continue to pass
- All existing web package tests continue to pass
- No PromptBuilder changes
- No Runtime changes
- No UI changes

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/observatory/PromptObservatoryMetadataEmitter.ts` | New |
| `packages/ai/src/observatory/DefaultPromptObservatoryMetadataEmitter.ts` | New |
| `packages/ai/src/observatory/index.ts` | Modified — added emitter exports |
| `packages/ai/src/index.ts` | Modified — added emitter exports |
| `packages/ai/src/__tests__/PromptObservatoryMetadataEmissionFoundation.test.ts` | New — 282 tests |
| `docs/adr/ADR-0169-prompt-observatory-metadata-emission-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.56, WO-S6-026 |
| `docs/project/AI_ARCHITECTURE.md` | Updated — v1.56 header |
| `docs/project/CHANGELOG.md` | Updated — v1.56, WO-S6-026 |