# Sprint 38 Product Gap Discovery — Cross-Genre Playability Fidelity

Human/CTO decision: Sprint 37 is **FROZEN** at v1.187 with
`WO-S37-001` Code Complete = YES and Product Verified = YES. Sprint 38
Cross-Genre Playability Fidelity Discovery was authorized on 2026-09-02.

Status: **DONE — exactly one READY WO generated; no implementation executed;
Sprint 39 not entered**

Architecture: **v1.187 → v1.187**. This discovery adds no Runtime, Renderer,
AI, routing, gameplay, or architecture capability. The Web release metadata
now reports the current phase as Sprint 38; the frozen architecture version
and product behavior remain v1.187.

## Discovery boundary

The test used the real Genesis Studio front door and the existing local
provider-failure recovery path. It did not call a lower-level generator as a
substitute for the product surface.

```text
StudioCommandBar
  → gameStore.send
  → CreateWorld command executor / runtime executor
  → DefaultCreateWorldPipeline
  → provider candidate or deterministic fallback
  → Semantic World / worldType / template entities
  → DefaultSemanticGameDslBuilder
  → DefaultRuntimeProjection
  → Studio runtime motion profile and Runtime execution loop
  → GameplayRuleSet
  → Pixi Renderer + Observatory projections
```

The local Studio run reported `provider_failed` and entered the existing
`deterministic_fallback` path for all four commands. That is the currently
reachable offline product path, not a reason to make the provider an
authority.

## Four-command product matrix

| Request | Observed Runtime world | Semantic entities | Controls / spatial mode | Runtime and loop evidence | Product result |
| --- | --- | --- | --- | --- | --- |
| `创建 MarioWorld` | `world-1`, 7 entities | `player`, `terrain`, `platform`, `enemy`, `collectible`, `goal`, `checkpoint` | `Arrow Keys — 移动`; `Space — 跳跃`; side-view/platformer presentation | Full Observatory: 11 mechanics, 10 supported / 1 deferred, 5 supported rules. A real ArrowRight input changed Player X `80 → 83`. | **Baseline pass.** The bounded Platformer loop is coherent and playable. |
| `生成一个幸存者游戏` | `world-2`, 6 entities | `player`, `resource`, `tree`, `stone`, `enemy`, `campfire` | `Arrow Keys — 移动`; `Space — 攻击`; top-down grid presentation | Full Observatory: 10 mechanics, 6 supported / 4 deferred, 6 supported rules. Enemy pursuit/contact was live; a real Space attack changed Enemy Health `100 → 75`. | **Baseline pass.** Movement, pressure, offense, Health, and Runtime result mutation are reachable. |
| `做一个农场游戏` | `world-3`, 8 entities | `player`, `merchant`, `farmer`, `barn`, `wheat-field`, `corn-field`, `storage`, `harvest-quest` | `Arrow Keys — 移动`; `Space — 跳跃`; non-top-down/platformer motion profile | Full Observatory: 3 mechanics, 1 supported / 2 deferred; 1 rule, 0 supported / 1 deferred. `farm-interaction` is triggered by `ENTITY_CONTACT_STARTED`, uses deferred `SET_ENTITY_PROPERTY`, and is not a Player action. Real movement changed Player X `80 → 86`; Space left the Farmer at `100,400` with no interaction state. | **Fails Farm playability.** Correct semantic nouns are present, but no characteristic Farm interaction reaches authoritative Runtime state. |
| `创建一个 RPG` | `world-4`, 9 entities | `player`, `villager`, `merchant`, `quest-giver`, `enemy`, `boss`, `town`, `forest`, `main-quest` | `Arrow Keys — 移动`; `Space — 跳跃`; non-top-down/platformer motion profile | Full Observatory: 1 mechanic, 1 supported / 0 deferred; 0 Gameplay Rules. A real ArrowRight input changed Player X `80 → 92`; Space produced no quest/NPC/enemy state change. `quest-giver` remained position/semantic/collision only. | **Fails RPG playability.** The world contains RPG labels but no Player-triggered RPG action or rule result. |

The Studio Explorer and Runtime panel reported the same entity counts and
semantic categories as the generated worlds. After the Sprint 38 phase
metadata update, a fresh Farm Full Observatory also showed `v1.187 / Sprint
38` with `Design: farm`, 8 entities, and the same deferred rule truth. The
canvas screenshots showed a
coherent side-view Platformer and a coherent top-down Survival grid, while
Farm and RPG rendered the existing fallback primitives without enough
genre-specific spatial/gameplay readability to compensate for the missing
interaction path. No browser errors or warnings were recorded (`0` of each).

Source note: the header comment in `DefaultWorldTemplateCatalog` says
Survival has 5 entities, but the actual template, Runtime Explorer, and Studio
evidence all contain 6 (`player`, `resource`, `tree`, `stone`, `enemy`, and
`campfire`). This discovery uses the actual Runtime behavior.

## Platformer bounded baseline

Platformer remains the control baseline, not a new Sprint 38 work item:

- The request preserved `platformer` and the seven-entity composition.
- The canvas presented side-view geometry with Ground/Platform, Player,
  Enemy, collectible, goal, and checkpoint.
- ArrowRight changed the selected Player's authoritative Runtime Position;
  Space is exposed as Jump.
- Existing Runtime rules expose collection, enemy interaction, damage, goal,
  and progression slices. Full Observatory showed five supported rules.

No Platformer regression was found, so no Platformer repair is selected.

## Survival bounded baseline

Survival remains the existing bounded baseline:

- The request preserved `survival` and the six-entity composition.
- The canvas presented the top-down grid and the Studio control copy exposed
  `Space — 攻击`.
