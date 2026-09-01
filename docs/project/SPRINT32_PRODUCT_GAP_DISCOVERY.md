# Sprint 32 Product Gap Discovery — Survival Playability

Discovery date: 2026-08-31  
Architecture: v1.182 (discovery at v1.181; implementation completed at v1.182)
Status: **DONE — discovery led to `WO-S32-001` execution; Code Complete = YES;
Product Verified = YES; fresh gap PASS; `SPRINT32_FREEZE_REVIEW` READY**
Authority: Human/CTO decision froze Sprint 31 and authorized Sprint 32 Product Gap Discovery

## Discovery boundary

At the time of discovery, Sprint 31 was frozen at v1.181 with both Observatory
truth work orders complete and Product Verified. Sprint 32 began with product
measurement, not a pre-selected feature. The discovery itself did not execute a
product WO or enter Sprint 33; the separately authorized follow-up then
executed the one generated WO described below.

The verified baseline is intentionally retained:

`Natural language → Survival semantic world → top-down composition → Player
movement → Enemy pursuit/contact pressure → contact offense → Enemy defeat →
XP/Level → Runtime-only replacement → active session → Observatory`

## Real Studio play session

A fresh local Genesis Studio session used the exact request
`生成一个幸存者游戏`. The real product created deterministic-fallback Survival
world `world-1` with six visible Runtime entities: Player, Resource, Tree,
Stone, Enemy, and Campfire. The Game viewport was active and its visible
control affordance was only `Arrow Keys — Move`.

The session was then exercised through movement input and multiple same-session
gameplay/lifecycle cycles. The following observations are product evidence,
not a generic architecture score:

| Question | Measured product observation | Finding |
| --- | --- | --- |
| Is it immediately understandable how the Player attacks? | No attack key, attack instruction, or attack affordance is visible; the Game control strip only says `Arrow Keys — Move`. | **FAIL — offensive agency is undiscoverable.** |
| Does defeating an Enemy feel intentional or accidental? | Before any explicit attack action, the first Enemy/Player contact was observed at the same Runtime position; Enemy Health changed `100 → 75` while Player Health changed `100 → 99`. | **FAIL — damage is contact side effect, not an intentional player action.** |
| Does Enemy contact conflict with contact offense? | The same contact overlap is both the Player's only offensive mechanism and the Enemy's damage mechanism. The real inspector showed the Player and Enemy co-located. | **FAIL — offense and danger share one ambiguous interaction.** |
| Can the Player create repeated independent contact events? | Directional movement in the observed session moved the Player, but target-directed Enemy movement re-established the same position. Repeated damage was only observable after Game ↔ Full Observatory ↔ Game remount cycles, which are lifecycle operations rather than a usable combat action. | **FAIL — no clear repeatable combat rhythm through the visible play surface.** |
| Does replacement Enemy pressure sustain coherently? | A defeated Enemy was replaced in the same `world-1` session. The replacement inherited Health, collision, target-directed movement, and visual composition, but appeared at the Player's current position and immediately resumed pressure. | Mechanically sustained, but pacing/placement is awkward. Secondary gap. |
| Does XP / Level have visible or mechanical meaning after leveling? | Full Observatory reached `经验值: 1 / 等级: 2` and later `经验值: 2 / 等级: 2`; the Game canvas showed no XP/Level affordance or visible gameplay consequence. | Secondary gap; progression exists but its product meaning is unclear. |
| Is the Player placed in an unavoidable or degenerate loop? | Co-located replacement pressure repeatedly presented the same overlap; contact-start de-duplication prevents per-frame damage, but the session offers no clear action that separates attack from being hit. | **Degenerate interaction loop observed; not claimed as unavoidable death.** |
| Is replenishment understandable without wave UI? | Explorer/Runtime expose the replacement identity, but the normal Game surface gives no defeat, replacement, or wave cue; the replacement can visually overlap the Player. | Secondary pacing/presentation gap. |
| Does the game remain playable for a short session? | It remains technically active and can reach XP/Level 2, but the first user-visible combat interaction is awkward, ambiguous, and difficult to repeat intentionally. | **FAIL for a comfortable short session.** |
| What is the first largest user-visible blocker? | The first noticeable failure is the absence of intentional, understandable Player offense; spawn pacing and progression meaning are downstream concerns. | **Select intentional offensive interaction.** |

The lifecycle remounts were used only to continue observing the same real
session and expose repeated contact consequences. They are not being proposed
as a gameplay mechanic and are not counted as successful player attacks.

## Candidate ranking

