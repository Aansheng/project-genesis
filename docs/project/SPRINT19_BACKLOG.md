# Sprint 19 Backlog — Animated Entity Presentation

Sprint 18 is FROZEN at v1.164. Human/CTO authorized Sprint 19 on 2026-08-25.

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

Status: **IN_PROGRESS — reopened P0 reachability repair; Code Complete = YES; Product Verified = NO**

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
render ticks, and mirrors left-facing sprites. Human/CTO reopened this WO after
the production audit found that `DefaultPlayerControllerSystem` mutated
`Position.x` without producing non-zero production `Velocity.x`, making the
Runtime-derived run/facing branches unreachable through real input. The bounded
repair writes `Velocity.x`, preserves existing motion/jump/collision authority,
clears x on release, and adds a real registered input → Runtime → adapter →
Renderer reachability regression. Automated regression and web build gates
pass. Real Studio Product Verification is still pending; the unreliable
in-app browser keyboard bridge is not a product defect and must not trigger
Runtime/Input changes. Do not generate WO-S19-002 yet.
