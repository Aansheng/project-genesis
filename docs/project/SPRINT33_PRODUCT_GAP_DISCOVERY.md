# Sprint 33 Product Gap Discovery — Survival Playability

Discovery date: 2026-09-01  
Architecture: v1.182 discovery baseline; current architecture v1.183
Status: **DONE — `WO-S33-001` executed and verified; freeze review READY**
Authority: Human/CTO decision froze Sprint 32 and authorized Sprint 33 Product Gap Discovery

## Discovery boundary

Sprint 32 is frozen at v1.182 with a mechanically complete bounded Survival
loop. Sprint 33 began by measuring the player experience of that loop, not by
selecting a familiar Survivor feature in advance. The discovery section below
records the v1.182 baseline; the separately authorized execution result is
recorded after the historical stop condition.

The current verified loop is:

`Natural-language generation → top-down Survival world → Player movement →
attempted evasion under Enemy pursuit/contact danger → explicit Space attack →
Enemy Health decrease → Enemy defeat → XP/Level → Runtime replacement Enemy →
continued session`

## Real play session

A fresh local Genesis Studio session submitted `生成一个幸存者游戏`. The
deterministic fallback produced active `world-1` with six visible entities.
The session was played through movement, an attempted evasion, pursuit,
intentional attacks, an Enemy defeat, replacement pressure, an Observatory
inspection, return to Game, and additional attacks after Level 2. The Inspector
and Event Stream were used
after normal play to correlate authoritative outcomes; they were not treated
as substitutes for Game-surface readability.

| Experience question | Measured observation | Finding |
| --- | --- | --- |
| Is attack input understandable? | Game shows `Arrow Keys — 移动` and `Space — 攻击`. | **PASS — offensive agency is discoverable.** |
| Does an explicit attack reach the intended target? | At the Player's current position, Space produced `ENTITY_ATTACK_REQUESTED` and committed `DAMAGE_ENTITY`; Enemy Health moved `100 → 75 → 50 → 25 → removed`. | **PASS mechanically; outcome is not visually acknowledged.** |
| Can the Player tell that a hit happened without inspection panels? | The Game canvas showed the same overlapping Player/Enemy presentation before and after damage. No hit flash, target cue, damage text, defeat cue, or replacement cue was visible; confirmation required Inspector/Event Stream. | **FAIL — offensive feedback/readability.** |
| Can the Player distinguish offense from danger? | Contact independently reduced Player Health (`100 → 99`); explicit Space reduced Enemy Health. The distinction is authoritative but silent in Game. | **PARTIAL — semantics are correct, presentation is unclear.** |
| Does defeating an Enemy read clearly? | The Enemy row disappeared and a Runtime replacement row appeared, but the normal canvas supplied no explicit defeat/replacement cue. | **FAIL — lifecycle outcome is hard to read.** |
| Does replacement pacing feel fair? | `enemy-runtime-17265` inherited the full composition but appeared at `(86,300)`, the Player's current position, and Player Health later reached `98` under immediate contact pressure. | **SECONDARY — awkward pacing/placement.** |
| Can the Player create a readable evasion window? | Brief directional movement shifted the Player from `(80,300)` to `(86,300)`, but the pursuing Enemy followed and re-established co-location/contact pressure. | **PARTIAL — movement exists, but the observed short evasion attempt did not create a stable readable separation.** |
| Does progression mean something in normal play? | Full Observatory showed `经验值: 1 / 等级: 2`; returning to Game preserved the session, but no Game-surface Level affordance or gameplay consequence was observed. | **SECONDARY — progression meaning is missing.** |
| Can a short session continue? | The active session survived defeat, replacement, route traversal, and further attacks. | **PASS mechanically; readability is the limiting experience.** |
| Are there diagnostics or provider regressions? | No new attack-time provider/image operation appeared; browser error/warning diagnostics were `[]`. | **PASS — not the blocker.** |

The browser control required a deliberate key edge to remain observable across
the Runtime render loop. Accepted attacks were confirmed by the real Event
Stream and Runtime Inspector; this input-observation detail is not classified
as a product defect.

## Candidate ranking

| Candidate | Classification | Evidence | Decision |
| --- | --- | --- | --- |
| Game gives no readable attack/hit/defeat outcome feedback | `PRODUCT_GAP` | Every accepted attack was silent on the canvas; Inspector/Event Stream were required to know that damage occurred. | **Highest priority; selected.** |
| Level 1 → 2 has no visible gameplay consequence | `PRODUCT_GAP` | Observatory shows Level 2, while Game shows no progression cue or changed behavior. | Secondary; first make combat outcomes readable. |
| Replacement appears at the Player and resumes pressure immediately | `PRODUCT_GAP` | Same-position replacement and immediate contact were observed. | Secondary; do not open a separate spawn/pacing WO yet. |
| 48-unit range / surrounding pressure / evasion readability | `PRODUCT_GAP` observation | Close targets were practical, but movement and pursuit can collapse the spatial read; the short evasion attempt did not hold separation. | Not the first measured blocker; revisit after feedback exists. |
| Projectiles, timers, waves, scaling, or weapon systems | `DEFERRED_OUT_OF_SPRINT` | The bounded loop already sustains a session and the authorization explicitly forbids preselection. | Do not select. |

