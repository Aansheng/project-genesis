# Sprint 13 Product Audit — Cross-Genre Visual Generation

## 1. Executive Summary

Architecture remains **v1.138**. The Sprint 13 visual pipeline is now a
playable generated prototype, not yet a visually complete generated game.
Environment generation is generalized across all worlds, while character
generation is still narrowly eligible for player, generic enemy, and boss.

The highest-impact gap is **generalized visual asset eligibility with semantic
archetypes**. Farm animals/crops/buildings, RPG NPCs, survival props, and
sandbox animals/natural props can be represented semantically and receive an
`AssetSpecification`, but the current policy rejects them before a generation
job is created. They therefore remain primitive (except the existing static
checkpoint fixture). This is more visible than latency or style consistency.

Recommendation: implement exactly one final Sprint 13 WO for generalized
eligibility and archetype-aware canonical identity, then freeze Sprint 13.
Do not add image-to-image or reference guidance before this coverage gap is
closed.

## 2. Current Sprint 13 Capability

The real production flow is:

`Studio → gameStore → structured game-design gateway/provider → GameDesignSpecification → VisualDesignSpecification → AssetSpecification → static AssetManifest → FIFO VisualAssetGenerationScheduler → image gateway/provider → generated artifact publication → manifest/store → Pixi Sprite/environment application`.

Important boundaries observed in source:

- `DefaultVisualDesignSpecificationBuilder` recognizes categories and a small
  theme vocabulary. NPCs become `supporting character`, buildings become
  `world structure`, and terrain entities become `terrain element`.
- `DefaultAssetSpecificationBuilder` creates one requirement per entity plus
  `terrain-main` and `background-main`. It does not drop unsupported entities.
- `AssetGenerationPolicy` currently admits background, terrain, player
  character, enemy creature, and boss character only.
- `groupAiGenerationRequirements` deduplicates eligible requirements by kind,
  visual role, subject, and shared visual context, preserving entity bindings.
- Static fixtures exist for player, enemy, boss, and checkpoint. Unsupported
  requirements retain primitive fallback.
- The scheduler is FIFO with concurrency 1. World creation is immediate and
  visual work is incremental; failed jobs do not block playability.

## 3. Test Environment and Evidence

Repository evidence was collected from the active source path and current
Sprint 13 ADRs, not from the backlog alone. The local server configuration
selects the experimental server-side Codex CLI mode for game design and image
generation. No external provider run was performed in this audit because a
gateway/server session was not started; therefore exact provider latency,
successful image bytes, and visual thumbnail appearance are **not claimed**.

The deterministic and unit-test evidence is sufficient to assess planning,
eligibility, deduplication, fallback, queue order, and renderer wiring. Manual
provider latency remains a follow-up verification item.

## 4. Scenario A — Platformer

Prompt: `创建一个冰雪主题的平台游戏，有一个玩家、两个雪怪、一个冰霜 Boss 和一个检查点。`

| Layer | Result |
| --- | --- |
| GameDesign entities | Player, two enemy instances, boss, checkpoint, plus the environment requirements needed by the platformer |
| Entity categories | player, enemy, enemy, enemy, quest/item checkpoint (provider candidate dependent) |
| VisualDesign roles | player character, enemy creature, boss character, checkpoint marker |
| AssetSpecification | entity requirements plus `terrain-main` and `background-main`; snow theme maps to `ice platforms` / `snow mountains` |
| Canonical asset IDs | `entity-<id>-primary`, `terrain-main`, `background-main` |
| Generation | player 1 job, snow-monster archetype 1 job, boss 1 job, terrain 1 job, background 1 job |
| Source/fallback | AI on success; player/enemy/boss/checkpoint have static fixtures while pending/failing; checkpoint is static, unsupported terrain entities are primitive |
| Renderer/gameplay | Pixi character/environment layers apply independently; runtime geometry and playability remain intact |
| Activity/Observatory | Semantic labels for Player, Enemy, Boss, Terrain, Background; per-operation stages and fallback are exposed |

Assessment: **high coverage / recognizable themed playable prototype**. The
current architecture is strongest here. The main remaining mismatch is that a
single generated terrain texture decorates existing bounds rather than forming
a real tileset.

## 5. Scenario B — Farm

Prompt: `创建一个轻松的农场游戏，玩家是一名农夫，农场里有 3 头牛、5 棵作物和一个谷仓。`

| Entity | Recognition | AssetSpecification | Eligible | Final source |
| --- | --- | --- | --- | --- |
| farmer/player | player or NPC depending on provider candidate | yes | player yes; NPC no | AI or static player / primitive NPC |
| cow ×3 | provider candidate must represent as NPC/animal | yes if represented | no under current policy | primitive |
| crop ×5 | terrain/item representation | yes if represented | no | primitive |
| barn | building → `world structure` → prop | yes | no | primitive |
| terrain/background | environment semantics are always created | yes | yes | AI with fallback |

