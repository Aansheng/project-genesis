# Project Genesis — Engineering Work Queue

Git-tracked queue for the Supervisor. It is intentionally a Markdown document,
not a database or task service.

queue_version: 1
updated: 2026-08-24
continuation_mode: SPRINT_CONTINUOUS
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
- Under `SPRINT_CONTINUOUS`, a completed product WO triggers one bounded gap
  analysis and exactly one generated next READY/BLOCKED WO. The Supervisor may
  execute that one next WO in the same Sprint only after its dependencies,
  decision gates, and verification scope are satisfied.
- The queue horizon is completed history plus one current READY/BLOCKED item;
  do not pre-generate a future Sprint backlog.
- `SPRINT_CONTINUOUS` is sequential, not parallel: only one primary WO is
  selected/executed at a time, and each discovery pass may generate exactly one
  next WO.
- A generated WO is READY only after the evidence, scope, dependency,
  architecture, verification, and human-decision quality gates pass. An open
  high-impact authority or product-direction choice makes it BLOCKED.
- If the current Sprint checkpoint is already satisfied, generate
  `SPRINT_FREEZE_REVIEW` instead of another feature WO and stop for review.
- At the Sprint boundary, after freeze/review evidence is complete, stop and
  require explicit Human/CTO direction before entering another Sprint.
  `SPRINT_CONTINUOUS` never executes across Sprint boundaries automatically.
- A completed Sprint Freeze Review may generate at most one high-level next
  Sprint discovery or BLOCKED human-decision item; it must not pre-generate a
  future Sprint feature backlog or cross the Sprint boundary automatically.

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

## WO-META-005 — Next-Work Discovery & Gap Analysis Foundation

status: DONE
priority: P0
dependencies: WO-S15-006 DONE; current Sprint goal and Product Verified
  capability evidence available
architecture_before: v1.153
architecture_after: v1.153
architecture_expected_after: v1.153
mission: Upgrade the Supervisor from executing human-prepared work items to
  discovering exactly one bounded next work item from the current Sprint goal
  and measured repository gaps, without executing that generated item.
allowed_scope: Engineering control-plane Markdown; explicit Sprint 15 goal;
  gap classification; measured-bottleneck policy; just-in-time WO generation;
  human-decision detection and decision log; short queue horizon;
  ONE_WORK_ITEM_WITH_DISCOVERY semantics; Sprint freeze detection; Trial #1/#2
  records; dry-run evidence and generated WO quality gate.
forbidden_scope: Genesis product code; Runtime, Gameplay, Renderer, AI,
  provider, or Web changes; next product WO execution; SPRINT_CONTINUOUS;
  full future roadmap generation; scoring/ML prioritization; project-management
  database; external issue tracker; new orchestration dependency.
acceptance: PASS — current Sprint 15 goal is explicit; gap classification and
  measured-bottleneck rules exist; exactly one next WO is generated; source
  evidence supports the selection; alternatives are recorded; human-decision
  detection, quality gates, freeze detection, out-of-Sprint deferral, and short
  horizon are documented; Trial #1/#2 and zero-subagent validity are recorded;
  continuation mode is ONE_WORK_ITEM_WITH_DISCOVERY; SPRINT_CONTINUOUS remains
  disabled; the generated WO is not executed; no product architecture/code
  changed.
verification: PASS — control-plane consistency, source/capability evidence
  audit, generated-WO self-review, queue dependency/state review, current
  architecture check, and git diff check.
product_verification: NOT_APPLICABLE — control-plane-only change; last product
  verification remains the MANUAL WO-S15-006 Studio evidence.
human_decision_required: NO — this META WO records the decision gate but does
  not choose the goal-completion authority.
historical_generated_next_work_order: WO-S15-007 BLOCKED → unblocked by the
  accepted Human/CTO decision recorded in HUMAN_DECISION_LOG.md
optional_architecture_review: PASS — Supervisor read-only self-review against
  the invariants; no subagent was needed for this docs-only generated-WO audit.
historical_note: The continuation assertions above describe the control-plane
  state when WO-META-005 completed. The current queue mode is the later
  explicitly accepted `SPRINT_CONTINUOUS` policy declared at the top of this
  file.

## WO-S15-007 — Goal Completion Gameplay Rule Vertical Slice

