# Project Genesis — Engineering Work Queue

Git-tracked queue for the Supervisor. It is intentionally a Markdown document,
not a database or task service.

queue_version: 1
updated: 2026-08-24
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
- Control-plane work orders must not execute product work or satisfy a product
  Product Verification gate as a side effect.

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

## WO-S15-005 — Enemy Stomp Gameplay Rule Vertical Slice

status: DONE
priority: P1
dependencies: WO-S15-004 DONE; measured Studio bottleneck satisfied by the
  approved ENEMY STOMP decision
architecture_before: v1.151
architecture_after: v1.152
architecture_expected_after: v1.152
mission: Execute the approved generic enemy-stomp scenario end to end: a
  Runtime-owned AABB contact from player above enemy emits direction=top,
  matches the enemy-stomp GameplayRule, validates player/enemy/top conditions,
  and commits remove-target plus upward player velocity while preserving the
  existing Runtime/Renderer loop.
allowed_scope: Finalize the typed contact-direction event contract; derive
  direction only from Runtime position/collision-bounds geometry; execute the
  existing generic GameplayRuleSet through the smallest trusted APPLY_VELOCITY
  primitive; define rule-level staged all-or-nothing semantics for the two
  trusted actions; update Genesis capability truth, focused regressions,
  Observatory evidence, and real Studio product verification.
forbidden_scope: Mario-specific Runtime/System or EnemyStompSystem; damage,
  health, goals, score, XP, timers, spawners, question blocks, arbitrary code,
  eval/scripts, generic transaction framework, rich gameplay engine, silent
  partial commits, Runtime/world/Renderer full rebuild, provider capability
  authority, gameplay-rule evolution, or automatic WO-S15-006 continuation.
acceptance: ENEMY STOMP is supported only through the generic rule path;
  contact direction is a truthful Runtime geometry fact; top contact matches
  and non-top contact does not; player/enemy conditions pass; REMOVE_ENTITY
  and APPLY_VELOCITY both commit exactly once; a failed later action rolls back
  earlier staged actions without partial commit; stale RuleSet/World A facts
  cannot affect World B; deferred damage remains visibly non-executed; tests,
  architecture review, and required product verification pass.
verification: PASS — Runtime/Shared/AI/Web focused and affected-package tests,
  TypeScript, ESLint, relevant regression suites, web build, git diff check,
  independent architecture review, and AUTO/MANUAL/PENDING/BLOCKED Product
  Verification classification. Browser evidence showed contact direction,
  rule match, conditions passed, both action results, enemy removal in Runtime
  and Renderer, upward bounce, re-landing, continued control, no camera reset,
  no rebuild, exactly-once behavior, stale isolation, and clean console.
product_verification: YES — MANUAL Studio verification completed on 2026-08-21;
  AUTO gates cover stale isolation, rollback, exactly-once, and Observatory
  truth, while the real browser path covers the visible gameplay sequence.
human_decision_required: NO — ENEMY STOMP and its acceptance boundary were
  explicitly approved in the Supervisor request on 2026-08-21.

## WO-META-004 — Subagent Delegation & Lifecycle Hardening

status: DONE
priority: P0
dependencies: WO-S15-005 DONE; Supervisor Trial #1 evidence available
architecture_before: v1.152
architecture_after: v1.152
mission: Harden delegation granularity, lifecycle/wait semantics, evidence
  ownership, and current Supervisor rollout policy without changing product
  architecture or executing the next product work order.
allowed_scope: Engineering Markdown policy and projections; Trial #1 lessons
  and PASS/FAIL scorecard; bounded subagent task contracts; targeted-test
  boundary; lifecycle/cancellation/checkpoint rules; evidence ownership;
  concurrency and worktree rules; Completion Report extension; S15-006 READY
  preparation; one optional narrow read-only delegation test; dry-run records.
