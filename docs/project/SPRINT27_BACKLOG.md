# Sprint 27 — Survival Top-Down Spatial Composition

**Authorization:** Human/CTO priority correction, 2026-08-28
**Architecture boundary:** v1.176 → v1.177
**Current work order:** WO-S27-001
**Status:** FROZEN — Code Complete = YES; Product Verified = YES; Human/CTO
freeze accepted at v1.177
**FROZEN:** YES

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

**Product verification:** PASS. Real Studio evidence confirms the
provider-backed Survival request `生成一个幸存者游戏`, `worldType: survival`,
Arrow Keys-only controls with no Jump, a real top-down X/Y arena, Runtime
position/velocity continuity, no horizon/sky or horizontal Ground strip,
empty browser `warn/error` diagnostics, and actual submitted provider Prompts
for the top-down background, arena-fill terrain, and top-view Player. The
published background, terrain, Player idle/run, and enemy assets reached
`manifest updated → resolved → Renderer applied` and appeared in the real
canvas. Platformer non-regression is also PASS: the existing 7-entity
side-view Mario/Platformer world, Ground/Platform composition, Arrow Keys /
Space controls, horizontal movement, and Runtime Jump integration remain
correctly preserved, as additionally confirmed by Human/CTO real-product
verification. The earlier automated Space observation is classified as
`AUTOMATED INPUT / OBSERVATION LIMITATION`, not a confirmed product
regression. No Jump, collision, controller, or Platformer repair WO is
opened.

## Sprint 27 Gap Analysis Post Product Verification

**Thesis result:** PASS. A user can immediately recognize the generated
Survival world as a top-down game through spatial composition, environment,
terrain usage, and directional Player presentation while the existing
Platformer behavior remains correct.

Measured evidence confirms a provider-backed Survival canvas with a coherent
X/Y arena, top-view assets and Prompt Truth, no sky/horizon/side-view
composition, no horizontal Ground strip, Runtime-authoritative movement, and
four-direction controls. Human/CTO verification confirms that the existing
Mario/Platformer experience remains correct; the earlier automated Space
observation does not constitute a product blocker.

**Conclusion:** No additional measured Spatial & Visual Composition blocker
exists. The Human/CTO decision accepted `SPRINT27_FREEZE_REVIEW`, froze Sprint
27 at v1.177, and separately authorized Sprint 28. Do not create a
polish-only visual-composition WO. Sprint 28's single bounded discovery result
is recorded in `SPRINT28_BACKLOG.md`; Sprint 29 is not entered automatically.

**Non-goals:** Enemy pursuit, offense, weapons/projectiles, spawn/wave/timer/
duration, inventory/ability/XP, Survivor-specific Runtime/Renderer, and
Platformer repair remain outside Sprint 27. The freeze is complete; any
Sprint 28 work is governed by its separately authorized bounded WO.