Canonical expectation for the current policy: **0 cow/crop/barn jobs**. If a
future generalized policy admits them, three cows should bind to one cow
canonical job and five identical crops to one crop job; they must not become
eight instance image requests.

Assessment: **low/medium coverage; playable generated prototype, not a farm
game visually**. The farm theme reaches background and terrain, but the
requested content is mostly primitive. This is the clearest cross-genre
failure of the current Sprint 13 product.

## 6. Scenario C — RPG

Prompt: `创建一个奇幻 RPG，玩家是一名骑士，村庄里有一个商人、两个村民和三个史莱姆。`

| Entity | Recognition | AssetSpecification | Eligible | Final source |
| --- | --- | --- | --- | --- |
| knight/player | player | yes | yes | AI or static player fallback |
| merchant | NPC / supporting character | yes | no | primitive |
| villager ×2 | NPC / supporting character | yes | no | primitive |
| slime ×3 | enemy / enemy creature if candidate classifies it as threat | yes | yes | one canonical AI job, three bindings |
| environment | fantasy theme plus environment requirements | yes | yes | AI with fallback |

Assessment: **medium coverage; recognizable themed prototype only if the slime
is classified as an enemy**. Semantic roles for NPCs exist, but there is no
merchant/villager visual generation path. Repeated slimes deduplicate correctly
at the current coarse enemy-archetype level. The visual identity key is too
coarse for different enemy species in one world because it uses role/subject,
not the semantic species name.

## 7. Scenario D — Survival

Prompt: `创建一个末日生存游戏，玩家在废弃营地中，有三个僵尸、一个补给箱和一堆篝火。`

| Entity | Recognition | AssetSpecification | Eligible | Final source |
| --- | --- | --- | --- | --- |
| player | player | yes | yes | AI or static player fallback |
| zombie ×3 | enemy / enemy creature | yes | yes | one canonical AI job, three bindings |
| supply chest | item/icon or prop depending on candidate | yes | no | primitive |
| campfire | item/icon | yes | no | primitive |
| environment | environment requirements | yes | yes | AI with fallback |

Assessment: **medium coverage; playable survival prototype**. Zombies get the
current enemy path and deduplication, but the camp's most important readable
props remain primitive. Props are a visible gap even when the hostile NPC path
works.

## 8. Scenario E — Sandbox

Prompt: `创建一个森林沙盒世界，有玩家、两只鹿、三棵树、一块巨石和一个小木屋。`

| Entity | Recognition | AssetSpecification | Eligible | Final source |
| --- | --- | --- | --- | --- |
| player | player | yes | yes | AI or static player fallback |
| deer ×2 | NPC/animal if represented | yes | no | primitive |
| tree ×3 | terrain/natural prop | yes | no | primitive |
| rock | terrain/natural prop | yes | no | primitive |
| cabin | building → world structure/prop | yes | no | primitive |
| terrain/background | forest maps to natural ground/layered woodland | yes | yes | AI with fallback |

Assessment: **low/medium coverage; themed environment with primitive world
contents**. This scenario demonstrates that the visual layer is more general
than the generation policy, but the final user-visible result is not yet a
visually authored forest sandbox.

## 9. Cross-Genre Visual Coverage

| Genre | Environment | Player | NPC/animal | Threats | Props/buildings | Overall feel |
| --- | --- | --- | --- | --- | --- | --- |
| Platformer | AI | AI | enemy AI | boss/enemy AI | checkpoint static | High; recognizable themed prototype |
| Farm | AI | AI | primitive | n/a | primitive | Low/medium; mostly primitive farm |
| RPG | AI | AI | primitive | slime AI | primitive | Medium; recognizable RPG prototype |
| Survival | AI | AI | n/a | zombie AI | primitive | Medium; playable survival prototype |
| Sandbox | AI | AI | primitive | n/a | primitive | Low/medium; environment-led prototype |

The matrix is not an arbitrary percentage: the result follows directly from
the policy gate and the manifest/renderer fallback behavior.

## 10. Canonical Asset Deduplication

Deduplication is implemented and works for repeated semantically identical
eligible requirements:

| Repeated request | Entity count | Expected generation jobs | Bindings |
| --- | ---: | ---: | --- |
| 2 snow monsters | 2 | 1 | 2 |
| 3 slimes | 3 | 1 | 3 |
| 3 zombies | 3 | 1 | 3 |
| 2 deer | 2 | 0 today | 2 primitive bindings |
| 3 cows | 3 | 0 today | 3 primitive bindings |

The canonical key is currently `{ kind, visualRole, subject, visualContext }`.
That is correct for repeated identical archetypes, but not sufficient for a
future generalized policy: `merchant`, `villager`, and `cow` could all collapse
to `supporting character` if their semantic subject is not made archetype-
specific. The final WO must fix identity at the same time as eligibility.

## 11. Visual Coherence

Environment coherence is **partially coherent** across all five genres: theme
rules consistently carry art direction, palette, mood, terrain, and background
context into every generation request. Character coverage is coherent where
generated, but the generated environment is paired with primitive NPCs/props in
four of five scenarios.

