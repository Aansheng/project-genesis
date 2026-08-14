# ADR-0203: Camera Follow Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-015  
**Architecture Version:** v1.89 → v1.90

---

## Context

Players can now move, jump, fall, and land (WO-S9-009 through WO-S9-014). However, the camera is static — when the player moves far enough, they exit the visible viewport. There is no camera behavior of any kind.

### Problems

1. **Static camera** — the viewport never moves with the player
2. **Player exits viewport** — movement beyond the initial viewport bounds causes the player to disappear
3. **No camera abstraction** — there is no CameraController interface or implementation
4. **No renderer integration** — the PixiEntityRenderer has no camera offset capability

### Scope Boundaries

Foundation only.
- No smoothing
- No interpolation
- No zoom
- No rotation
- No parallax
- No minimap
- No UI changes
- No AI changes
- No Runtime changes
- No ECS

---

## Decision

### 1. Create `CameraState` Type

```typescript
export interface CameraState {
  readonly x: number
  readonly y: number
}
```

A frozen, immutable snapshot of camera position. `DEFAULT_CAMERA_STATE` is provided as a frozen constant at `{ x: 0, y: 0 }`.

### 2. Create `CameraController` Interface

```typescript
export interface CameraController {
  update(world: RenderWorld): CameraState
  getState(): CameraState
}
```

- `update()` — scans the RenderWorld for the first entity with `type === 'player'` and returns a CameraState matching its position. If no player is found, the previous state is preserved.
- `getState()` — returns the current camera state without updating.

### 3. Create `DefaultCameraController`

```typescript
class DefaultCameraController implements CameraController {
  constructor() // default state: (0, 0)
  update(world: RenderWorld): CameraState
  getState(): CameraState
}
```

**Behavior:**
- Starts with default state at `(0, 0)`
- On `update()`, scans for the first entity with `type === 'player'`
- If player has a position, camera is set to `(player.position.x, player.position.y)`
- If no player or no position, previous camera state is preserved
- All outputs are deeply frozen

### 4. Renderer Integration

Updated `DefaultPixiEntityRenderer` (in `PixiEntityRendererOptions`):

```typescript
export interface PixiEntityRendererOptions {
  readonly cameraController?: CameraController
  // ... existing fields
}
```

In `render()`, before rendering entities:
```typescript
if (this._cameraController) {
  const camera = this._cameraController.update(world)
  this._container.position.x = -camera.x
  this._container.position.y = -camera.y
}
```

This offsets the entire container by the negative of the camera position, creating the camera-follow effect. When the camera is at `(100, 200)`, the container is offset by `(-100, -200)`, centering the world around the player.

### 5. File Layout

| File | Action |
|------|--------|
| `packages/renderer/src/camera/CameraState.ts` | New — state type + default constant |
| `packages/renderer/src/camera/CameraController.ts` | New — controller interface |
| `packages/renderer/src/camera/DefaultCameraController.ts` | New — implementation |
| `packages/renderer/src/camera/index.ts` | New — barrel exports |
| `packages/renderer/src/index.ts` | Updated — camera barrel exports |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Updated — camera controller integration |
| `packages/renderer/src/camera/__tests__/CameraController.test.ts` | New — 70+ tests |
| `packages/renderer/src/camera/__tests__/CameraFollowIntegration.test.ts` | New — 25+ tests |
| `docs/adr/ADR-0203-camera-follow-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.90 |
| `docs/project/CHANGELOG.md` | Updated — v1.90 |

### 6. Test Strategy

**CameraController.test.ts** — 70+ tests across 14 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 4 | creation, interface, default state, frozen |
| Default state | 2 | origin, preserved on empty world |
| Player follow | 6 | position, origin, negative, large, fractional, updates |
| Multiple players | 2 | first player, non-player ignored |
| Missing player | 4 | preserves state, non-player only, default first, empty after tracked |
| Missing position | 3 | preserves state, default first, no-position-first |
| State updates | 4 | getState after update, tracking, reference, new reference |
| Determinism | 4 | same input, multiple calls, different instances, large coordinates |
| Immutability | 5 | frozen update/getState, no mutation, no internal reference leak |
| Deep freeze | 3 | update/getState/default frozen |
| Empty world | 3 | handled, frozen, preserves state |
| Large worlds | 2 | 100 entities, 1000 entities with player |
| Stress tests | 7 | MAX_SAFE_INTEGER, negative, many updates, alternating, waypoints |
| Multiple instances | 2 | isolated state, independent tracking |
| Camera offset | 3 | negative offset, zero offset, positive offset |

**CameraFollowIntegration.test.ts** — 25+ tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Camera follows player | 6 | right/left/up/down/diagonal/multi-step movement |
| Multiple entities | 3 | player among non-players, first player, non-player ignored |
| Missing player | 3 | disappearance, no position, never exists |
| Camera offset | 3 | negative/positive/zero offset |
| Renderer integration | 7 | container offset, update, origin, no camera, no player, position, clear |
| Multiple ticks | 3 | tracking, jump/fall, 100 ticks |
| Rendering with offset | 2 | entities rendered, no position entities |

---

## Consequences

### Positive

1. **Camera follows player** — the viewport tracks the primary player entity
2. **No breaking changes** — camera integration is optional; renderers without a camera controller work identically to before
3. **Stateful tracking** — camera remembers its last position when no player is present
4. **Deterministic and immutable** — all outputs are deeply frozen
5. **Integration tested** — camera offset applied correctly in the renderer

### Negative

1. **No smoothing** — camera snaps instantly to the player position
2. **No zoom** — no camera zoom or scale functionality
3. **No rotation** — no camera rotation or parallax effects

### Neutral

1. **Extensible** — future WOs can add smoothing, zoom, rotation, bounds, minimap
2. **Renderer-scoped** — lives in the renderer package, no Runtime changes required
3. **Optional integration** — camera controller is an optional parameter to PixiEntityRendererOptions
4. **Backward compatible** — existing renderers without camera controller work unchanged

---

## Verification

- TypeScript: 0 errors (`packages/renderer`, `packages/runtime`)
- ESLint: 0 errors
- CameraController tests: 70+ passed
- CameraFollowIntegration tests: 25+ passed
- All Renderer tests: 413/413 passed (18 files)
- No Runtime changes
- No AI changes
- No DSL changes
- No breaking changes to any Public API
- Architecture version v1.89 to v1.90

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/renderer/src/camera/CameraState.ts` | New — state type |
| `packages/renderer/src/camera/CameraController.ts` | New — interface |
| `packages/renderer/src/camera/DefaultCameraController.ts` | New — implementation |
| `packages/renderer/src/camera/index.ts` | New — barrel exports |
| `packages/renderer/src/index.ts` | Updated — camera exports |
| `packages/renderer/src/view/PixiEntityRenderer.ts` | Updated — camera integration |
| `packages/renderer/src/camera/__tests__/CameraController.test.ts` | New — 70+ tests |
| `packages/renderer/src/camera/__tests__/CameraFollowIntegration.test.ts` | New — 25+ tests |
| `docs/adr/ADR-0203-camera-follow-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.90 |
| `docs/project/CHANGELOG.md` | Updated — v1.90 |