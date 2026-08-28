# Sprint 27 — Survival Top-Down Spatial Composition

**Authorization:** Human/CTO priority correction, 2026-08-28
**Architecture boundary:** v1.176 → v1.177
**Current work order:** WO-S27-001
**Status:** CODE_COMPLETE — Product Verification BLOCKED/PENDING

## First action — repository-grounded Gap Analysis

The current production chain is:

`StudioCommandBar → gameStore → CreateWorldPipeline → semantic World → Game DSL → RuntimeWorldStore → Runtime systems → RuntimeRendererAdapter → Pixi environment/entity Renderers`.

The repository already proves the Survival classification and generic
two-axis motion. The exact missing capability is the spatial presentation
contract:

1. `GameWorldModel` has `WorldType` but no bounded spatial mode. The Web
   motion profile is the only Survival-specific selection point.
2. `DefaultVisualDesignSpecificationBuilder` and
   `DefaultAssetSpecificationBuilder` default every asset to side view;
   Player requirements include `jump`; terrain uses `ground-repeat-x`.
3. The Survival controller writes vertical input into Position directly while
   leaving `Velocity.y` unchanged. The adapter therefore cannot distinguish
   top-down up/down movement from a platformer jump presentation.
4. `PixiEnvironmentRenderer` renders resolved terrain as a horizontal
   camera-visible ground material. It has no world-level two-dimensional
   arena target, and its background prompt requests sky/horizon scenery.
5. Visual evolution reconstructs design/context snapshots, so a theme update
   could otherwise drop any new spatial intent.

The smallest coherent slice is one reusable `WorldSpatialMode` contract,
Survival-only mapping, opt-in generic vector velocity, Runtime-derived
four-way direction, top-view asset/prompt semantics, and a repeatable
camera-visible `arena-fill` surface. This keeps Runtime geometry authoritative
and leaves Platformer on its existing path.

## WO-S27-001 — Survival Top-Down Spatial Composition

**Measured bottleneck:** Survival is mechanically reachable but still visually
reads as a side-view platformer because spatial intent is absent from the
visual/asset contract, vertical Runtime velocity is not exposed, and terrain
composition is a horizontal strip.

**Expected before → after:**

- Before: Survival selects top-down motion but requests side-view assets,
  exposes a jump-shaped presentation for Y movement, and composes a
  ground/horizon scene.
- After: Survival carries `top-down` through design → assets → Prompt Truth →
  Runtime adapter → Pixi composition; Player responds in four directions,
  environment is a coherent X/Y arena, and Ground/Platform strips are absent.

**Allowed:** existing Shared contracts, AI visual/asset builders, image
generation request/context prompt assembly, generic Runtime controller option,
existing Web motion composition and viewport adapter wiring, existing Pixi
entity/environment renderers, focused tests, ADR/state/changelog updates.

**Forbidden:** SurvivorRuntime/Engine/Manager, genre-specific Runtime or
Renderer, CameraManager, new camera architecture, enemy pursuit/offense,
weapons/projectiles, spawn/wave/timer/duration, inventory/ability/XP systems,
animation-state framework, image-pixel geometry, legacy reconnection/deletion,
and Platformer behavior changes.

**Acceptance:**

- `worldType: survival` is the only current mapping to `top-down`;
- Runtime remains the Position/Velocity/geometry authority;
- Survival uses Arrow Keys in four directions and no Jump control;
- top-down Player presentation uses `idle/run`, derives direction from
  Runtime velocity, and has no `jump` state;
- asset requirements use `view: top`, `arena-fill`, and explicit no-horizon /
  no-sky / repeat-X-and-Y prompts;
- Pixi composes a camera-visible X/Y arena, centered/rotated actor presentation,
  and no horizontal Ground/Platform strip;
- Platformer retains its six-system composition and existing side-view assets;
- visual evolution preserves spatial intent across theme/time updates;
- Prompt Truth shows the actual submitted spatial semantics and console is
  clean on the real Studio path.

**Automated checks:** targeted Shared/AI/Runtime/Renderer/Web tests; affected
package TypeScript checks; ESLint; full affected-package regressions; Web
build; `git diff --check`.

**Product verification:** BLOCKED/PENDING. Real Studio evidence now confirms
the provider-backed Survival request `生成一个幸存者游戏`, `worldType:
survival`, Arrow Keys-only controls with no Jump, a real top-down X/Y arena,
Runtime position/velocity continuity, no horizon/sky or horizontal Ground
strip, empty browser `warn/error` diagnostics, and actual submitted provider
Prompts for the top-down background, arena-fill terrain, and top-view Player.
The published background, terrain, Player idle/run, and enemy assets reached
`manifest updated → resolved → Renderer applied` and appeared in the real
canvas. The requested fresh Platformer smoke generated the existing 7-entity
side-view world and preserved Arrow Keys/Space Jump controls, but Space did
not produce a real-browser Y transition from the grounded Player (`y:400`),
even after Browser and local Chrome input attempts; ArrowRight did move the
Player (`x:80→86`). Existing Platformer Runtime/Jump integration tests pass,
so this turn does not infer a manual product PASS from tests. Do not mark the
WO DONE or enter freeze review until the real Platformer Jump/collision smoke
is observed; no new product code or WO is opened by this verification turn.

**Non-goals:** If this slice passes, freeze Sprint 27 for Human/CTO review;
do not automatically begin Sprint 28 or enemy pursuit.