- Enemy Runtime state included target-directed movement toward Player. The
  observed contact tick changed Player Health to `99`, and a subsequent real
  Space attack changed Enemy Health from `100` to `75` through the supported
  `ENTITY_ATTACK_REQUESTED` → `DAMAGE_ENTITY` rule path.
- Full Observatory showed six supported rules, including the supported
  Player-directed offense rule, and Runtime remained Live with XP `0` and
  Level `1` during this bounded probe.

No Survival feature expansion is selected. The contact damage and attack
behavior are the accepted Sprint 32–37 baseline.

## Farm result and first break

Farm semantic generation is now correct after Sprint 37: the real front door
produced the existing eight-entity Farm composition and Observatory reported
`Design: farm`.

The first product break is:

> **FARM SEMANTIC ENTITIES HAVE NO PLAYER-REACHABLE GAMEPLAY INTERACTION**

The Farm world has a Farmer and Merchant NPC, two named fields, Barn, Storage,
and Harvest Quest in Semantic World, DSL, Runtime, and Renderer projection.
However, the playable surface only advertises movement and jump. The Player
can move in the Runtime world, but no normal Player action selects a Farm
target and causes a committed Farm state/result. The existing Farm
`farm-interact` description is deferred; its only displayed rule is gated,
uses `ENTITY_CONTACT_STARTED` rather than an explicit Player action, and its
`SET_ENTITY_PROPERTY` action is deferred. A contact/Observatory-only fact is
not sufficient Product reachability.

This is not a missing Farm template, a routing failure, a provider-authority
problem, or a reason to add a FarmingSystem. It is a Player-reachable
interaction capability gap.

## RPG result and first break

RPG semantic generation is also correct: the real front door produced the
existing nine-entity RPG composition and Observatory reported `Design: rpg`.

The first product break is:

> **RPG SEMANTIC NPC/QUEST/ENEMY ENTITIES ARE NOT PLAYER-INTERACTABLE**

The Player can move and the platformer motion profile exposes Jump, but the
NPCs, Quest Giver, Enemy/Boss, and quest entities remain passive semantic
Runtime entities. The RPG default specification contains only supported
`player-move`; the objective says “Explore and interact with the current
world,” yet the deterministic Gameplay Rule set contains zero rules. The
observed Quest Giver remains position/semantic/collision data with no
authoritative interaction result.

This is not evidence for a DialogueEngine, RPG combat subsystem, quest
framework, or a different input key. It is the same missing Player-directed
interaction seam seen in Farm, with a different characteristic target.

## Shared primitive assessment

The evidence supports one shared first primitive, without forcing genre
parity:

```text
discoverable Player action
  → deterministic finite-range target selection
  → entity/category-specific Gameplay Rule
  → authoritative Runtime mutation/result
  → visible Game-surface feedback and truthful Observatory state
```

The current Survival attack path is a useful bounded precedent, but it is
enemy-specific, top-down-only in the Studio registration, and exposes Space
as attack only for Survival. Farm and RPG currently have no equivalent
explicit interaction request. The exact control key is deliberately not
preselected: E, F, Enter, Space, or another control must be chosen only after
the accepted WO traces the existing input and presentation contracts.

## Single selected blocker

**SUPPORTED ARCHETYPE ENTITIES ARE NOT PLAYER-REACHABLE THROUGH AN EXPLICIT
PLAYER INTERACTION PATH**

This is the highest-priority blocker because it makes both newly reachable
archetypes read as labels plus generic movement rather than games. It is
smaller and more general than implementing Farm or RPG systems, and it sits
before any genre-specific content can produce a trustworthy result.

## Candidate ranking

1. **Selected — Generic Player-Directed Entity Interaction Reachability.**
   Explains both Farm and RPG failures at the same first missing product seam;
   can reuse existing Runtime target, rule, mutation, feedback, and
   Observatory contracts.
2. Farm-specific field/harvest/merchant mechanics. Not selected because it
   fixes only Farm, would prematurely choose a domain system, and does not
   address RPG's identical reachability break.
3. RPG dialogue/quest/combat expansion. Not selected because it is
   genre-specific and assumes an interaction path before proving one.
4. Renderer-only visual or spatial redesign. Not selected because the
   authoritative Runtime has no Farm/RPG action/result for the Renderer to
   present; visuals cannot establish gameplay truth.
5. Input-key or broad control redesign. Not selected because the key is not
   the measured root cause and choosing E/F/Enter/Space before tracing the
   existing contract would be speculative.

## Stop boundary

Sprint 37 is frozen at v1.187. Sprint 38 discovery is complete. Exactly one
work order is READY below; it is not executed in this continuation. No second
Sprint 38 WO, no product implementation, no architecture redesign, and no
Sprint 39 entry is authorized by this discovery.

See [`SPRINT38_BACKLOG.md`](SPRINT38_BACKLOG.md) for the single READY item.

## Post-discovery disposition

The preceding sections intentionally preserve the discovery-boundary record:
at that point `WO-S38-001` was READY and had not been executed. The Human/CTO
authorization that followed was accepted, and the work order is now Code
Complete and Product Verified at v1.188. Its real-Studio Farm/RPG evidence,
fresh PASS Gap Analysis, and `SPRINT38_FREEZE_REVIEW` gate are recorded in
[`SPRINT38_GAP_ANALYSIS.md`](SPRINT38_GAP_ANALYSIS.md) and
[`SPRINT38_BACKLOG.md`](SPRINT38_BACKLOG.md). The Provider-accepted Farm
5-vs-8 composition variance is recorded separately and is not a blocker.
Sprint 39 remains unentered.
