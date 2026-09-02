# ADR-0296 — Generic Active-World New-World Intent Classification

- **Date:** 2026-09-01
- **Status:** Accepted after implementation and verification gates
- **Architecture:** v1.185 → v1.186
- **Work order:** `WO-S36-001 — Generic Active-World New-World Intent Classification`

## Context

Sprint 36 discovery found a production front-door mismatch. When a world was
already active, named or whole-world requests such as `创建 MarioWorld`,
`创建一个 RPG`, and `生成一个幸存者游戏` were returned as `unknown` by the
existing `DefaultIntentRouter`. The Web store intentionally sends active-world
unknown input to the mutation-only World Evolution planner, so those requests
failed without reaching the existing CreateWorld replacement path.

The existing boundaries were otherwise correct: entity-scoped requests such as
`再创建5个怪物` and `再加五只怪` preserve the active world through Evolution,
explicit new/reset requests use CreateWorld, and AI output is a candidate that
Genesis validates rather than a source of world authority.

## Decision

Keep the classification at the existing pure `IntentRouter` and Web front-door
seam. Apply the following precedence:

1. Current-world entity, quantity, property, evolution, and continuation
   signals remain World Evolution.
2. Explicit new/reset semantics remain CreateWorld in either context.
3. A clear whole-world/game construction signal or a named-world signal, with
   no current-world mutation signal, uses the existing CreateWorld route even
   when a world is active.
4. Bare or underspecified creation remains `unknown` in an active world, so it
   cannot silently replace the current world. The existing active-world AI
   fallback remains bounded by its candidate validation and revision guards.
5. CreateWorld continues through the existing provider/deterministic fallback,
   validated semantic generation, Runtime replacement, and Observatory
   rebinding contract. World Evolution continues through its existing AI
   candidate path.

The implementation uses generic construction/scope and named-label predicates.
It does not add a genre/name registry, a phrase-specific Mario branch, a
`contains 创建` rule, a second router, a provider-direct replacement path, or
an NLP/NLU framework.

## Consequences

- Active `创建 MarioWorld`, `创建一个 RPG`, `生成一个幸存者游戏`, and
  `做一个农场游戏` now replace the active world through CreateWorld.
- Active entity mutations retain the same world identity and Evolution lineage.
- Explicit-new behavior remains unchanged, and ambiguous `创建`, `生成一个`,
  and `做一个新的` remain non-replacing.
- World content remains the responsibility of the existing CreateWorld
  provider/fallback. A content/provider failure after correct routing is not a
  routing failure.
- Runtime, Renderer, Semantic World, gameplay authority, session replacement,
  and asset execution architecture do not change.
- Broader natural-language ambiguity and deterministic target-vocabulary
  coverage remain deferred and require separate discovery/authorization.

## Verification

- AI focused `IntentRouter`: **163/163**.
- Web World Evolution/CreateWorld integration: **26/26**.
- AI planner regression: **15/15**; Web routing/gameplay/Observatory
  regressions: **29/29**.
- Full affected packages: AI **9439/9439**, Web **3581/3581**.
- AI/Web TypeScript: **pass**; AI/Web ESLint: **0 errors**; Web build and
  `git diff --check`: **pass**.
- Real Studio: active Survival `world-1` (6 entities) retained its ID and
  reached 11 entities after `再创建5个怪物`; `创建 MarioWorld` created
  `world-2` with seven Platformer entities and `Space — 跳跃`; and
  `生成一个幸存者游戏` created `world-3` with six entities and
  `Space — 攻击`. RPG, Farm, explicit-new, ambiguous, `再加五只怪`, and
  Platformer Space smoke checks also passed. Observatory showed v1.186 /
  Sprint 36 and current asset/runtime projections; browser error/warning
  diagnostics were empty.
- Fresh Sprint 36 Gap Analysis: **PASS**; the repository stops at
  `SPRINT36_FREEZE_REVIEW` and does not enter Sprint 37.