| Candidate | Classification | Evidence | Decision |
| --- | --- | --- | --- |
| Player offense requires ambiguous contact and has no visible input affordance | PRODUCT_GAP | `Arrow Keys — Move` is the only control hint; first damage occurred on overlap; Player and Enemy stayed co-located; no clear independent attack loop was observed. | **Highest priority; selected.** |
| Replacement placement/pacing | PRODUCT_GAP | One-for-one Runtime replacement works and preserves the session, but same-position replacement produces immediate pressure. | Secondary symptom; do not create a separate WO. |
| XP/Level has no visible consequence | PRODUCT_GAP | Observatory shows `1/2` and `2/2`; Game surface shows no change. | Secondary; revisit only after offensive agency is usable. |
| Damage/defeat presentation | PRODUCT_GAP | Overlapping sprites and no attack cue make state changes hard to read. | Keep the smallest necessary cue inside the offense WO; no visual redesign. |
| Timers, waves, scaling, projectiles | DEFERRED_OUT_OF_SPRINT | The current bounded loop already sustains a session and the discovery brief explicitly forbids preselecting these features. | Do not select. |

## Smallest generic alternative audit

The current source/runtime path was audited before generating the WO:

| Capability surface | Current truth | Consequence for the smallest slice |
| --- | --- | --- |
| Input | `KeyboardInputProvider` already tracks `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Space`. The top-down Studio motion profile consumes movement, target-directed movement, velocity, and contact; it does not consume an attack input. | Reuse the existing `Space` key for top-down attack affordance, while preserving `Space` as Platformer jump. |
| Target selection | Gameplay selectors currently support event actor/target, exact ID, category, archetype, and role. There is no nearest-target or range selector. | Add only a deterministic current-Runtime nearest-enemy-within-range selection at the generic input/event boundary; do not add a WeaponSystem or global selector framework. |
| Damage | `DAMAGE_ENTITY` is already a supported trusted Runtime action and current Survival contact rules use it. | Reuse the existing action and Health mutation; do not add another damage authority. |
| Runtime position/motion | Position, collision bounds, target-directed movement, velocity motion, and current World mutation are already production-reachable. | A short-range attack needs no projectile creation, projectile movement, or new physics. |
| Gameplay timing | Runtime ticks exist, but no timer/periodic trigger is exposed. | A key-edge attack requires no timer or auto-fire scheduler; avoid a periodic attack WO. |
| Entity creation | Runtime-only `SPAWN_ENTITY` is supported for the current replenishment slice. | No new entity is needed; a projectile would be a larger, unnecessary slice. |
| Generic rule path | AI describes structured gameplay intent; Runtime matches facts and executes trusted actions. | Preserve the existing semantic → RuleSet → Runtime boundary and make the attack a generic Runtime input fact, not a live AI decision. |

## Selected work order

Exactly one primary WO is generated:

`WO-S32-001 — Generic Player-Directed Short-Range Offense`

The proposed minimum is one explicit top-down Player attack request using the
existing `Space` input, deterministic nearest-enemy targeting within a bounded
short range, and the existing `DAMAGE_ENTITY` action. Survival's current
automatic Player-contact offense must not remain the primary path if it would
continue to make damage accidental; the implementation WO defines the smallest
replacement/gating change required to make the explicit input authoritative.
The WO includes only the minimal control hint and observable committed outcome
needed for a user to understand the action. It does not include projectiles,
attack animation, waves, timers, upgrades, or difficulty scaling.

See [`SPRINT32_BACKLOG.md`](SPRINT32_BACKLOG.md) for the complete READY WO
contract, acceptance criteria, verification plan, and non-goals.

## Stop condition

Sprint 31 remains FROZEN at v1.181. Sprint 32 Product Gap Discovery selected
exactly one blocker, and the separately authorized implementation of
`WO-S32-001` completed at v1.182. The fresh post-implementation gap analysis is
PASS: explicit offensive agency is now reachable, while replacement pacing,
progression meaning, richer presentation, timers, waves, projectiles, and
scaling remain deferred/non-blocking. `SPRINT32_FREEZE_REVIEW` is READY; Sprint
33 is not entered.

## WO-S32-001 execution result

The selected slice is implemented as a generic Runtime `Space` key-edge
request. The top-down Studio composition selects one current positive-Health
Enemy within a finite 48-unit Euclidean range, choosing the nearest target and
breaking equal-distance ties by stable entity ID. It emits
`ENTITY_ATTACK_REQUESTED`; the existing Gameplay Rule path then applies the
trusted `DAMAGE_ENTITY` action. Survival Player→Enemy contact offense was
replaced as the primary path; Enemy contact remains the separate
Enemy→Player danger rule. Platformer continues to use `Space` for jump.

Automated production reachability and package checks pass. Real Studio
verification confirmed the visible attack hint, non-contact damage,
contact-only Player damage, defeat/progression/replacement continuity, current
Observatory metadata and session truth, and clean browser diagnostics. The
production-path no-target check confirmed an out-of-range Space input is a
no-op.
The fresh Sprint 32 Gap Analysis is **PASS**, and the next human-controlled
gate is `SPRINT32_FREEZE_REVIEW`.
