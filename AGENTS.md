# Project Genesis — Codex Engineering Instructions

## Mission

Project Genesis is an AI-native game engine.

Primary target:

Natural Language
→ Intent
→ Semantic World
→ Game DSL
→ Runtime
→ Renderer
→ Playable Game
→ Natural-language world evolution

Always optimize for completing this end-to-end product pipeline.

Do not over-invest in isolated infrastructure if it does not move the playable pipeline forward.

---

## Source of Truth

Before starting any work, read:

1. AGENTS.md
2. docs/project/PROJECT_STATE.md
3. docs/project/CHANGELOG.md
4. latest relevant ADRs
5. actual implementation files related to the task

Never trust documentation blindly.

Source-code runtime wiring is the final source of truth.

If documentation and source code disagree:

- report the mismatch
- follow the actual implementation
- update documentation when appropriate

---

## Before Every WO

Before modifying code:

1. Recover the current architecture version.
2. Read the current WO context.
3. Trace the real call chain involved.
4. Identify the exact missing capability or defect.
5. Search for existing abstractions before creating new ones.
6. Confirm package ownership.
7. Check whether a legacy implementation is still active.

Do not start implementation until the architecture path is understood.

---

## Architecture Rules

Preserve dependency boundaries.

Target pipeline:

apps/web
→ @genesis/ai
→ @genesis/shared / Game DSL
→ @genesis/runtime
→ @genesis/renderer

Avoid:

- AI importing renderer implementation details
- Runtime depending on PixiJS
- Renderer interpreting natural language
- UI owning runtime domain logic
- duplicate transformation layers
- unnecessary Manager / Factory / Hydrator abstractions

Reuse existing abstractions whenever possible.

---

## Current Legacy Awareness

Project Genesis has historically contained legacy paths.

Always verify whether production UI still uses:

- MockPlanner
- legacy Planner action routing
- Canvas2D renderWorld()
- mock Observatory initialization
- dormant streaming UI

Do not assume a newer subsystem is actually connected to apps/web.

---

## Implementation Policy

Prefer:

minimal changes
existing abstractions
dependency injection
pure functions
deterministic behavior
immutable outputs
backward compatibility

Avoid speculative architecture.

Do not implement future systems unless required by the current WO.

---

## Testing Requirements

After implementation run:

1. targeted tests
2. affected package tests
3. TypeScript checks
4. ESLint
5. relevant regression suites
6. build when the web/runtime integration changed

Never report completion while tests fail.

---

## Product Verification

Passing tests does NOT automatically mean a WO is complete.

For user-visible changes, always provide:

### Expected User Behavior

Describe exactly what should happen when the user runs the application.

Example:

Input:
创建 MarioWorld

Expected:

- command succeeds
- runtime world is replaced
- Pixi canvas renders entities
- no Unknown command result

Mark completion separately:

Code Complete: YES/NO

Product Verification: YES/NO/PENDING

Do not call a WO fully complete if product verification is still pending.

---

## Documentation

For architecture-changing WOs:

- create/update ADR
- update docs/project/PROJECT_STATE.md
- update docs/project/CHANGELOG.md
- update architecture version when required

PROJECT_STATE.md must reflect actual application behavior, not only implemented APIs.

---

## PROJECT_STATE Requirements

Keep these sections current:

Architecture Version

Current Sprint

Last Completed WO

Current User-Visible Behavior

Current End-to-End Pipeline

Current Blocking Issue

Known Legacy Paths

Next Recommended Verification

---

## Git Hygiene

Before completion:

git status
git diff
git diff --check

Ensure unrelated files were not changed.

Prefer one WO per commit.

Do not commit generated or unrelated files unless required.

---

## Completion Report

Every WO completion report must contain:

- architecture version before → after
- files created
- files modified
- real architecture flow
- tests executed
- TypeScript result
- ESLint result
- constraints honored
- known remaining gaps
- manual product verification steps
- Code Complete status
- Product Verified status

---

## Important

Do not blindly continue the roadmap.

If manual product behavior reveals a different bottleneck than the planned WO:

stop,
diagnose,
report,
and recommend addressing the real bottleneck first.
