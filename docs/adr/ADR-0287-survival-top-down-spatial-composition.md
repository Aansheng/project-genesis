# ADR-0287 — Survival Top-Down Spatial Composition

**Status:** Accepted
**Date:** 2026-08-28
**Architecture version:** v1.176 → v1.177
**Work order:** WO-S27-001

## Context

Human/CTO priority correction authorizes Sprint 27 to repair the Survival
visual/spatial read. The earlier Sprint 26 path already reaches `survival` and
selects generic four-direction motion, but source tracing found that the
visual pipeline still defaults to a side-view composition:

- visual and asset builders request `side` assets, `jump` state, and
  `ground-repeat-x` scenery;
- the Survival controller's vertical delta is written directly to Position,
  so the Renderer cannot derive four-way direction from Runtime velocity;
- the environment Renderer treats resolved terrain as a horizontal ground
  strip and does not render a two-dimensional arena surface.

## Decision

Add one bounded shared contract, `WorldSpatialMode = 'side-view' | 'top-down'`,
resolved from the existing semantic `WorldType`. Only `survival` resolves to
`top-down`; all other worlds retain the established `side-view` fallback.

At the existing package boundaries:

1. Shared visual and asset specifications carry the optional spatial mode.
2. Survival asset requirements use top-view character/environment intent,
   `idle/run` Player states, and `arena-fill` terrain usage. `run` remains the
   existing moving presentation state; no animation-state framework is added.
3. The generic Player controller gains an opt-in `velocity-vector` mode. The
   Survival Web composition selects it so Runtime Position remains integrated
   by the existing motion system and Runtime Velocity exposes both axes.
   Platformer keeps `axis-delta` behavior unchanged.
4. The Runtime→Renderer adapter projects `spatialMode`, `run/idle`, and a
   four-way Player direction from Runtime velocity.
5. Pixi renders top-down actor sprites centered and rotates them from that
   direction. A resolved `arena-fill` asset becomes a camera-visible,
   repeatable X/Y environment surface. A semantic Ground/Platform plane is
   not drawn as a horizontal strip; terrain props remain entity visuals.
6. The existing Prompt Truth request path receives explicit spatial, view,
   terrain, horizon, and repeatability constraints.

Runtime geometry and collision remain authoritative. Image dimensions and
asset prompts never create gameplay bounds. No Survivor-specific Runtime,
engine, manager, genre renderer, camera manager, or enemy-pressure system is
introduced.

## Consequences

Survival can be evaluated as a coherent top-down arena through the existing
Natural Language → Semantic World → Game DSL → Runtime → Renderer path, while
Mario/platformer behavior and legacy manifests retain their existing fallback.
The shared contract is deliberately small; future world types must not be
changed without a new measured product decision.

The `arena-fill` asset is a visual skin only. Its repeat composition follows
the viewport/camera rectangle and existing visual catalog scale, not image
pixels or collision geometry.

## Verification

Automated evidence is required for:

- Survival four-axis Runtime velocity and adapter direction;
- no top-down Player `jump` state;
- top-view/arena-fill asset requirements and Prompt Truth prompts;
- top-down actor rotation and two-axis arena tiling;
- unchanged Platformer system/control behavior.

Product verification must use the real Studio path and observe Survival
worldType, Arrow Keys-only controls, four directional response, top-down
environment, no Mario horizon/ground strip, Runtime geometry continuity,
submitted spatial Prompt Truth, and clean console diagnostics. This ADR does
not authorize starting Sprint 28 or enemy pursuit work.
