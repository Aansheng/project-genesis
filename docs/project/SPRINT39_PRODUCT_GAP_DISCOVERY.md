# Sprint 39 Product Gap Discovery — Cross-Genre Interaction Meaning

Date: **2026-09-02**

Human/CTO decision: Sprint 38 is **FROZEN** at v1.188 with
WO-S38-001 Code Complete = YES, Product Verified = YES, and the fresh Sprint
38 Gap Analysis = PASS. Sprint 39 Cross-Genre Interaction Meaning Discovery
was authorized.

Status: **DONE — exactly one READY WO generated; no product implementation
executed; Sprint 40 not entered**

Architecture: **v1.188 → v1.188**. This discovery changes no product code,
Runtime capability, renderer, provider contract, or architecture.

## Discovery boundary

The primary evidence used the normal Genesis Studio front door:

    StudioCommandBar
      → gameStore.send
      → IntentRouter / CreateWorld
      → provider candidate or deterministic fallback
      → Semantic World
      → Game DSL
      → Runtime projection
      → registered Studio Runtime systems
      → ENTITY_INTERACTION_REQUESTED
      → GameplayRule
      → trusted Runtime action
      → authoritative World state
      → Pixi Renderer / Observatory

The Farm request was generated repeatedly through the front door. Two
Provider-accepted Farm candidates were observed. A deterministic 8-entity
Farm world was then generated through the same front door only for a controlled
composition comparison; no world was manually constructed for the primary
Farm observation. The Gateway session configuration was restored after this
diagnostic. The RPG request was generated through the same front door and
produced the actual deterministic fallback after the Provider candidate was
reported as structurally invalid.

The current browser automation could deliver only sparse single-frame
movement events for a long walk. Therefore the current-session Enter checks
below intentionally record the truthful no-target behavior, while the
in-range success evidence is the already accepted Sprint 38 real-Studio proof:
Farm player-farmer → npc-merchant at distance 31 and RPG player →
quest-giver at approximately 36.67, both committing activated=true.

## 1. Real Farm play result

The repeated normal request was:

    做一个农场游戏

The two Provider-accepted candidates both classified as Farm and contained
five entities. The observed semantic compositions were:

| Candidate | Entities |
| --- | --- |
| Provider candidate A | player, farmland (terrain), farmhouse (building), crop (item), villager (npc) |
| Provider candidate B | player-farmer (player), terrain-farmland (terrain), building-farmhouse (building), item-seed (item), npc-villager (npc) |

The Studio surface exposed Arrow Keys — Move, Enter — Interact, and Space —
Jump. The Runtime interaction allowlist was npc. In both observed Provider
candidates, Player began at x=80, y=400 and the selected NPC was at x=172,
y=400, so the initial distance was 92, outside the Runtime interaction range
of 48. The deterministic comparison retained the existing eight entities:
player, merchant (npc), farmer (npc), barn, wheat-field, corn-field, storage,
and harvest-quest.

Before Enter, the Game canvas showed a large farm-like background and small
primitive/sprite entities, but no target marker, semantic interaction prompt,
or visible reason to choose the NPC. The Explorer exposed the semantic names;
the canvas did not.

In the deterministic comparison, Enter was pressed from Player x=86 while
merchant remained x=172. After Enter:

- the Runtime remained world-3 with 8 entities;
- Player remained x=86, y=400;
- Activity remained World created;
- no positive interaction feedback was shown;
- no activation, trace, diff, or event-stream result was produced.

This is the expected truthful no-target path, not a new reachability defect.
The accepted Sprint 38 in-range Farm proof shows that the same target can be
selected after movement and commits the target-specific Farm rule.

The question is whether that successful Farm interaction creates a Farm
activity. It does not: the current Farm rule commits only activated=true on
the NPC. No field, crop, storage, resource, merchant, quest, or Farm
progression state changes, and no next Farm action is created.

## 2. Real RPG play result

The normal request was:

    创建一个 RPG

The actual Studio result was world-1 with nine entities:

    player, villager (npc), merchant (npc), quest-giver (quest),
    enemy, boss (enemy), town (building), forest (terrain), main-quest (quest)

Full Observatory reported deterministic / fallback, validation failed,
selection deterministic_fallback, candidate structurally_invalid, and design
rpg. It reported two supported mechanics, one active rpg-interaction rule,
and the objective “Explore the world and interact with its quest characters.”

The Studio surface exposed Arrow Keys — Move, Enter — Interact, and Space —
Jump. The Runtime interaction allowlist was quest. Player began at x=80,
y=400; quest-giver was at x=512, y=384, approximately 432 Runtime units
away. Enter therefore had no eligible target in the current starting range.

Before Enter, the canvas showed a mostly dark field with small character
sprites and blue primitive geometry. The semantic labels were available in
the Explorer, not as a game-surface explanation.

