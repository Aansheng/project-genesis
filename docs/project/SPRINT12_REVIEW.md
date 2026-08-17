# Sprint 12 Review — AI Generation Product Baseline Freeze

## Sprint Goal

Freeze Sprint 12 as the first production-shaped AI game-design generation
baseline. This review records the real path and its limits; it adds no product
capability.

## Architecture Delivered

Architecture remains **v1.123 → v1.123**. The active path is:

`Genesis Studio → StudioCommandBar → gameStore → DefaultCommandExecutor →
DefaultCreateWorldRuntimeExecutor → DefaultCreateWorldPipeline.executeAsync →
GameIntent → GameDesignPromptBuilder → BrowserStructuredGenerationClient →
AI Gateway → AIProviderConfigurationService → StructuredGenerationClient →
OpenAI-compatible provider → candidate → strict parse → GameWorldValidator →
GameDesignSpecification → GameDesignWorldBuilder → GameWorldModel →
SemanticGameDslBuilder → RuntimeProjection → RuntimeWorldStore → gameplay
systems → Pixi → Genesis Studio`.

Generation diagnostics run in parallel through `GameWorldGenerationDiagnostics`
and `GameGenerationTrace` into the session-scoped Observatory generation view.

## AI Provider Architecture

`apps/web` owns only the browser gateway client and public settings client.
`packages/ai-server` owns provider configuration, server-side client
composition, and HTTP hosting. `packages/ai` owns vendor-neutral candidate,
prompt, validation, fallback, and semantic contracts.

## Server / Gateway Architecture

`POST /api/world-generation` validates the request, assembles the semantic
prompt, invokes the configured client, and returns only a candidate. Provider
errors become a safe gateway error; `/health` returns only `{ "status": "ok" }`.

## Structured Generation Contracts

Model output is untrusted `unknown` data. JSON parsing is strict; empty,
malformed, or truncated output is rejected. The validator is the only authority
that creates a `GameWorldModel`.

## GameDesignSpecification

The specification preserves title, genre, optional theme and difficulty,
objectives, entity categories, and optional roles. Only currently supported
world/entity data becomes executable output.

## Prompt Assembly

`DefaultGameDesignPromptBuilder` is deterministic and vendor-independent. It
describes the candidate contract and distinguishes realized semantics from
preserve-only semantics before transport.

## Validation

Validation enforces supported genre/category values, non-empty identifiers and
names, unique entity IDs, bounded entity/objective counts, valid difficulty,
theme shape, and objective types. Invalid candidates do not reach Runtime.

## Reliability

Defaults are `AI_MAX_OUTPUT_TOKENS=4000`, `AI_TIMEOUT_MS=30000`, and
`AI_MAX_ATTEMPTS=2`. Only timeout, transport/provider errors, and likely
truncated output retry. Validation failures are terminal; there is no infinite
retry.

## Deterministic Fallback

Unavailable, failed, malformed, empty, truncated, or invalid AI output enters
the deterministic provider. The world remains playable while diagnostics retain
the AI failure, reason, and attempt history. The final command is not mislabeled
as AI success.

## Observatory Generation Trace

Stages are `REQUEST`, `PROMPT_ASSEMBLY`, `MODEL_GENERATION`, `CANDIDATE_PARSE`,
`VALIDATION`, `DESIGN_SPECIFICATION`, `WORLD_COMPILATION`, and
`RUNTIME_INJECTION`. Runtime injection is marked successful after projection;
no credentials, headers, raw transport payloads, or model reasoning enter the
trace.

## Provider Configuration

Environment bootstrap reads `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`,
`AI_BASE_URL`, `AI_PORT`, `AI_HOST`, `AI_MAX_OUTPUT_TOKENS` (alias
`AI_MAX_TOKENS`), `AI_TIMEOUT_MS`, and `AI_MAX_ATTEMPTS`. Defaults are openai,
`gpt-4o-mini`, `127.0.0.1:8787`, 4000 tokens, 30 seconds, and two attempts.
Studio PUT configuration overrides current server-session values; in-flight
requests are unchanged.