forbidden_scope: Genesis product code; Runtime, Gameplay, Renderer, AI
  provider, or Web changes; new dependencies; orchestration server, database,
  queue service, custom RPC, recursive agent tree, SPRINT_CONTINUOUS, or
  execution of WO-S15-006.
acceptance: PASS — Trial #1 lessons are recorded; delegated tasks are one
  bounded question or code slice; subagent tests are targeted by default;
  Supervisor owns all final gates; waits alone do not imply failure;
  cancellation and zero-evidence rules are explicit; timed-out reviewers do
  not satisfy gates; max concurrent subagents is 2; nested spawning is
  disabled; shared contracts remain Supervisor-owned; prompt templates,
  re-delegation budget, report extension, and trial scorecard are documented;
  WO-S15-006 is prepared READY with the approved DAMAGE/HEALTH boundary; dry
  run and optional narrow delegation test are truthful; no product source
  changed.
verification: PASS — Markdown inspection, work queue/current state review,
  policy dry run, one bounded read-only Health audit, agent lifecycle close,
  no product-source diff, and `git diff --check`.
product_verification: NOT_APPLICABLE — control-plane-only change; WO-S15-005
  remains the last Product Verified product work order.
human_decision_required: NO — Trial #1 tuning and the S15-006 scenario were
  explicitly provided/accepted in the Supervisor request on 2026-08-24.

## WO-S15-006 — Damage / Health Gameplay Rule Vertical Slice

status: DONE
priority: P1
dependencies: WO-S15-005 DONE; measured gameplay goal recorded; DAMAGE/HEALTH
  scenario accepted on 2026-08-24
architecture_before: v1.152
architecture_after: v1.153
architecture_expected_after: v1.153
mission: Prove the smallest generic side-contact damage path: player side
  contact with an enemy produces a truthful Runtime contact fact, matches a
  generic rule, executes trusted `DAMAGE_ENTITY(eventActor)`, and decreases an
  authoritative generic Health value without introducing death/game-over
  systems.
allowed_scope: Generic Health component/state; typed `DAMAGE_ENTITY` action;
  generic side-contact rule; existing Runtime event/rule/mutation boundaries;
  stale/world isolation; truthful Observatory execution state; targeted tests
  and required browser Product Verification.
forbidden_scope: EnemyDamageSystem or Mario-specific Runtime; generated code;
  full rebuild; respawn; lives; game-over UI; death flow unless a minimum
  truthful zero-health representation is strictly unavoidable; invincibility
  frames unless measured behavior proves required; knockback; XP; score; goal
  completion; enemy AI; timers; spawners; progression; unrelated rich actions;
  arbitrary code/eval; autonomous WO continuation.
acceptance: PASS — Supervisor fixed the shared Health/DAMAGE_ENTITY contract;
  generic rule-driven non-top contact damage decreases authoritative current
  Health, preserves max, fails safely without Health, keeps zero as state only,
  and introduces no death/game-over system. Existing binding, stale/world,
  exactly-once, and truthful deferred-rule gates remain active.
verification: PASS — Shared/Runtime/AI/Renderer/Web affected-package tests,
  direct TypeScript checks, direct ESLint checks, Web build, git diff check,
  ADR/architecture review, and real Chrome Studio Product Verification pass.
product_verification: YES — MANUAL Studio verification completed on
  2026-08-24; full Observatory showed ENTITY_CONTACT_STARTED followed by
  committed enemy-contact-damage / DAMAGE_ENTITY execution, and Inspector
  Health changed from 100/100 to 93/100.
human_decision_required: NO — scenario selection was accepted previously and
  the detailed implementation contract was fixed by the Supervisor at start.

## Queue transition vocabulary

BLOCKED → READY only after the blocking decision or dependency is resolved.
READY → IN_PROGRESS only after dependency and human-decision gates pass.
IN_PROGRESS → VERIFYING after implementation is complete.
VERIFYING → DONE only when all required gates pass.
VERIFYING → FAILED or BLOCKED when the repair budget or an escalation rule is
  reached.
