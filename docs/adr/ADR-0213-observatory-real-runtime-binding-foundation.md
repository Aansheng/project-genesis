# ADR-0213: Observatory Real Runtime Binding Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S10-011

## Context

The Observatory production path initialized fixed mock farm/runtime data from
`ObservatoryOverview.vue`. `loadRealObservatory()` existed but was not called by
the Web application, and Observatory had no access to `RuntimeWorldStore`.

## Decision

Add a thin `ObservatoryRuntimeBinding` that reads the authoritative
`RuntimeWorldStore` and calls `loadRuntimeWorld()` on the existing Observatory
data store. The store adapts the current Runtime world through the existing
`DefaultObservatoryAdapter` contract, exposing entity ids, types, components,
and PositionComponent coordinates.

Production no longer hydrates mock data. As of WO-OBS-001, the demo payload is
isolated under the Vitest fixture boundary; the compatibility
`loadMockObservatory()` hook has no production payload or fallback.
Unsupported sections remain empty rather than falling back to unrelated mock
records.

## Consequences

- Runtime panel reflects the current generated world and replacements.
- RuntimeWorldStore remains the only source of truth for current runtime data.
- Trace, Timeline, History, Diff, and Event Stream are honestly empty until real
  sources are connected.
- No Observatory UI redesign or new tracing architecture is introduced.

## Verification

Binding tests cover MarioWorld entities, components, positions, replacements,
repeated sync, immutability, empty worlds, and explicit mock compatibility.

## WO-OBS-001 truth audit addendum

Overview now reads current Runtime, latest generation diagnostics, current
visual operations, and the AssetManifest directly from their existing session
stores. World Graph is a read-only projection of the bound Runtime entities.
The stale static Execution Graph is retired. Unsupported Trace, Timeline,
History, Diff, and Event Stream surfaces show explicit empty states. No new
session authority or architecture contract was introduced; architecture remains
v1.141.