status: DONE
priority: P1
state_transition: BLOCKED → READY (Human decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: WO-S15-006 DONE; Human/CTO completion-authority decision ACCEPTED
  on 2026-08-24
architecture_before: v1.153
architecture_after: v1.154
architecture_expected_after: v1.154 — RuntimeGameplaySessionState owns the
  current world/session completion truth while preserving Runtime authority
  boundaries
mission: Add the smallest generic goal-contact success path so a platformer
  with `completionMode=goal` can produce one truthful authoritative completion
  result through the existing GameplayEvent → GameplayRule → trusted Runtime
  execution path, without adding failure/progression systems.
measured_bottleneck: Verified S15 capabilities include movement/jump continuity,
  event-driven contact, collectible removal, enemy stomp, and non-top Health
  damage. Sprint acceptance still requires a truthful success/goal path.
  `reach-goal` is modeled, the deterministic RuleSet emits `COMPLETE_GOAL`, but
  the action remains deferred and no Runtime or session completion state exists.
gap_classification: PRODUCT_GAP + ARCHITECTURE_GAP + EXECUTION_GAP;
  VERIFICATION_GAP follows from the missing executable capability.
decision_gate: RESOLVED — Human/CTO accepted RuntimeGameplaySessionState as the
  sole current world/session completion authority, with terminal idempotent
  completion and reset only on world/session replacement.
allowed_scope: The selected narrow completion-state contract; promote only the
  validated `COMPLETE_GOAL` primitive; generic player/goal contact matching;
  current world/session/semantic binding and exactly-once behavior; immutable
  completion mutation/result; truthful Runtime/Renderer/Observatory projection;
  focused Shared/AI/Runtime/Web tests; required Chrome Studio verification.
forbidden_scope: Death, respawn, lives, game-over, invincibility, knockback,
  score, XP, progression, timers, spawners, enemy AI, multi-goal orchestration,
  generic game-state store, unrelated rule actions, rich transaction framework,
  full-world rebuild, provider-specific logic, generated code, eval, or
  SPRINT_CONTINUOUS.
implementation_boundaries: Shared owns the immutable selected completion
  contract; AI owns capability-derived support truth and deterministic rule
  mapping; Runtime owns the selected authoritative mutation/execution boundary;
  Renderer consumes committed Runtime projections; Web/Observatory keeps raw
  contact, rule result, completion result, and Runtime World surfaces distinct.
acceptance: After the decision is accepted, a real player → goal contact emits
  a Runtime-owned contact fact, matches the generic `reach-goal` RuleSet entry,
  executes `COMPLETE_GOAL` exactly once, commits the selected authoritative
  completion state for the current world/session, and remains isolated from
  stale RuleSets and other worlds. Repeated completion follows the chosen
  idempotence contract; world/session replacement follows the chosen reset or
  rebind contract; no entity removal, camera reset, or unrelated gameplay
  behavior is introduced.
automated_tests: Shared immutable completion contract and serialization;
  AI capability promotion and deterministic goal-rule construction; Runtime
  goal contact, selected state mutation, exactly-once, stale/world isolation,
  reset/rebind, and unsupported/missing-target safety; Web/Renderer truthful
  Observatory and Runtime projection regressions.
product_verification: YES — MANUAL Studio verification completed on 2026-08-24.
  A normal platformer reached Runtime session `completed` through real movement
  and jump input; Observatory showed the committed status while Runtime stayed
  Live, and replacing the world produced `world-2` with `active` status. Focused
  automated evidence covers the raw contact/rule boundary, idempotent no-op,
  stale isolation, semantic-revision retention, and clean browser logs.
observability_expectations: Keep the raw contact fact, rule match/conditions,
  action result, committed completion state, and Runtime World projection as
  separate entries/surfaces. Deferred or stale completion must remain visibly
  non-executed and must never be inferred from a label.
completion_report_requirements: Standard Completion Report with architecture
  before/after, product architecture status, selected authority decision,
  changed files, real flow, tests, TypeScript, ESLint, build if Web/Runtime
  wiring changes, architecture review, Product Verification, manual steps,
  Code Complete, and Product Verified.
quality_gate: PASS — evidence is source-backed; the goal path directly blocks
  the Sprint checkpoint; scope is one generic, testable, product-measurable
  slice; non-goals are explicit; invariants and dependencies are preserved;
  Product Verification is feasible after the decision; no speculative
  infrastructure is required; and the human-decision gate is recorded.
explicit_non_goals: No death/failure flow, progression, score, persistence,
  generic state architecture, or future Sprint planning.
human_decision_required: NO — accepted decision is recorded in
  HUMAN_DECISION_LOG.md; all implementation and verification gates passed.

optional_architecture_review: PASS — Supervisor reviewed the committed source
  path against ADR-0268 and ENGINEERING_INVARIANTS.md; no bounded subagent was
  needed because the change set and evidence were directly auditable.

## SPRINT_FREEZE_REVIEW — Sprint 15 Gameplay Mechanics Foundation

status: DONE
priority: P0
state_transition: BLOCKED → READY (Human/CTO decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: WO-S15-007 DONE; Sprint 15 minimum checkpoint evidence available
architecture_before: v1.154
architecture_after: v1.154
architecture_expected_after: v1.154
mission: Human/CTO review of the completed Sprint 15 bounded gameplay slice;
  decide whether to freeze the Sprint or authorize a separately scoped next
  direction.
measured_bottleneck: The Sprint 15 minimum checkpoint is satisfied through
  current-session goal completion. Remaining gaps are explicitly deferred
  failure/progression/product-direction work, not an unverified implementation
  blocker.
gap_classification: QUALITY_GAP + DEFERRED_OUT_OF_SPRINT
decision_gate: RESOLVED — Human/CTO authorized this Freeze Review and limited it
  to the Sprint-level product thesis; deferred future mechanics are not required.
allowed_scope: Read-only review of WO-S15-007 evidence, ADR-0268, current state,
  capability matrix, and deferred boundaries; record the human decision.
forbidden_scope: Product code changes, automatic next-feature execution,
  victory/death/progression implementation, and future backlog pre-generation.
acceptance: PASS — all sixteen Sprint-level criteria in SPRINT15_REVIEW.md are
  satisfied; Sprint 15 is Code Complete = YES, Product Verified = YES, and
  FROZEN = YES. Architecture remains v1.154 and no Sprint 16 implementation
  was executed.
verification: PASS — source/runtime audit, accumulated Studio evidence review,
  affected-package regression evidence, TypeScript, ESLint, Web build, queue
  consistency, and git diff check.
product_verification: YES — accumulated manual Studio evidence covers the
  required collectible, stomp, damage/Health, goal completion, continuity,
  isolation, and clean-console paths.
observability_expectations: Preserve the completed WO-S15-007 evidence and
  keep deferred capabilities visibly deferred in all projections.
completion_report_requirements: Record the sixteen-criterion evidence matrix,
  freeze decision, resulting queue transition, and one measured next Sprint
  horizon without executing it.
explicit_non_goals: No product implementation, no Sprint 16 execution, and no
  automatic continuation.
human_decision_required: NO — Freeze Review decision and Sprint acceptance are
  recorded in HUMAN_DECISION_LOG.md and SPRINT15_REVIEW.md.

optional_architecture_review: PASS — Supervisor reviewed the current source
  wiring against the Sprint thesis and ENGINEERING_INVARIANTS.md; no product
  architecture changed during the freeze review.

## SPRINT16_DISCOVERY — Gameplay-Preserving World Evolution

status: DONE
priority: P1
state_transition: BLOCKED → READY (Human/CTO decision accepted 2026-08-24) →
  IN_PROGRESS → VERIFYING → DONE
dependencies: Sprint 15 FROZEN; Human/CTO targeted Gameplay Rule Reconciliation
  decision recorded
architecture_before: v1.154
architecture_after: v1.154 (decision-resolution only; no product architecture
  changed)
architecture_expected_after: v1.154 before product implementation; the
  generated product WO owns any justified architecture-version change
mission: Measure and define the next Sprint-level thesis for preserving
  truthful generic gameplay intent across natural-language World Evolution and
  generate the first bounded implementation WO after the direction is accepted.
measured_bottleneck: Semantic World Evolution currently updates the semantic
  and Runtime worlds but marks the world-bound GameplayRuleSet stale because
  automatic gameplay-mechanics synchronization is not implemented. The initial
  gameplay slice is coherent; the cross-Sprint gap is targeted evolution
  continuity rather than a Runtime execution rewrite.
gap_classification: PRODUCT_GAP + ARCHITECTURE_GAP
decision_gate: RESOLVED — Human/CTO selected targeted Gameplay Rule
  Reconciliation and explicitly rejected blind stale preservation and full AI
  regeneration as the default.
allowed_scope: Read-only source and product review; define the reconciliation
  inputs, affected-rule boundaries, deterministic fallback, authority/lifecycle
  contract, acceptance evidence, and one generated product WO.
forbidden_scope: Sprint 16 implementation, automatic RuleSet synchronization,
  failure/progression features, future Sprint backlog generation, generic
  gameplay managers, or autonomous continuation.
acceptance: PASS — Human/CTO decision is recorded; the bounded reconciliation
  contract is explicit; exactly one READY product WO was generated and is not
  executed in this continuation.
automated_tests: None required for this control-plane discovery; source-backed
  evidence covers `gameStore.planEvolution`, `SemanticWorldMutationResult`,
  `markGameplayRuleSetStale`, and the existing deterministic
  `DefaultGameplayRuleBuilder`.
product_verification: NOT_APPLICABLE — discovery only; product verification is
  owned by WO-S16-001.
observability_expectations: Keep semantic delta, Runtime World, current
  GameplaySpecification, current/reconciled RuleSet, session authority, and
  Renderer/Observatory projections distinct; no planned or stale rule may be
  presented as committed execution.
completion_report_requirements: Record the Human/CTO direction, the selected
  authority and lifecycle, the measured bottleneck, one bounded product WO,
  and the resulting queue transition.
explicit_non_goals: No Sprint 16 code, no automatic continuation, and no
  feature work outside the accepted reconciliation contract.
human_decision_required: NO — accepted decision recorded in
  HUMAN_DECISION_LOG.md.

## WO-S16-001 — Targeted Gameplay Rule Reconciliation Across World Evolution

status: DONE
state_transition: READY → IN_PROGRESS → VERIFYING → DONE
priority: P1
dependencies: SPRINT16_DISCOVERY DONE; Human/CTO targeted reconciliation
  decision accepted 2026-08-24
architecture_before: v1.154
architecture_expected_after: v1.155
architecture_after: v1.155 — ADR-0269 accepted; targeted reconciliation is a
  real product architecture delta at the semantic-evolution commit boundary
mission: After an applied semantic World Evolution delta, produce a new current
  world-bound GameplayRuleSet by preserving unaffected rules, revalidating
  affected rules, removing invalid rules, and deterministically rebuilding
  affected known rules through the existing GameplaySpecification and
  GameplayRuleBuilder path.
measured_bottleneck: Verified generic gameplay execution and targeted semantic,
  Runtime, visual, and session continuity already exist, but
  `gameStore.planEvolution` currently calls `markGameplayRuleSetStale` for any
  applied semantic revision. That globally disables the current RuleSet and
  leaves the same-session gameplay slice inactive after unrelated evolution.
gap_classification: PRODUCT_GAP + EXECUTION_GAP + ARCHITECTURE_GAP
decision_gate: RESOLVED — targeted reconciliation is the accepted strategy;
  provider/AI regeneration is a fallback only for genuinely new or ambiguous
  gameplay intent that cannot be derived from current deterministic inputs.
allowed_scope: Add the smallest provider-independent reconciliation contract
  and implementation in existing Shared/AI/Web ownership boundaries; consume
  `GameWorldModel`, `GameplaySpecification`, current `GameplayRuleSet`,
  applied `SemanticWorldMutationResult`/delta, and the capability catalog;
  integrate the result at the current semantic-evolution commit boundary;
  expose truthful reconciliation facts through the existing Observatory path;
  add focused Runtime/AI/Shared/Web regressions and manual Studio verification.
  If an evolution introduces genuinely new or ambiguous gameplay intent that
  cannot be derived from these deterministic inputs, record it as an explicit
  deferred/AI-fallback case rather than silently regenerating the whole RuleSet.
forbidden_scope: Blindly preserve a stale RuleSet; full AI/provider RuleSet
  regeneration after every evolution; full Runtime, Renderer, or current-world
  rebuild; GameplayRuleManager; generic workflow engine; event sourcing; a
  second gameplay authority; entity-ID-prefix archetype inference; arbitrary
  code/eval/scripts; death/game-over, respawn, score, XP, progression, timers,
  spawning, waves, or broad World Evolution infrastructure.
implementation_boundaries: `GameplaySpecification` remains design-intent
  authority; the reconciled `GameplayRuleSet` is the executable plan; Runtime
  remains execution/state authority; Web/Pinia/Observatory remain projections.
  Reconciliation must be immutable and deterministic for known changes. Exact
  entity selectors are checked against current semantic entities; archetype,
  category, and role selectors use current semantic truth. A semantic revision
  change alone does not invalidate all rules. Unaffected execution continues in
  the same Runtime/session, and World A rules/results are rejected for World B.
acceptance: PASS only when all of the following are proven: (1) an unrelated
  semantic evolution preserves current executable rules and binds the new
  semantic revision; (2) a targeted entity/category/archetype change affects
  only the rules whose selectors, references, mechanics, or dependencies are
  actually impacted; (3) removed exact targets cannot leave dangling executable
  rules; (4) affected known rules are revalidated or deterministically rebuilt
  from the current GameplaySpecification/RuleBuilder, while unresolvable rules
  are removed or visibly deferred rather than falsely executed; (5) a semantic
  revision-only change never globally disables the RuleSet; (6) provider/AI is
  not called for deterministically reconcilable changes; (7) current Runtime
  gameplay continues in the same session without full-world rebuild; (8) stale
  World A rules/results cannot affect World B; and (9) Observatory separates
  preserved, revalidated, rebuilt, removed/deferred reconciliation facts from
  Runtime execution facts.
automated_tests: Focused Shared/AI/Runtime/Web tests must cover unrelated world
  property/addition preservation, targeted replace/remove invalidation,
  dangling exact-reference rejection, current semantic category/archetype
  resolution, deterministic output and ordering, provider non-invocation on
  known changes, semantic revision binding, same-session execution continuity,
  and World A/World B isolation; then run affected-package regressions,
  TypeScript, ESLint, and Web build when integration changes.
product_verification: REQUIRED — Studio must evolve the current playable world
  in one session, observe an unrelated change preserving an executable rule,
  observe a targeted change removing/rebuilding only affected rules, continue
  movement/jump and an unaffected mechanic, and show truthful current RuleSet,
  Runtime, and Observatory state with no browser errors.
observability_expectations: Preserve separate semantic mutation, reconciliation
  result, current RuleSet binding/revision, raw GameplayEvents, committed rule
  results, Runtime World/session state, and Renderer projection. Reconciliation
  must not be reported as gameplay execution.
completion_report_requirements: Report architecture before/after, files,
  actual reconciliation call chain, focused and affected-package tests,
  TypeScript, ESLint, build, manual Studio steps/results, authority and stale
  isolation review, deferred boundaries, Code Complete, and Product Verified.
explicit_non_goals: No broad World Evolution Sprint, no AI-generated gameplay
  redesign, no progression/failure systems, no Runtime/Renderer rebuild, and no
  automatic execution of a subsequent WO.
human_decision_required: NO — the reconciliation strategy and boundaries are
  accepted; routine implementation details remain Supervisor-owned.

completion_evidence: PASS — deterministic Shared/AI reconciliation preserves
  unaffected rules, rebuilds/removes targeted rules, binds the updated semantic
  revision, keeps the same Runtime/session loop active, and exposes separate
  Observatory reconciliation stages/events. Provider/AI is not used by this
  known-change path and World A/World B binding guards remain intact.
focused_tests: PASS — Shared contract through Web integration; AI 3/3;
  Runtime gameplay execution 15/15; Web World Evolution 6/6; Web Gameplay
  Generation 3/3; AI GameplayRule 3/3.
affected_package_gates: PASS — direct TypeScript, package ESLint, affected
  package regressions, and Web build; root Turbo typecheck wrapper remains a
  managed-environment TLS/keychain limitation documented in CURRENT_STATE.
product_verification: PASS — manual Studio session on 2026-08-24 covered
  unrelated preservation, targeted reconciliation/removal, the same-session
  Running movement/jump control surface, unaffected gameplay, current
  RuleSet/Runtime/Observatory truth, and clean browser logs; Runtime/Renderer
  regression suites provide the authoritative movement/jump continuity proof.
code_complete: YES
product_verified: YES

## SPRINT_FREEZE_REVIEW — Sprint 16 Gameplay-Preserving World Evolution

status: BLOCKED
state_transition: GENERATED_AFTER_WO-S16-001
priority: P0
dependencies: WO-S16-001 DONE; Sprint 16 acceptance evidence complete
mission: Review the Sprint 16 goal against the completed targeted Gameplay
  Rule reconciliation bridge and decide whether to freeze Sprint 16 at v1.155.
decision_gate: REQUIRED — Human/CTO must accept the Sprint-level evidence and
  choose FREEZE at v1.155 or explicitly continue Sprint 16 with a newly bounded
  work item and updated acceptance target.
allowed_scope: Review the Sprint 16 goal, ADR-0269, capability matrix,
  SPRINT16_REVIEW.md, automated evidence, and manual Studio evidence; record
  the decision and freeze/continue consequences.
forbidden_scope: Automatic freeze, automatic cross-Sprint execution, or
  generating/executing another feature WO before the decision.
acceptance: BLOCKED pending Human/CTO decision; no product implementation is
  authorized while this freeze gate is open.
product_verification: ALREADY PASS — WO-S16-001 Product Verified YES; this
  item is a Sprint governance decision rather than a new product slice.
human_decision_required: YES — Human/CTO freeze or continue decision.


## Queue transition vocabulary

BLOCKED → READY only after the blocking decision or dependency is resolved.
READY → IN_PROGRESS only after dependency and human-decision gates pass.
IN_PROGRESS → VERIFYING after implementation is complete.
VERIFYING → DONE only when all required gates pass.
VERIFYING → FAILED or BLOCKED when the repair budget or an escalation rule is
  reached.