After Enter:

- the Runtime remained world-1 with 9 entities;
- Player remained x=80, y=400;
- Gameplay remained active with experience=0 and level=1;
- Activity remained World created;
- Full/mini Observatory still reported no trace, timeline, history, diff, or
  event-stream data.

The accepted Sprint 38 in-range RPG proof establishes what happens after the
quest target is reached: rpg-interaction executes SET_ENTITY_PROPERTY and
commits activated=true. It does not advance main-quest or quest-giver state,
change Player progression, alter an enemy, or create a reason to interact
again.

## 3. Interaction consequence observed in each archetype

| Archetype | Reachable consequence already proven | State beyond activated=true | Next action / loop |
| --- | --- | --- | --- |
| Farm | farm-interaction selects one npc and commits a generic activation | None; no field, crop, resource, NPC, storage, merchant, or quest state transition | None |
| RPG | rpg-interaction selects one quest entity and commits a generic activation | None; no quest progress, NPC state, Player progression, enemy state, or objective transition | None |

The committed activation has a generic transient interaction cue, so this is
not primarily a missing-feedback-only problem. The authoritative state change
itself has little Farm or RPG gameplay meaning. The product currently proves
that a target can be activated, not that the requested archetype has started
a characteristic loop.

## 4. Player understanding without Observatory

The Player can infer that Arrow Keys move and Enter may interact because the
footer exposes those controls. The Player cannot infer:

- which entity is the intended target;
- why that entity is interactable;
- what the interaction is expected to accomplish;
- whether a successful interaction changed a Farm or RPG objective;
- what action should follow the generic cue.

The Explorer and Observatory make Runtime facts inspectable, but they do not
turn activated=true into a meaningful game result. The canvas review also
found that Farm and RPG semantic identity is visually weak: the scene is
dominated by background/primitive geometry and small entities without
semantic affordances.

## 5. Provider Farm completeness observations

The repeated Provider result was 5 entities versus the deterministic baseline
of 8. The Provider candidates omitted some baseline roles, including the
deterministic merchant/farmer/storage/harvest-quest combination, but they
retained a player, Farm environment, a resource-like item, and an npc. The
supported Farm interaction therefore remained semantically and
production-reachable in principle.

This sample is sufficient to record recurring composition variance, but not
to promote entity count to a product contract. Count difference alone is not
P0. The evidence does not show that the Provider candidate universally omits
the only capability-critical target or that candidate acceptance should be
changed. Keep this as a separate future measurement:

    PROVIDER CANDIDATE SEMANTIC COMPOSITION COMPLETENESS VARIANCE

No Provider completeness gate, Farm template, fallback policy, or candidate
acceptance rule is changed by this discovery.

## 6. Spatial and control observations

Farm and RPG both inherit the current platformer-style Studio composition:
Arrow Keys movement, gravity/vertical motion, ground collision, and Space —
Jump. This is visibly weaker than the requested archetype identity; neither
session exposes a characteristic Farm or RPG spatial affordance. Farm/RPG
interaction is still registered through the generic Runtime path, so the
control mismatch is recorded as a secondary presentation/composition gap.

The current evidence ranks the meaning gap above spatial redesign: even after
an in-range target is selected, the result remains activated=true. No spatial,
control, or renderer repair is executed.

## 7. First production reachability/meaning break

The representative production trace is:

    GameIntent
      → Semantic World (farm or rpg)
      → Game DSL
      → Runtime entities and Position
      → Enter edge and finite-range target selection
      → ENTITY_INTERACTION_REQUESTED
      → farm-interaction or rpg-interaction
      → SET_ENTITY_PROPERTY(target, activated=true)
      → authoritative World mutation
      → generic committed interaction cue

The no-target branch stops truthfully before the event and produces no fake
success. Once reachability is established, the first point at which
archetype-specific meaning ends is the existing GameplayRule action:
SET_ENTITY_PROPERTY with activated=true. There is no subsequent trusted
state transition that represents a Farm or RPG consequence.

## 8. Shared missing primitive

Farm and RPG share the same next missing primitive:

    Player interaction
      → semantic state transition beyond generic activation
      → visible characteristic consequence
      → truthful next action or loop

The target categories and rule IDs are correctly composed per archetype; the
missing piece is the post-interaction meaning, not a second interaction
architecture. No new abstraction is proposed by this discovery.

## 9. Single highest-priority Product blocker

**SUPPORTED ARCHETYPE INTERACTIONS LACK MECHANICALLY MEANINGFUL CONSEQUENCES**

This ranks highest because it is visible in normal play, affects whether both
newly reachable worlds feel like the requested genre, survives the accepted
in-range Farm/RPG proofs, reuses the existing trusted action/state boundary,
and is smaller than a Farm engine, RPG system, Provider gate, or spatial
redesign. The Provider 5-vs-8 difference and inherited Jump presentation are
recorded but not selected.