Configuration survives **the current AI-server session only** and does not
survive restart. GET never returns the key, the browser does not persist it,
and the Settings form clears it after a successful save. OpenAI-compatible base
URLs and model selection work by configuration contract.

## Security Boundary

`AI_API_KEY` and authorization headers occur only in server-side configuration
and provider adapter code. No browser API-key configuration, Pinia key,
localStorage key, sessionStorage key, Observatory key, command-history key, GET
response key, trace key, or committed credential was found.

## Real Provider Verification

Verified manually after WO-S12-015 using the local Web and AI Server session:

- Settings saved the OpenAI-compatible DeepSeek configuration and Test
  Connection returned `Connected`.
- The rich ice/snow platformer request used the runtime gateway path after the
  Web app was already open: `source: ai`, `status: success`, validation passed,
  and the Runtime contained player, two patrol enemies, checkpoint, and boss.
- Full Observatory showed the candidate/specification and all eight pipeline
  stages, including successful Runtime Injection.
- The provider was disabled without reload; the next request produced
  `deterministic · fallback` with a truthful fallback trace. Re-enabling it
  restored `ai · success` on the next request without reload.

Product verification is **YES** for the runtime activation behavior. The
semantic/visual limitations described below remain unchanged.

## Semantic Capability Matrix Summary

Genre, title, player, multiple enemies, generic checkpoint/boss entities, and
objectives can be understood and preserved. Theme, difficulty, patrol, boss
combat, checkpoint behavior, and goal completion are not gameplay systems. The
renderer is still primitive geometry, not visual asset realization.

## Current Product Capability

Studio can generate a valid semantic world through the gateway when configured,
or a deterministic playable world when unavailable. The same runtime world is
visible in Explorer, Inspector, Pixi, and real-data Observatory surfaces.

## Known Limitations

- Provider configuration is memory-only; no authentication or rate limiting.
- Theme, difficulty, patrol, combat, checkpoint, boss behavior, multiplayer,
  trading, party, dungeon, and leaderboard systems are not implemented.
- Renderer output remains primitive and has no asset manifest or visual theme
  compilation.
- Real provider verification remains pending credentials and local server access.

## Technical Debt

See `docs/project/TECH_DEBT.md`. Baseline checks retain existing AI lint errors,
jsdom/Pixi canvas limitations, and stale web sidebar expectations for the
Generation panel.

## Test Baseline

- shared: 179/179 passed
- runtime: 657/657 passed
- AI: 9342/9342 passed; package typecheck has existing test-fixture drift in
  `CreateWorldRuntimeExecutor.test.ts`; lint has 4 errors and 116 warnings
- renderer: 473 tests passed, with 4 jsdom/Pixi canvas uncaught errors because
  jsdom does not implement `HTMLCanvasElement.getContext`
- AI-server: 9/11 passed; 2 HTTP-host tests were blocked by sandbox `listen
  EPERM` on `127.0.0.1`; focused gateway/config tests are 7/7 passed
- web: 4041/4043 passed; 2 existing i18n sidebar expectations omit the active
  Generation panel; focused AI/security/diagnostic tests are 35/35 passed
- AI-server and web typechecks passed; web build passed
- AI-server lint passed; web lint passed with warnings
- `git diff --check` passed

These are recorded as pre-existing repository debt or environment limitations;
the freeze audit changed documentation only and introduced no source changes.

## What Sprint 12 Intentionally Did Not Solve

No new AI capability, gameplay, theme rendering, sprites, assets, HUD
generation, provider routing, authentication, rate limiting, database,
persistent credentials, Studio redesign, or semantic schema expansion.

## Freeze Decision

**FROZEN with known gaps.** The architecture, security boundary, fallback,
reliability policy, trace contract, and semantic/visual boundary are documented.
The real-provider path and runtime activation transitions are verified. Remaining
semantic and visual limitations are intentionally deferred to Sprint 13.
