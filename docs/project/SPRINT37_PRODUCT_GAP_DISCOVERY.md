# Sprint 37 Product Gap Discovery — CreateWorld Semantic Fidelity

Human/CTO decision: Sprint 36 is FROZEN at v1.186 with
`WO-S36-001 — Generic Active-World New-World Intent Classification` complete
and Product Verified. Sprint 37 is authorized for CreateWorld semantic-fidelity
discovery only.

Status: **PASS — discovery complete; exactly one READY WO generated; WO not
executed; Sprint 38 not entered**

Architecture: **v1.186 → v1.186** for this discovery. No production
architecture or product capability changed.

## Discovery boundary

This pass begins after Sprint 36 routing has already selected CreateWorld. It
does not revisit `IntentRouter`, add genre mechanics, or make a provider an
authority. The question is narrower:

```text
clear whole-world request → CreateWorld → semantic interpretation
  → worldType → existing default composition → Game DSL → Runtime
```

The tested front door is:

```text
StudioCommandBar.submitCommand
  → gameStore.send
  → DefaultIntentRouter (CreateWorld already selected)
  → DefaultCommandExecutor.executeAsync
  → DefaultCreateWorldRuntimeExecutor
  → DefaultCreateWorldPipeline.executeAsync
  → GameWorldGenerationProvider / deterministic fallback
  → validated Semantic World
  → DefaultSemanticGameDslBuilder
  → DefaultRuntimeProjection
  → WorldStore / Runtime / Studio Observatory
```

The synchronous compatibility path was also traced. It uses the same
`DefaultGameIntentExtractor`, `DefaultSemanticWorldGenerator`, template
catalog, DSL builder, and Runtime projection, so it is a useful baseline for
the provider/fallback comparison.

## Current production semantic path

`DefaultCreateWorldPipeline` first extracts a typed `GameIntent` from the
domain model. In the async path it passes that intent into the generation
request. The configured local provider composition is:

```text
LLM candidate provider → GameWorldGenerationProviderAdapter
  → DefaultGameWorldValidator → DefaultGameDesignWorldBuilder
  → FallbackGameWorldGenerationProvider
  → DeterministicGameWorldGenerationProvider
  → DefaultSemanticWorldGenerator(request.intent)
```

The provider remains candidate-only. A valid provider candidate can supply a
supported `genre`/`worldType`; Genesis validates it and builds the semantic
world. Provider failure or an invalid/incomplete candidate enters the existing
deterministic provider. The deterministic provider passes the already
extracted `request.intent` to `DefaultSemanticWorldGenerator`, where the typed
intent is authoritative in the integrated CreateWorld path.

`DefaultWorldTemplateCatalog` is the current production composition source.
It contains the following bounded defaults:

| worldType | default entity count | current composition boundary |
| --- | ---: | --- |
| `platformer` | 7 | side-view platformer entities; existing movement/jump/gravity/collision/goal slice |
| `survival` | 6 | top-down Survival entities; existing movement, pursuit, offense, contact, XP/Level slice |
| `farm` | 8 | current Farm entity composition; player movement supported, Farm interaction/tending remain deferred |
| `rpg` | 9 | current RPG entity composition; only the current generic player movement is executable |
| `sandbox` | 1 | generic Player composition and generic movement |

This proves that the observed Farm loss is not caused by a missing Farm
template, a missing DSL branch, or a missing Runtime world type.

## Bounded semantic-fidelity matrix

The first four rows were exercised through the real CreateWorld source path.
The provider-success column uses a controlled valid candidate fixture to
exercise the existing provider adapter where the local gateway is unavailable;
it is not evidence that an external model returned that candidate. The real
local Studio run reported `provider_failed` and
`deterministic_fallback`, which is the product recovery path that matters for
offline behavior.

| request | route | extracted `GameIntent.genre` | valid provider candidate | deterministic/provider-failure fallback | DSL / current composition |
| --- | --- | --- | --- | --- | --- |
| `创建 MarioWorld` | CreateWorld | `platformer` | `platformer`, 7 entities | `platformer`, 7 entities | `Platformer World`; existing platformer gameplay slice |
| `生成一个平台跳跃游戏` | CreateWorld | `platformer` | `platformer`, 7 entities | `platformer`, 7 entities | `Platformer World`; existing platformer gameplay slice |
| `生成一个幸存者游戏` | CreateWorld | `survival` | `survival`, 6 entities | `survival`, 6 entities | `Survival World`; top-down Survival composition |
| `做一个农场游戏` | CreateWorld | **`sandbox`** | correct candidate `farm`, 8 entities | **`sandbox`, 1 entity** | provider candidate can select `Farm World`; actual fallback selects `Sandbox World` |
| `创建一个 RPG` | CreateWorld | `rpg` | `rpg`, 9 entities | `rpg`, 9 entities | `RPG World`; current generic movement only |

The matrix shows that current clear Platformer, Survival, and RPG signals
survive both provider and deterministic paths. Farm is the only measured
failure: the request is routed correctly but its typed semantic input is
already `sandbox` before the provider/fallback split.

## Farm trace and exact first divergence

Real Studio verification covered both required states:

1. In a clean session, `做一个农场游戏` created a new world through
   CreateWorld. Observatory showed `deterministic · fallback`, validation
   failed for the primary provider attempt, `Candidate: provider_failed`,
   `Design: sandbox`, one entity, and the generic Player composition.
2. In an active Survival session, the same command replaced the active world
   with a new world identity and showed the same deterministic Sandbox result.
   The existing world was not evolved in place.