The selected blocker is therefore:

> Verified movement, pursuit, Health, explicit attack, trusted damage,
> defeat, progression, replacement, and active-session continuity exist; the
> largest remaining normal-play blocker is that the Game surface does not
> communicate the authoritative attack outcome. This is the smallest blocker
> because it occurs on every attack and prevents the Player from understanding
> hit, damage, defeat, and replacement state transitions.

## Smallest generic alternative audit

| Capability surface | Current truth | Consequence for the smallest slice |
| --- | --- | --- |
| Runtime events and rule results | `ENTITY_ATTACK_REQUESTED`, committed rule results, `DAMAGE_ENTITY`, `ENTITY_REMOVED`, and `ENTITY_ADDED` are already projected to Observatory. | Reuse these facts; do not create a second combat or feedback authority. |
| World state | Runtime Position, Health, entity identity, and replacement composition remain authoritative. | Derive any cue from committed Runtime outcomes and current IDs/Health only. |
| Renderer/Studio path | `DefaultRuntimeVisualizationLoop` and the existing Game Viewport already receive Runtime results and render entity bindings. | Add only the smallest generic presentation projection needed by Game; no visual redesign. |
| Observatory | Event Stream and Runtime Inspector already expose detailed truth. | Keep Observatory detail and add no fabricated duplicate state. |
| Provider boundary | Generation/provider calls are absent from attack-time play. | Feedback must be local and deterministic; no per-attack AI/provider/image call. |

## Selected work order

Exactly one primary work order is generated:

`WO-S33-001 — Generic Runtime Gameplay Outcome Feedback`

The work order is `READY` for a later human-authorized execution step. It is
not executed by this discovery, and no Sprint 34 work is generated.

See [`SPRINT33_BACKLOG.md`](SPRINT33_BACKLOG.md) for the complete contract,
acceptance criteria, verification plan, and non-goals.

## Discovery gates

| Gate | Result |
| --- | --- |
| Evidence from a real normal-play session | PASS |
| Direct relevance to the Sprint 33 player-experience goal | PASS |
| One smallest measured blocker | PASS |
| Generic reusable capability | PASS |
| Existing authority boundaries preserved | PASS |
| Bounded automated verification | PASS |
| Real Product Verification feasible | PASS |
| No speculative infrastructure | PASS |
| Valid dependency chain | PASS — Sprint 32 is frozen at v1.182 |
| Human-decision status | PASS — discovery authorized; WO execution intentionally not performed |

## Historical discovery stop condition

At the discovery boundary, Sprint 32 was **FROZEN = YES** at v1.182. Sprint 33
Product Gap Discovery was complete, exactly one `READY` WO existed, and that
continuation stopped before implementation. A later Human/CTO decision then
authorized the bounded WO; Sprint 34 was not entered.

## WO-S33-001 execution and fresh Sprint 33 Gap Analysis

Human/CTO authorized `WO-S33-001 — Generic Runtime Gameplay Outcome Feedback`
on 2026-09-01. The implementation advances architecture from v1.182 to
v1.183 and closes the selected blocker with this bounded flow:

`committed Runtime GameplayRule result → pure outcome projector → existing
Runtime visualization loop → dedicated Pixi feedback layer`

Committed `HEALTH_UPDATED` results project to an ID-bound hit cue with
optional authoritative damage; lethal `ENTITY_REMOVED` results with Health
zero project to a defeat cue at the last authoritative pre-removal Position;
and committed `ENTITY_ADDED` results project to a replacement cue. Failed or
uncommitted results, attack-request-only facts, ordinary removals, and
contact-only damage emit no Player-attack cue. The Renderer owns only local
transient presentation time, and the Web viewport clears feedback when the
Runtime world identity changes. Runtime gameplay authority, WorldStore truth,
Observatory projection, asset identity, and provider boundaries are unchanged.

Final automated verification passed: Runtime 708/708, Renderer 510/510, Web
3573/3573; affected TypeScript checks; package ESLint with existing warnings
only and zero errors; Web production build; and `git diff --check`.

Fresh real Studio verification used the exact request `生成一个幸存者游戏`.
The Game surface showed a visible `-25`/ring hit, a distinct amber defeat
ring/X, a replacement cue, and the same generic hit cue after replacement.
Full Observatory retained `world-1`, the live event stream, XP/Level, and
`v1.183 / Sprint 33`; `创建 MarioWorld` retained the seven-entity Platformer
composition and `Space — 跳跃`; browser error/warning diagnostics were empty.
The no-target/out-of-range behavior is production-path verified at distance 49
with no feedback. Pursuit made a sustained manual separation window unstable,
so it remains an observation rather than an overstated visual claim.

Fresh gap analysis: **PASS**. The original selected blocker is resolved and
the product-success question is YES. Progression meaning, replacement pacing,
and evasion readability remain secondary candidates, with no new Sprint 33 WO.
Next gate: `SPRINT33_FREEZE_REVIEW` — READY for Human/CTO review. Sprint 34 is
not entered.
