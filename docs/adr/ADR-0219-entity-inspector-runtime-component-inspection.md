# ADR-0219: Entity Inspector Runtime Component Inspection

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-005
- Architecture Version: v1.105 to v1.106

## Decision

Genesis Studio keeps `selectedEntityId` as the only Inspector selection state.
The selected entity and all component values are resolved on render from the
authoritative `RuntimeWorldStore`; no entity or component snapshot is copied
into a long-lived UI store.

The Studio Inspector presents three read-only sections:

1. Entity summary: id, type, and component count.
2. Position: the authoritative `PositionComponent` x/y values.
3. Components: all RuntimeComponents in deterministic runtime order, with the
   PositionComponent moved first when present.

`RuntimeComponentInspector` is a Web-only generic property renderer. It turns
property objects into bounded, indented key/value rows. Primitive values,
null/undefined, primitive arrays, nested objects, and nested arrays are handled
without raw JSON as the primary UI. Recursion is capped at four levels and
deeper values receive a restrained fallback label.

The Inspector remains read-only. It does not add, remove, rename, edit, or
mutate Runtime entities or components. World replacement and runtime ticks
continue to flow through the existing `renderVersion` invalidation and
`selectedEntity` computed lookup.

## Consequences

- Player and future custom components can be inspected without component-
  specific UI branches.
- Inspector values follow current RuntimeWorldStore data after movement and
  world replacement.
- Observatory remains unchanged and continues using its own ViewModel path.
- Property editing, schemas, persistence, and JSON-editor behavior remain out
  of scope.
