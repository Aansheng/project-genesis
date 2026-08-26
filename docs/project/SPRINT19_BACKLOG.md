# Sprint 19 Backlog — Animated Entity Presentation

Sprint 18 is FROZEN at v1.164. Human/CTO authorized Sprint 19 on 2026-08-25.
Sprint 19 is now **FROZEN at v1.167** after the 2026-08-26 Freeze Review.
Sprint 20 is not entered automatically.

## Product Objective

Prove the smallest real Player presentation loop in which Renderer derives
idle, moving, airborne, and facing presentation from authoritative Runtime
behavior. AI supplies visual assets; Runtime does not receive animation state
from AI or image pixels.

## Pre-Animation Asset-Reuse Audit

**PASS — existing capability, no new reuse WO.**

`AssetGenerationPolicy.visualGenerationIdentity()` groups eligible requests by
semantic visual identity rather than entity ID. `groupAiGenerationRequirements()`
emits one canonical provider request for equivalent requirements, and
`VisualAssetEvolutionExecutor` binds its one generated URI back to every
equivalent entity asset. Existing regression proves three equivalent Sheep
Runtime entities result in one image generation and three manifest bindings;
different archetypes remain separate. Renderer then creates independent views
per Runtime entity. This establishes Runtime Entity Identity != Visual Asset
Identity without an AssetManager or universal cache.

## Fresh Player Presentation Gap Analysis

Player requirements already declare `idle`, `run`, and `jump`, but the current
asset/manifest path creates one entity asset and the Render projection carries
only id/type/semanticName/position. PixiEntityRenderer consequently displays
one static image regardless of Runtime velocity or grounded behavior. The
smallest Sprint 19 blocker is a bounded Player state-asset and Runtime-derived
presentation selection slice; provider spritesheet capability is unproven, so
the first proof must use separate state images rather than a spritesheet.

## WO-S19-001 — Runtime-Derived Player Presentation State Assets

Status: **DONE — Code Complete = YES; Product Verified = YES (2026-08-26)**

Scope: one Player only; separate idle/run/jump image assets; Runtime velocity
and grounded truth projected to Renderer; state selection and horizontal mirror
where safe; real Studio product verification.

Forbidden: AnimationManager/Engine, universal state-machine, BlendTree,
spritesheet pipeline, skeletal/attack/death/hurt animation, all-entity rollout,
or Runtime gameplay/collision behavior change.

Implementation status: independent `idle`/`run`/`jump` generation identity and
request prompts are wired; `presentationState` and `renderUsage` are preserved
through context and manifest evolution; Runtime velocity derives the bounded
state; Renderer selects state entries, preserves async upgrades after later
render ticks, and mirrors left-facing sprites. The production reachability
repair writes `Velocity.x`, preserves existing motion/jump/collision authority,
clears x on release, and adds a real registered input → Runtime → adapter →
Renderer reachability regression. Real Studio Product Verification passed all
nine required observations on 2026-08-26: stationary idle, right run,
stop-to-idle, left run with correct mirror, jump, land-while-moving run,
post-landing idle, gameplay continuity, and clean browser console. The run
pose was also observed to remain one static image sliding through the world;
that is the measured next Sprint 19 blocker.

## Fresh Sprint 19 Gap Analysis — Post-WO-S19-001

Status: **DONE — one next bounded WO generated**

Measured result: verified capabilities are Runtime-derived `idle` / `run` /
`jump` state switching, horizontal facing/mirroring, real input reachability,
landing/stop continuity, and clean gameplay diagnostics; Sprint acceptance
still requires visibly temporal Player movement. The real Studio observation
shows that `run` is one static pose sliding through the world, so true visible
multi-frame movement animation is a measured `PRODUCT_GAP` with a bounded
asset/Renderer `ARCHITECTURE_GAP`. The smallest repository-grounded slice is
two independent Player run images plus Renderer-local tick alternation through
the existing manifest and render loop. Provider spritesheet capability,
AnimationManager, universal state machines, and skeletal animation are
unproven and excluded.

Separate Problem Register entry: Player can currently pass through generated
Platform geometry. This remains a separately measured product defect and is
not included in Sprint 19 unless the current Sprint product goal requires it.

## WO-S19-002 — Bounded Player Run-Frame Presentation

Status: **DONE — Code Complete = YES; Product Verified = YES (2026-08-26)**

State transition: `GENERATED_AFTER_WO-S19-001_PRODUCT_VERIFICATION → READY →
IN_PROGRESS → VERIFYING`

Priority: P0

Dependencies: WO-S19-001 DONE; fresh real Studio measurement above

Architecture before: v1.166

Architecture expected/after: v1.167 — bounded Player `presentationFrame`
metadata through existing asset contracts and Player-only Renderer tick
selection

