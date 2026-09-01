# ADR-0292 — Generic Player-Directed Short-Range Offense

- Status: Accepted by execution of `WO-S32-001`
- Date: 2026-09-01
- Architecture transition: v1.181 → v1.182

## Context

Sprint 32 Product Gap Discovery found that the exact Survival request
`生成一个幸存者游戏` reached a functioning Runtime loop, but the only Player
offense was an implicit contact rule. The first overlap could damage both the
Enemy and Player, while the Game surface exposed only `Arrow Keys — Move`.
This made the first combat interaction accidental and made repeated offense
unclear. The existing generic `DAMAGE_ENTITY` action, Runtime Position/Health,
input provider, Gameplay Rule path, replacement composition, progression, and
active-session projection were already sufficient for a smaller explicit seam.

## Decision

Add one generic Runtime `PlayerAttackRequestSystem` to the top-down Studio
composition. On a `Space` pressed edge it:

1. reads the current Runtime World;
2. considers only the configured target category (`enemy` in the top-down
   composition) with finite Position and positive finite Health;
3. accepts targets within the finite default Euclidean range of `48` Runtime
   units;
4. chooses the nearest target and breaks equal-distance ties by stable entity
   ID; and
5. emits the provider-neutral `ENTITY_ATTACK_REQUESTED` fact without mutating
   the World.

The existing post-system Gameplay Rule phase matches the fact and commits the
trusted `DAMAGE_ENTITY` action. Survival's Player→Enemy contact offense is
replaced as the primary offense path; the separate Enemy→Player contact danger
rule remains. Defeat, XP/Level, Runtime-only replacement, active-session
continuity, WorldStore mutation, Renderer projection, and Observatory facts
continue to use their existing authorities. Platformer keeps its existing
`Space` jump composition and does not register the attack system.

## Boundaries

This decision does not add a weapon or combat subsystem, projectile entities or
physics, cooldown/timer/auto-fire behavior, target-lock state, attack
animation, inventory/equipment, a new HUD, or a provider/AI call during play.
The Runtime owns target selection and the Gameplay Rule owns damage; no visual
target or natural-language provider decision participates in the live loop.
One accepted input edge can produce at most one attack fact and one selected
target.

## Production flow

`generation → gameplay capability composition → top-down Space edge →
PlayerAttackRequestSystem → ENTITY_ATTACK_REQUESTED → GameplayRuleMatcher /
ConditionEvaluator → DAMAGE_ENTITY → Runtime WorldStore → Renderer / Studio →
Observatory projection`

## Verification

Automated production reachability and focused Shared/AI/Runtime/Web tests cover
the event vocabulary, key-edge behavior, finite range, no-target no-op,
nearest/stable-ID selection, trusted damage, contact-danger separation,
defeat/XP/Level/replacement, replacement targeting, control hints, and
Platformer jump non-regression. TypeScript, package lint, Web build, and diff
hygiene are required gates.

Real Studio verification with `生成一个幸存者游戏` confirmed `world-1`, the
visible `Space — 攻击` affordance, non-contact damage, separate contact
danger, replacement/progression/session continuity, current `v1.182 / Sprint
32` Observatory metadata, no new attack-time provider/image operations, and
clean browser diagnostics. The production-path reachability check confirmed
the no-target no-op. The fresh Sprint 32 Gap Analysis passes, with
`SPRINT32_FREEZE_REVIEW` as the next human-controlled gate.
