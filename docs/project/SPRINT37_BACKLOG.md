# Sprint 37 Backlog — CreateWorld Semantic Fidelity

This is a one-item Sprint 37 backlog. It contains exactly one product work
order generated from the measured semantic-fidelity gap. Sprint 36 is FROZEN
at v1.186. The item below is complete, and the repository stops at
`SPRINT37_FREEZE_REVIEW`; Sprint 38 is not entered.

## WO-S37-001 — Generic CreateWorld Supported-Archetype Intent Preservation

status: **DONE — Code Complete = YES; Product Verified = YES**
priority: **P0 / first smallest measured Sprint 37 semantic gap**  
architecture_before: **v1.186**  
architecture_after: **v1.187**

### Mission

Preserve clear, already-supported whole-world archetype intent at the existing
CreateWorld semantic extraction seam so provider context, deterministic
fallback, synchronous compatibility generation, Semantic World, and Game DSL
receive the correct typed `GameGenre`. Reuse the existing provider validation,
deterministic fallback, template catalog, DSL, Runtime, and world replacement
contracts.

### Measured bottleneck

`做一个农场游戏` correctly routes through the Sprint 36 front door to
CreateWorld in both a clean Studio and an active Survival Studio. The first
semantic loss occurs in `DefaultGameIntentExtractor`: the clear Chinese
`农场` signal is not recognized, so `GameIntent.genre` becomes `sandbox`.
The async provider request/prompt therefore receives `sandbox`; when the
provider fails, the deterministic provider passes that same typed intent to
`DefaultSemanticWorldGenerator`, which selects the one-entity Sandbox
template. The synchronous baseline also produces Sandbox. The existing Farm
template is present, and a controlled valid provider candidate with
`genre: farm` is already accepted into the eight-entity Farm composition.

### Allowed scope

- Minimal generic extension of the existing supported-archetype alias/predicate
  boundary in `DefaultGameIntentExtractor`.
- Preserve the typed `GameIntent` as the single integrated semantic input to
  provider context, deterministic fallback, Semantic World, and DSL.
- Add focused AI tests for clear supported aliases, provider request context,
  deterministic fallback, sync baseline, and unsupported/open-ended safety.
- Add or update Web production-path coverage for clean Farm and active
  Survival → Farm replacement, including world identity and Observatory
  diagnostics.
- Update only the required project/control-plane evidence after execution.

### Required acceptance contract

1. `创建 MarioWorld` and `生成一个平台跳跃游戏` remain `platformer` in the
   provider-success, deterministic-fallback, and sync paths.
2. `生成一个幸存者游戏` remains `survival` with its existing top-down
   composition in all applicable paths.
3. `做一个农场游戏` preserves `farm` as typed semantic intent and, on
   deterministic/provider-failure fallback, selects the existing Farm template
   and `Farm World` DSL rather than Sandbox. Do not require new Farm mechanics.
4. `创建一个 RPG` remains `rpg` and keeps the existing RPG composition;
   no combat system is required.
5. The provider remains candidate-only and validated. A provider failure or
   invalid/incomplete candidate still uses the existing safe deterministic
   fallback.
6. Unsupported/open-ended requests remain bounded and must not be forced into
   a fabricated archetype or a new classifier framework.
7. Current-world Evolution, explicit-new CreateWorld routing, world identity
   replacement, Runtime/Renderer authority, and Observatory lifecycle truth
   remain unchanged.

### Verification boundary

Run the five-row semantic matrix, affected AI/Web tests, TypeScript, ESLint,
Web build, relevant regressions, and `git diff --check`. In real Studio:

1. Clean session: submit `做一个农场游戏`; verify CreateWorld, a new world,
   `Design: farm`, `Farm World`, the existing eight-entity Farm default under
   deterministic fallback, and no browser diagnostics.
2. Active Survival: submit `做一个农场游戏`; verify a new world identity,
   no same-world Evolution mutation, the same Farm semantic result, and
   current Observatory truth.
3. Re-run Platformer and Survival smoke checks to prove the matrix remains
   stable.

### Forbidden scope and non-goals

- No Farm mechanics, crops, inventory, NPC schedules, or simulation depth.
- No RPG combat, quest expansion, or genre-specific Runtime branches.
- No `IntentRouter` changes; Sprint 36 routing is frozen and verified.
- No GenreClassifier, GenreRegistry, WorldTypeManager, ontology engine,
  LLM-only classifier, or speculative NLU framework.
- No new provider architecture, direct provider replacement, or validator
  relaxation.
- No arbitrary genre understanding and no broad open-ended interpretation.
- No legacy PromptBuilder/SemanticWorld path reconnection.
- No second Sprint 37 WO and no Sprint 38 entry.

### Execution status

Human/CTO authorized this work order on 2026-09-02. It is **DONE** with Code
Complete = YES and Product Verified = YES. The existing ordered supported
archetype alias boundary now recognizes `农场 → farm` in addition to `farm`,
preserving Platformer, Survival, RPG, and Sandbox fallback behavior. The
provider remains candidate-only; provider failure still uses the existing
deterministic provider, which now selects the existing eight-entity Farm
template for `做一个农场游戏`.

Verification passed: AI 9441/9441, Web 3583/3583, focused AI/Web regressions,
AI/Web TypeScript, AI/Web ESLint with zero errors, Web build, and
`git diff --check`. Real Studio clean Farm, active Survival → Farm replacement,
Platformer/Survival/RPG/unknown regressions, Observatory truth, and empty
browser diagnostics passed. Fresh Sprint 37 Gap Analysis is PASS with no
immediate P0 blocker.

next_gate: `SPRINT37_FREEZE_REVIEW` — Human/CTO decision; do not enter Sprint 38
