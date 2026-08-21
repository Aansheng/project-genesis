# Project Genesis — Engineering Work Queue

Git-tracked queue for the Supervisor. It is intentionally a Markdown document,
not a database or task service.

queue_version: 1
updated: 2026-08-21
continuation_mode: ONE_WORK_ITEM
primary_architecture_changing_work_items_in_progress: 0

## Queue rules

- Select the highest-priority READY item with satisfied dependencies.
- A READY item with an open human decision is selectable for review but cannot
  enter IN_PROGRESS until the decision is recorded.
- At most one primary architecture-changing work item may be IN_PROGRESS.
- A work item is DONE only after implementation, verification, architecture
  review, and Product Verification gates required by that item pass.
- WO-META-003 must not execute product work as a side effect.

## WO-S15-004 — Minimal Gameplay Rule Execution Vertical Slice

status: DONE
priority: P0
dependencies: WO-S15-003
architecture_before: v1.150
architecture_after: v1.151
mission: Execute one truthful contact-to-remove gameplay rule through Runtime.
allowed_scope: Bounded matching, supported conditions, one REMOVE_ENTITY action,
  existing WorldMutator, result observation, and regression/product verification.
forbidden_scope: Score, damage, goals, timers, spawn, arbitrary code, rich
  transactions, and gameplay-rule evolution.
acceptance: PASS — player contact with an item can remove the target; deferred,
  stale, unsupported, and Player-removal paths remain gated.
verification: Runtime/Renderer/Shared/AI/Web checks and local Studio browser
  verification passed; see ADR-0265 and SPRINT15_BACKLOG.md.
product_verification: YES
human_decision_required: NO

## WO-META-003 — Genesis Multi-Agent Engineering Supervisor Foundation

status: DONE
priority: P0
dependencies: WO-S15-004
architecture_before: v1.151
architecture_after: v1.151
mission: Establish a repository-native Supervisor control plane for bounded,
  human-controlled future engineering work.
allowed_scope: Engineering Markdown projections, Supervisor operating policy,
  delegation/review rules, queue preparation, dry-run documentation, and a
  minimal AGENTS.md pointer.
forbidden_scope: Genesis Runtime, Gameplay, Renderer, provider, application
  service, CI deployment, external orchestration dependency, database, queue
  service, auto-merge, or autonomous product work.
acceptance: PASS — all seven control documents exist; authority, loop, repair
  budget, escalation, roles, delegation, worktrees, gates, continuation mode,
  and next READY item are documented.
verification: Markdown inspection, dry run, source/wiring audit, git diff check,
  and read-only architecture review delegation.
product_verification: NOT_APPLICABLE — no user-visible product behavior changed.
human_decision_required: NO

## WO-S15-005 — Next Gameplay Capability Boundary

status: READY
priority: P1
dependencies: WO-S15-004 DONE; measured Studio bottleneck required
architecture_before: v1.151
architecture_expected_after: TBD after human-approved scenario; no bump is
  implied by queue status
mission: Select and implement one concrete event-driven gameplay scenario that
  addresses a measured product bottleneck while keeping Runtime facts, rule
  interpretation, trusted mutation, and result observation separate.
allowed_scope: Record the measured bottleneck; choose one event/condition/action
  path; finalize its shared contract; extend only the minimum trusted Runtime
  primitive; add focused tests, architecture review, and required product
  verification.
forbidden_scope: Broad gameplay engine, generic Manager/workflow layer, score
  or state store without a scenario need, multiple unrelated mechanics,
  provider-executed code, eval/scripts, full-world rebuild, or autonomous
  Sprint continuation.
acceptance: Scenario and user-path evidence are approved; capability truth,
  authority boundaries, stale-world behavior, and unsupported behavior are
  explicit; tests and required product verification pass.
verification: Targeted tests, affected package tests, TypeScript, ESLint,
  regression/build checks as applicable, architecture review, and AUTO/MANUAL/
  PENDING/BLOCKED Product Verification classification.
product_verification: REQUIRED when the chosen scenario changes user-visible
  gameplay; evidence must be real user-path evidence.
human_decision_required: YES — choose the scenario and acceptance boundary
  after reviewing the measured bottleneck.

## Queue transition vocabulary

BLOCKED → READY only after the blocking decision or dependency is resolved.
READY → IN_PROGRESS only after dependency and human-decision gates pass.
IN_PROGRESS → VERIFYING after implementation is complete.
VERIFYING → DONE only when all required gates pass.
VERIFYING → FAILED or BLOCKED when the repair budget or an escalation rule is
  reached.