Dominant cause: missing visual-role eligibility, followed by independent
text-to-image generation and the absence of reference-guided consistency. The
evidence does not justify making reference guidance the next priority because
large requested portions are not generated at all.

## 12. Generation Latency and UX

The queue is FIFO, concurrency 1, ordered background → terrain → character.
World creation is immediate, first visual upgrade occurs after the first
provider result, and each operation reports queued/generating/applying/ready or
fallback. Studio Activity shows total ready, active, queued, and fallback
counts; Observatory shows provider/model/mode and asset-level lifecycle facts.

Exact wall-clock latency was not measured because no live provider session was
run. The source-backed conclusion is that latency is currently a secondary
product issue: the more visible problem is that many requested assets never
enter the queue. Once eligibility expands, serial generation may become the
next bottleneck and should then be measured before changing concurrency.

## 13. Activity and Observatory

The lifecycle is understandable and truthful for actual jobs. Environment
labels are derived from asset kind (`Background artwork`, `Terrain artwork`),
and character labels distinguish Player, Enemy, and Boss. Observatory exposes
the actual operation collection rather than a fake progress stream, including
artifact, manifest, resolution, renderer, fallback, provider, and model facts.

Known presentation limitation: unsupported assets do not create operations, so
the UI cannot tell the user that a cow, merchant, or barn was intentionally
left primitive. This is a product coverage gap, not a lifecycle-label bug.

## 14. Top Product Gaps (ranked)

1. **Generalized visual asset eligibility and semantic archetypes** — biggest
   visible gap across farm, RPG, survival props, and sandbox.
2. **Archetype-aware canonical identity** — required to prevent merchant/cow or
   different enemy species from sharing an overly broad generated visual.
3. **Richer environment realization** — one texture per terrain bound is not a
   tileset, tiling system, or parallax background.
4. **Visual consistency across independently generated assets** — palette and
   prompt context help, but no reference/style locking exists.
5. **Generation latency at broader coverage** — currently unmeasured; FIFO
   serial scheduling may become user-visible after gap 1 is fixed.

Animation, HUD/Game UI, persistence, and world evolution are also missing, but
they are not the dominant Sprint 13 cross-genre visual-generation blocker.

## 15. Recommended Final Sprint 13 WO

Implement **Generalized Visual Asset Eligibility & Semantic Archetypes**.

Scope should remain narrow:

- admit eligible NPC/animal, prop/building, natural object, and item archetypes
  through the existing `AssetGenerationPolicy`;
- preserve one AssetSpecification per entity and existing fallback behavior;
- derive canonical identity from an explicit semantic archetype/subject rather
  than only broad visual role;
- retain one canonical job for repeated identical instances;
- keep the existing scheduler, manifest publication, renderer, and Observatory
  boundaries;
- add focused policy/deduplication regression tests and one browser product
  verification pass for farm and RPG.

No architecture bump is required unless implementation reveals a genuine
contract change. Do not add a second orchestration layer.

## 16. Sprint 13 Freeze Recommendation

**B — exactly one final implementation WO, then freeze.**

The platformer path is strong and the environment path is real. One targeted
coverage WO can materially improve all remaining genres without reopening the
visual foundation. After that WO, defer tilesets, reference guidance,
animation, persistence, and latency optimization to later work based on fresh
product evidence.

## 17. Sprint 14 Readiness

Readiness is **partial**:

- World identity can survive same-session replacement and stable entity IDs are
  already used for entity-to-asset bindings.
- AssetSpecification can be rebuilt deterministically from a new design.
- Runtime mutation and visual mutation are separate in the current flow.
- A delta update is not yet a first-class contract; there is no semantic diff
  for AssetSpecification, durable generated-artifact ownership, or guaranteed
  persistence across server restart.
- Targeted regeneration is possible in the current scheduler/store shape, but
  depends on a future evolution layer preserving canonical identity and
  invalidating only affected assets.

Sprint 14 should begin only after the final S13 coverage WO establishes
archetype-aware identity and a focused mutation/delta design.

## Verification Record

- Architecture: **v1.138 → v1.138**.
- Shared tests: **194 passed**.
- Assets tests: **13 passed**.
- AI tests: **9,357 passed**.
- Renderer tests: **477 passed**.
- Web visual/generation focused tests: **30 passed**.
- Repository typecheck/lint/build: **blocked before task execution by Turbo
  local TLS/keychain initialization (`Unable to set up TLS`; no keychain)**.
- `git diff --check`: run after document creation.
- Manual provider/browser latency and thumbnail verification: **pending**;
  no live provider session was started for this source-backed audit.

Code Complete: **YES** (documentation-only audit; no architecture or runtime
code changed).

Product Audit Complete: **YES — source-backed audit delivered**.

Product Verification: **PENDING** for live provider latency/visual thumbnails;
existing Sprint 13 browser verification remains the baseline evidence for the
pipeline and environment lifecycle.