## 10. Exactly one READY work order

### WO-S39-001 — Generic Archetype Interaction Consequence (first bounded slice)

status: **READY — not executed**

priority: **P0 / highest-priority shared Farm and RPG meaning blocker**

architecture_before: **v1.188**

architecture_after: **v1.189 expected only if this WO is later authorized and
executed; current architecture remains v1.188**

measured_blocker: Farm and RPG now reach one semantic target through
Enter → ENTITY_INTERACTION_REQUESTED → target-specific GameplayRule, but the
trusted result stops at activated=true and creates no characteristic
archetype gameplay consequence or next loop.

mission: At the existing Player input → Runtime event → GameplayRule →
trusted action → authoritative World → Renderer/Observatory boundary, make
one existing supported Farm or RPG interaction produce a characteristic,
mechanically meaningful result. Select the smallest archetype and existing
typed action/state mechanism during the implementation audit. Do not
preselect a Farm mechanic, quest, dialogue behavior, Provider repair, or
spatial redesign.

dependencies:

- Sprint 38 is frozen at v1.188 and WO-S38-001 remains the reachability
  prerequisite.
- Existing Runtime target selection, ENTITY_INTERACTION_REQUESTED event,
  GameplayRule matcher, immutable World store, and committed feedback
  projection remain the only required seams.
- Deterministic Farm 8-entity and RPG 9-entity paths remain the regression
  baselines; Provider candidates remain candidate-only.

allowed scope:

- Audit and reuse the smallest existing trusted action/state contract that
  can express one characteristic result beyond activated=true.
- Compose the result through the existing generic interaction request and
  GameplayRule path.
- Preserve Runtime authority, immutable state, target identity, no-target
  truth, repeated no-op behavior, and committed-result feedback.
- Prove the selected slice through the normal Farm or RPG front door and
  Observatory truth. Cover the sibling archetype only if the same generic
  contract applies without expanding scope.

forbidden scope:

- No Farm engine, FarmingSystem, crop simulation, inventory, economy,
  schedules, or broad farming loop.
- No RPG dialogue tree, quest framework, combat system, party, stats, or
  progression expansion.
- No Provider completeness repair, entity-count requirement, fallback
  forcing, or candidate-authority change.
- No spatial redesign, FarmRenderer, RPGRenderer, universal interaction
  ontology, InteractionManager, new input authority, legacy reconnection,
  or speculative framework.
- No second Sprint 39 work order and no Sprint 40 entry.

acceptance:

1. The normal Farm and RPG front doors still preserve their current
   supported semantic baselines and Sprint 38 interaction reachability.
2. At least one selected Farm or RPG interaction commits a characteristic
   authoritative state transition beyond activated=true using an existing
   trusted action/state mechanism.
3. The committed result is understandable on the Game surface without
   requiring Observatory, and the next available action or truthful
   no-next-action state is clear.
4. No-target Enter remains no event/no mutation/no fake success, and repeated
   successful interaction remains a truthful no-op unless the chosen
   consequence explicitly supports a bounded repeat.
5. Platformer and Survival controls, rules, session state, and feedback
   remain regression-clean. Provider candidates remain candidate-only.

verification:

- Add focused production-path regression for the selected archetype,
  including front door, Runtime target, event, Rule, trusted action,
  authoritative diff, committed feedback, no-target, and repeated-input
  truth.
- Run affected package tests, TypeScript, ESLint, relevant regression suites,
  and Web build when the Web/runtime path changes.
- Perform real Studio Product Verification with the exact normal prompt,
  before/after canvas observation, Explorer/Observatory cross-check, and
  browser warning/error capture.

observability: Trace the request event, selected target, rule, action,
committed World diff, Renderer feedback, and any deliberate no-op. Do not
report semantic success from an uncommitted or Observatory-only observation.

completion_report: Record architecture before/after, files, real flow,
tests, TypeScript, ESLint, remaining gaps, manual Product Verification,
Code Complete, and Product Verified. Mark this WO DONE only after the
selected consequence is reachable through the production path.

This WO is generated for later review only. It is not executed in this
continuation.

## 11. Explicit non-goals

- No product-code change during Sprint 39 discovery.
- No architecture change, ADR, second WO, or speculative framework.
- No preselected Farm mechanic, quest, dialogue, resource, economy, or
  Provider completeness repair.
- No spatial/control redesign or renderer-only patch.
- No weakening of candidate validation or deterministic fallback.
- No legacy-path reconnection.
- No Sprint 40 entry.

## Stop boundary

Sprint 38 is FROZEN at v1.188. Sprint 39 discovery is complete with exactly
one READY WO, WO-S39-001. The repository stops at the Sprint 39 freeze-review
gate; the READY WO is not executed and Sprint 40 is not entered.