The exact call-chain divergence is:

```text
StudioCommandBar
  → IntentRouter = CreateWorld                         ✓ routing is correct
  → DefaultGameIntentExtractor
  → GameIntent.genre = sandbox                         ✗ first semantic loss
  → provider request/prompt context genre = sandbox
  → deterministic fallback request.intent = sandbox
  → DefaultSemanticWorldGenerator resolves sandbox
  → WorldTemplateCatalog.sandbox = [player]
  → Sandbox World → one Runtime entity
```

`DefaultGameIntentExtractor` recognizes the English token `farm`, but its
current Farm predicate does not recognize the clear Chinese `农场` signal.
The RPG predicate similarly uses the current Latin `rpg` signal; it succeeds
for the tested request. The integrated generator does not independently
reclassify the original title after a typed intent has been extracted, so the
existing standalone/title compatibility detector cannot repair this loss.

The current Farm branch in the template catalog, layout, DSL, gameplay
specification builder, and rule builder is therefore downstream-reachable in
principle. A controlled valid provider candidate with `genre: farm` was
accepted by the existing validator and produced the eight-entity Farm
semantic composition. Conversely, the deterministic candidate and the sync
baseline both received `sandbox` and correctly produced the one-entity
Sandbox template for that already-lost intent. No validation weakening or
provider-direct world replacement is indicated.

## Supported concepts and reachability

The current `WorldType` union and production catalog still contain exactly
`farm`, `platformer`, `rpg`, `survival`, and `sandbox`.

- `platformer` is reachable through current Mario/platformer/Chinese platform
  aliases and reaches the seven-entity template and existing platformer
  composition.
- `survival` is reachable through current Survival/Survivor/Chinese survival
  aliases and reaches the six-entity top-down composition.
- `rpg` is reachable through the current Latin `rpg` signal and reaches the
  nine-entity RPG template, but no RPG combat or quest-system expansion is
  implied.
- `farm` is reachable through the current English `farm` signal and through a
  valid provider candidate, but the measured Chinese Farm request cannot
  preserve that supported type in the current extractor.
- `sandbox` is the intentional default for unknown, unsupported, or
  open-ended concepts; it is also the accidental result for the measured
  Chinese Farm request.

Historical PromptBuilder/strategy/semantic paths remain outside the current
CreateWorld production authority. The current provider prompt builder,
validator, deterministic provider, template catalog, DSL builder, and Runtime
projection are the relevant production path. No frozen legacy path is
reconnected by this discovery.

## Candidate ranking

1. **Generic supported-archetype intent preservation — selected.** A clear
   supported archetype is lost at the existing typed-intent extraction seam
   before both provider context and deterministic fallback. It has the
   smallest generic fix and explains the Farm result without changing routing
   or content mechanics.
2. Provider reliability — not selected. The observed provider failure is
   recovered safely, and a correct candidate is already validated and
   composable. Improving provider availability would not fix the deterministic
   semantic loss.
3. Farm default content depth — not selected. The Farm template and bounded
   Farm capability composition already exist; crops, inventory, schedules,
   and richer simulation are outside semantic classification.
4. RPG gameplay depth — not selected. RPG semantic classification succeeds;
   equal gameplay depth is not a Sprint 37 acceptance condition.
5. Broad natural-language understanding or arbitrary genre generation — not
   selected. Unsupported/open-ended requests may remain Sandbox or
   provider-driven.

## Exactly one READY work order

`WO-S37-001 — Generic CreateWorld Supported-Archetype Intent Preservation`

Status: **READY — generated only; not executed**

The work order should make the smallest generic change at the existing
`DefaultGameIntentExtractor` supported-alias boundary so clear requests for
already supported archetypes preserve their typed `GameGenre` into both
provider context and deterministic fallback. It must preserve current routing
and current-world mutation precedence. The implementation acceptance should
include the measured Chinese Farm request and the five-row semantic matrix,
with no regression for unsupported/open-ended input remaining Sandbox.

Expected implementation architecture: **v1.186 → v1.187 only if the
authorized work order changes the production semantic output**. The current
discovery state remains v1.186.

## Explicit non-goals

- No Farm mechanics, crops, inventory, NPC schedules, or richer Farm loop.
- No RPG combat, quests, or genre-specific Runtime implementation.
- No arbitrary genre generation or giant genre classifier.
- No `IntentRouter` change unless a future fresh audit proves routing wrong;
  this audit proves CreateWorld routing is correct.
- No new provider architecture, provider-authority bypass, validator
  weakening, or second semantic layer.
- No GenreClassifier, GenreRegistry, WorldTypeManager, ontology engine, or
  LLM-only classifier.
- No reconnection of frozen legacy PromptBuilder/SemanticWorld paths.
- No Sprint 38 entry and no second Sprint 37 product WO.

## Stop boundary and discovery verification

Sprint 36 is FROZEN at v1.186. Sprint 37 discovery is complete. Exactly one
READY WO is recorded in `SPRINT37_BACKLOG.md`; it is deliberately not
executed. The repository must stop here pending explicit execution
authorization, without entering Sprint 38.

Code Complete for `WO-S37-001`: **N/A — not executed**  
Product Verified for `WO-S37-001`: **N/A — not executed**  
Discovery evidence: **PASS** — source trace, focused semantic matrix, clean
Farm Studio verification, active Survival → Farm replacement verification,
and empty browser error/warning diagnostics.