Mission: Close the measured static-run-pose blocker with the smallest real
temporal movement proof while keeping Runtime state and geometry authority
unchanged.

Measured bottleneck: `idle` / `run` / `jump` state selection is Product Verified,
but sustained horizontal movement still shows one static run pose. This is the
smallest blocker because the Sprint 19 product question is visible Player
movement, and the repository already has separate state assets, manifest
selection, and a render tick but no frame identity or frame selection.

Allowed scope: bounded optional `presentationFrame` metadata in the existing
Shared asset requirement/manifest/image request/context/operation contracts;
exactly two independent Player run-frame requirements and deterministic
generation identity/prompt differentiation; existing targeted manifest binding;
Player-only Renderer tick alternation with async replacement and primitive
fallback; focused Shared/AI/Renderer/Web regressions; required Studio product
verification.

Forbidden scope: AnimationManager/Engine, universal animation state machines,
BlendTree, spritesheets/atlases, skeletal animation, interpolation, attack /
death / hurt states, all-entity rollout, Runtime gameplay/collision changes,
image-derived gameplay, durable generated-asset storage, generic asset cache,
Platform collision repair, or Sprint 20 entry.

Implementation boundaries: Shared owns the provider-neutral frame metadata;
AI/Web owns the two Player run requirements, distinct grouping, prompt/context
propagation, and manifest preservation; Renderer owns only Player run-frame
selection at render ticks. Runtime continues to own `idle` / `run` / `jump`,
velocity, facing, motion, and geometry.

Acceptance: two distinct Player run-frame assets can complete through the
existing provider → manifest → AssetStore → Pixi path; while authoritative
horizontal velocity is non-zero, the visible Player alternates between those
two assets; idle/jump/state selection, left mirror, landing/stop continuity,
gameplay continuity, legacy one-frame manifests, and clean browser diagnostics
remain intact.

Automated tests: Shared frame contract/manifest/context; AI builder and
generation identity; Web request/prompt/executor propagation; Renderer tick
selection, async replacement, fallback, facing, and legacy manifest behavior;
affected package tests, TypeScript, ESLint, Web build, and regression suites.

Product Verification: **PASS** — real Studio showed two distinct generated run
frames visibly alternating during sustained right and left movement; idle and
jump stopped run-frame cycling; landing resumed temporal run presentation;
facing/mirroring, Runtime/gameplay authority, the mechanically complete
platformer flow, and clean browser diagnostics remained intact.

Observability expectations: keep each run frame as its own truthful generation
operation and manifest asset ID; preserve existing `succeeded → published →
manifest updated → resolved → Renderer applied` lifecycle and fallback status;
do not collapse the two frame operations into one.

Completion-report requirements: architecture v1.166 → v1.167; files created /
modified; real flow; tests; TypeScript; ESLint; constraints; remaining gaps;
manual verification steps; Code Complete; Product Verified.

Human/CTO decision required: NO — the slice reuses existing provider-neutral
asset and Renderer contracts, adds no authority or product-direction fork.

## Sprint 19 Freeze Review

Status: **DONE — FROZEN (2026-08-26)**

Code Complete = **YES**; Product Verified = **YES**; architecture v1.167.

The freeze question passes. The generated Player visibly reads as a character
action for standing, temporal running, facing, and jumping, with the following
verified transitions:

- stationary → idle, with no run-frame cycling
- sustained right → two distinct generated run frames alternate over time
- sustained left → the same temporal alternation with correct mirroring
- stop → idle, with cycling stopped
- jump → jump, with no run cycling while airborne
- landing while moving → temporal run cycling
- Runtime movement/collision/gameplay authority unchanged
- mechanically complete platformer flow preserved
- no new WO-S19-002-attributable browser console errors/warnings

Out of scope for this freeze: full spritesheets, arbitrary frame counts,
attack/hurt/death animation, enemy animation, skeletal animation,
AnimationManager, universal animation state machines, and animation editors.

## Separate High-Priority Problem Register

These measured product problems remain open and are not part of WO-S19-002 or
the Sprint 19 freeze. They require fresh product-level prioritization after the
freeze:

1. Generated Platform is pass-through and does not provide the expected Player
   collision behavior.
2. A follow-up such as `增加5个enemy` can return `Unknown command` because the
   front-door intent layer rejects valid free-form World Evolution requests.
3. Switching to Full Observatory can lose Studio runtime state through page
   reload/navigation lifecycle.
4. Failed image generation lacks a targeted user retry flow.
5. Image generation UI does not expose the actual final prompt submitted to the
   image agent/provider.
6. Failed/completed gameplay lifecycle presentation remains basic and should
   later use a more game-like overlay/modal where appropriate.
