# Genesis Supervisor — Human Decision Log

This log records decisions and gates that require human control. It is not a
replacement for ADRs or PROJECT_STATE.md.

## Open decisions

| Date | Decision | Status | Owner | Consequence |
| --- | --- | --- | --- | --- |
| 2026-08-21 | Select the concrete S15-005 gameplay scenario from a measured Studio bottleneck and approve its acceptance boundary. | ACCEPTED | Human / CTO | ENEMY STOMP is the primary scenario; WO-S15-005 may enter IN_PROGRESS with its bounded generic Runtime contract. |
| 2026-08-21 | Keep initial Supervisor continuation at ONE_WORK_ITEM. | ACCEPTED | Human / CTO | Supervisor stops after one verified work item. |

## WO-S15-005 product decision

Date: 2026-08-21
Result: ACCEPTED — primary gameplay scenario is ENEMY STOMP.

Boundary:

`player` contacting an `enemy` from above must produce a Runtime-owned
`ENTITY_CONTACT_STARTED` fact with `direction=top`; the generic
`GameplayRuleMatcher` and `GameplayConditionEvaluator` must validate the
player/enemy/top rule, then the trusted generic actions
`REMOVE_ENTITY(eventTarget)` and `APPLY_VELOCITY(eventActor, upward bounce)`
must commit exactly once. The enemy must disappear from Runtime and Renderer;
the player must bounce, land, and retain movement/jump continuity.

The slice must keep direction out of Pixi/visual geometry, avoid genre-specific
Runtime systems, keep deferred damage visibly non-executed, and use deterministic
rule-level all-or-nothing semantics for multi-action failure without creating a
general transaction framework.

## WO-META-003 dry run

Date: 2026-08-21
Result: PASS — no product code changed.

Simulation:

1. Read source/runtime truth, PROJECT_STATE.md, latest Sprint 15 backlog, and
   relevant ADRs.
2. Recovered architecture v1.151 and confirmed WO-S15-004 complete.
3. Selected WO-S15-005 as the next queue item; its dependency is satisfied,
   but its scenario choice correctly raises a human decision gate.
4. Proposed topology: Supervisor owns scope and contract; one optional
   read-only Architecture Reviewer; a Verification Agent only after an
   implementation slice exists; Product Verification only if the next item is
   user-visible.
5. Applied the gates: targeted tests, affected-package checks, TypeScript,
   ESLint, build when applicable, diff check, architecture review, and
   Product Verification classification.
6. Escalation points are the S15-005 scenario choice, any invariant/ADR
   conflict, destructive operation, security/dependency change, broad
   refactor, or three failed repair rounds.

The dry run selected no product work and left S15-005 READY.

## Delegation records

- 2026-08-21: An initial broad read-only reviewer did not return after bounded
  waits and was shut down. Result: unavailable, not treated as PASS; no files
  were modified.
- 2026-08-21: A second bounded read-only reviewer checked v1.151, S15-005
  readiness/dependency, repair budget 3, ONE_WORK_ITEM, and the forbidden
  product/external scope. Result: PASS; findings: none; no files modified.
