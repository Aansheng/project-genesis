# ADR-0222: Observatory Studio Integration Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-008
- Architecture Version: v1.108 → v1.109

## Decision

Add a Studio-local `entity | observatory` mode to `InspectorPanel`. The
Observatory mode is a compact presentation of the existing
`ObservatoryRuntimeBinding → observatoryData → ObservatoryViewModel` path;
it does not add a Store or copy Runtime state. `RuntimeWorldStore`, owned by
`gameStore`, remains authoritative.

Only Runtime data is rendered as live data. Trace, Timeline, History, Diff,
and Event Stream explicitly show unavailable states because no real production
source is connected. The full `/observatory` route remains the deep SPA view.

The Inspector binding continues to synchronize on the existing
`gameStore.renderVersion` signal, so runtime changes update the compact panel
without polling or rebuilding data every animation frame.

## Audit

| Section | Production status |
| --- | --- |
| Overview | Empty/partial: no real overview source in the Studio path |
| Trace | Empty: no real trace source |
| Timeline | Empty: no real timeline source |
| History | Empty: no real history source |
| Diff | Empty: no real diff source |
| Runtime | Real: RuntimeWorldStore-backed entities, ids, types, components, positions |
| Event Stream | Empty: no real event stream source |

## Consequences

- Entity inspection remains the default and unchanged.
- Studio users can inspect the current runtime without leaving the workspace.
- Switching to `/observatory` preserves the existing SPA session and world.
- No tracing architecture, filtering, AI command stages, or Runtime ownership
  is introduced.
