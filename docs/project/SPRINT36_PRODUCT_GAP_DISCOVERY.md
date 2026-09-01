# Sprint 36 Product Gap Discovery — Active-World New-World Intent Correctness

Date: 2026-09-01  
Human/CTO authorization: Freeze Sprint 35 at v1.185 and enter Sprint 36
Intent Discovery  
Architecture: v1.185 → v1.185 (discovery only)  
Status: **PASS — discovery complete; `SPRINT36_FREEZE_REVIEW` READY**

## Discovery boundary

Sprint 35 is frozen. `WO-S35-001 — Generic Progression-Conditioned Gameplay
Capability` is DONE with Code Complete = YES and Product Verified = YES at
v1.185. Sprint 36 was authorized to answer one product question:

> When a world is already active, can Genesis distinguish a request to modify
> the current world from a request to create or switch to a new world?

This pass audited the repository and the real Studio front door. It did not
modify the Intent router, AI planner, Semantic World, Runtime, Renderer, or
session behavior. It generated exactly one product work order and stopped.

## Verified production call chain

The actual Studio path is:

```text
StudioCommandBar.submitCommand
  → gameStore.send(input)
  → DefaultIntentRouter.route(input, { activeWorld })
  → deterministic route decision
  → if world-evolution OR (unknown AND active world): planEvolution()
      → primary DefaultWorldEvolutionPlanner
      → StructuredWorldEvolutionCandidateProvider / AI candidate path
      → provider_error-only deterministic evolution fallback
      → semantic delta validation → gameplay reconciliation
      → Runtime synchronization → visual evolution
  → otherwise DefaultCommandExecutor.executeAsync(input)
      → CreateWorldRuntimeExecutor
      → CreateWorldPipeline
      → worldStore.setWorld()
      → gameStore new world identity and state/projection rebinding
```

`StudioCommandBar` only trims and submits text. The active-world decision is
in `gameStore.send`, not in the component. `DefaultCommandExecutor` has no
active-world context and only executes the CreateWorld route; active-world
World Evolution is handled by `gameStore` before that executor is called.

For a successful CreateWorld result, the existing Web contract commits the
new Runtime world, advances the application world identity, replaces semantic
and gameplay state, marks the new session active, resets Runtime/visual
revisions and transient visual executions, resets the previous evolution
projection, and reloads the Runtime/Observatory projection. The discovery does
not propose a second replacement contract.

## First divergence

For active `创建 MarioWorld`, the current source computes:

| Signal | Current result |
| --- | --- |
| creation keyword | `true` (`创建`) |
| genre keyword | `true` (`Mario`) |
| world scope | `true` (`MarioWorld` is recognized through genre/world scope) |
| explicit new/reset marker | `false` (no `新建`/`全新`/`新的`/`重新`/`重置`/`reset`) |
| entity-scoped mutation | `false` (world scope blocks the entity-quantity branch) |
| evolution keyword + known target | `false` |
| active router result | `unknown`, confidence `0` |
| `gameStore.send` result | active `unknown` is sent to `planEvolution()` |

This is the first incorrect boundary. The CreateWorld candidate path is
skipped. The input is not interpreted as a current-world entity mutation by
the router itself; it becomes a mutation attempt only because the Web front
door treats every active-world `unknown` as eligible for the existing
World Evolution fallback.

The same divergence applies to `创建一个 RPG` and `生成一个幸存者游戏`.
`做一个农场游戏` is also not a CreateWorld candidate today because `做` is
not a creation keyword, even though the object is a whole game archetype.

## A/B/C/D command audit

The table distinguishes the pure router result from the behavior of the real
active Studio front door. “Evolution path” means the existing World Evolution
planner was invoked; it does not promise that a provider or deterministic
candidate will validate the requested delta.

| Class | Input | Router without active world | Router with active world | Actual active front door / product decision |
| --- | --- | --- | --- | --- |
| A — current-world mutation | `再加五只怪` | `unknown` | `unknown` | Evolution path; verified same world, +5 Enemy |
| A — current-world mutation | `再创建5个怪物` | CreateWorld `.8` | World Evolution `.8` | Evolution path; verified same world, +5 Enemy |
| A — current-world mutation | `把背景改成夜晚` | World Evolution `.8` | World Evolution `.8` | Evolution path; property mutation boundary is correct |
| A — current-world mutation | `增加一个 Boss` | World Evolution `.8` | World Evolution `.8` | Evolution path; no world replacement |
| A — current-world mutation | `删除一个敌人` | `unknown` | `unknown` | Active fallback reaches Evolution; target coverage is secondary debt |
| B — explicit new world | `创建一个新的游戏` | CreateWorld `.8` | CreateWorld `.8` | Verified new world replacement |
| B — explicit new world | `重新创建一个平台跳跃游戏` | CreateWorld `.8` | CreateWorld `.8` | CreateWorld; explicit `重新` + game scope |
| B — explicit new world | `新建一个农场游戏` | CreateWorld `1.0` | CreateWorld `1.0` | CreateWorld; explicit `新建` + archetype scope |
| C — named/archetype creation | `创建 MarioWorld` | CreateWorld `1.0` | `unknown` | **Observed wrong Evolution path; structured generation failed** |
| C — named/archetype creation | `创建一个 RPG` | CreateWorld `1.0` | `unknown` | **Observed wrong Evolution path; structured generation failed** |
| C — named/archetype creation | `生成一个幸存者游戏` | CreateWorld `1.0` | `unknown` | **Observed wrong Evolution path; structured generation failed** |
| C — named/archetype creation | `做一个农场游戏` | `unknown` | `unknown` | Evolution fallback today; whole-game construction is a generic candidate for the WO |
| D — ambiguous | `创建` | CreateWorld `.8` | `unknown` | Active fallback today; must not gain replacement semantics |
| D — ambiguous | `生成一个` | CreateWorld `.8` | `unknown` | Active fallback today; insufficient world scope |
| D — ambiguous | `做一个新的` | `unknown` | `unknown` | Active fallback today; insufficient world scope |

The C rows are semantically whole-world requests despite differing names and
genres. The D rows lack a reliable world/game subject and must remain
non-replacing. The selected work does not attempt to solve unrestricted
natural-language ambiguity.

## Real Studio evidence

The Vite production path was opened at `http://127.0.0.1:5888/` and the
commands were entered through `StudioCommandBar`.

1. In a fresh session, `创建 MarioWorld` reached CreateWorld. The Studio
   showed `world-1`, seven entities, the Platformer controls, and a “World
   created” activity.
2. `创建一个新的幸存者游戏` created active Survival `world-2` with six
   entities and the `Space — 攻击` control.
3. Active `再加五只怪` preserved `world-2` and increased the entity count from
   six to eleven. The Game activity was “Semantic change applied / Add Enemy
   ×5”.
4. Active `再创建5个怪物` preserved `world-2` and increased the count from
   eleven to sixteen with the same World Evolution activity.
5. Active `创建 MarioWorld` preserved `world-2` and sixteen entities, then
   reported `World evolution failed: Structured world evolution planning
   failed`. Full Observatory showed a World Evolution request with source
   `ai`, `STRUCTURED_GENERATION: failed`, no target IDs, and no world change.
6. Active `创建一个 RPG` produced the same failed World Evolution behavior;
   `world-2` remained current.
7. Active `创建一个新的游戏` reached CreateWorld, replaced `world-2` with
   `world-3`, and reset the visible world to the new generated result.
8. Active `生成一个幸存者游戏` after that replacement again took the failed
   World Evolution path, proving the issue is broader than MarioWorld.

The browser session did not show a new browser error attributable to the
discovery. The observed evolution failures are application results recorded
by the existing Observatory path, not browser diagnostics.

## AI and fallback behavior

The active named request does not call the world-generation/CreateWorld
pipeline. Its primary operation is `World Evolution · ai`; the structured
generation step fails before an evolution candidate is produced. The Web
fallback policy asks the deterministic evolution planner only when the primary
failure is `provider_error`. That deterministic planner supports bounded
current-world deltas, not a named whole-world replacement, so it cannot turn
this request into CreateWorld.

The World Evolution prompt itself says to modify the existing Semantic World
through a bounded delta and not recreate it. This is correct for A, but it is
the wrong planner boundary for C. The fix must choose the existing CreateWorld
path before this prompt is assembled. AI remains a candidate provider, and
Genesis remains the validator; no provider-direct replacement and no second
router are needed.

## Candidate ranking

1. **Selected — active-world named/whole-world creation classification.** This
   is the first reproducible product failure at the front door. It affects
   every active named archetype request and has a small generic boundary at
   the existing IntentRouter/Web decision.
2. **Secondary — deterministic entity target vocabulary coverage.** Some
   mutation phrases such as `删除一个敌人` are not recognized by the pure
   deterministic target list, but the active-world fallback keeps the
   conversational Evolution path reachable. Broadening this vocabulary is a
   separate discovery/acceptance choice.
3. **Deferred — bare creation ambiguity.** `创建`, `生成一个`, and `做一个新的`
   do not establish a whole-world subject. Routing them to CreateWorld would
   risk replacing the current world; routing them by an ad hoc creation
   substring would violate the current-world preservation invariant.
4. **Deferred — offline evolution fallback resilience.** The fallback is
   useful for bounded deltas but cannot compensate for a wrong world-level
   route. Improving it is not the smallest response to this measured gap.

## Selected product work order

### `WO-S36-001 — Generic Active-World New-World Intent Classification`

Status: **READY — discovery-selected; not executed**  
Priority: P0  
Architecture expectation: v1.185 → v1.186 (proposed; confirm during
implementation review)

The work order is intentionally generic:

- Preserve current-world signals first: entity target/quantity, property or
  evolution verbs, and continuation language (`再`, `增加`, `删除`, `改成`,
  `把`) stay on World Evolution.
- Preserve explicit new/reset semantics on CreateWorld.
- Add the smallest positive whole-world/game decision at the existing front
  door: a world/game subject plus creation/construction or named/archetype
  evidence, with no current-world mutation signal, uses the existing
  CreateWorld pipeline even when a world is active.
- Keep bare/underspecified creation non-replacing. If the existing active
  unknown fallback remains available for such text, only a validated
  World Evolution delta may apply under existing guards.
- Reuse the existing CreateWorld replacement contract. Do not introduce a
  second route, registry, provider authority, or session architecture.

Acceptance and test requirements are recorded in
[`SPRINT36_BACKLOG.md`](SPRINT36_BACKLOG.md). Product Verification is pending
because this discovery does not execute the WO.

## Stop state

- Sprint 35: FROZEN at v1.185; Code Complete = YES; Product Verified = YES.
- Sprint 36 discovery: PASS; architecture unchanged; route divergence
  MANUAL VERIFIED in real Studio.
- Exactly one READY product WO: `WO-S36-001`.
- Current gate: `SPRINT36_FREEZE_REVIEW`.
- Sprint 37: not entered.
- ADR: not created; discovery introduces no architecture change. An ADR is
  only appropriate if the future routing implementation changes the accepted
  architecture boundary.
