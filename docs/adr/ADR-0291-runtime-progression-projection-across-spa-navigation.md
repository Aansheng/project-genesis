# ADR-0291: Preserve Runtime Progression Across SPA Navigation

- Status: Accepted
- Date: 2026-08-31
- Architecture: v1.180 → v1.181
- Scope: Sprint 31, WO-S31-001

## Context

Runtime progression is already authoritative in
`DefaultRuntimeGameplayProgressionStateStore`. The Web Observatory path also
already receives a projection through `observatoryDataStore`; Observatory does
not need to calculate XP or Level.

The production Studio route, however, creates a new
`DefaultRuntimeExecutionLoop` every time `GameViewportPanel` mounts. When the
loop is constructed without a progression store, it creates a new Runtime
progression store at `experience=0, level=1`. A Game → Observatory → Game
transition therefore replaced a progressed Runtime projection with the
lifecycle baseline even though the Runtime WorldStore and entity history
remained continuous.

The fix must preserve the current SPA session without adding persistence,
route-state infrastructure, a second progression authority, or legacy
Observatory hydration.

## Decision

Keep one instance of the existing
`DefaultRuntimeGameplayProgressionStateStore` at the existing Web app-session
composition boundary in `gameStore`. Mark it raw so Pinia does not unwrap its
private Runtime state. Pass that same instance through
`GameViewportPanel`'s existing `RuntimeGameplayRuleExecutionConfig` whenever a
new `DefaultRuntimeExecutionLoop` is mounted.

The existing Runtime binding semantics remain unchanged:

- the same world/session retains progression across loop remounts and semantic
  evolution;
- a new world/session binding resets to the Runtime lifecycle baseline;
- Runtime execution commits progression and remains the only authority;
- Web and Observatory only project the committed Runtime state.

No change is made to `ObservatoryRuntimeBinding` or the Observatory data model.

## Real flow

`GameViewportPanel mount → gameStore's existing Runtime progression store →
DefaultRuntimeExecutionLoop config → GameplayRuleExecutor → Runtime progression
commit → RuntimeGameplayProgressionStateObserver → observatoryDataStore → Full
Observatory Runtime viewer`

## Consequences

### Positive

- Progression survives the existing Game/Observatory SPA remount boundary.
- Runtime remains the single progression authority.
- Same-world/session binding and new-world reset semantics are preserved.
- No persistence or new orchestration layer is introduced.

### Negative / remaining work

- The store lifetime is the current SPA app session; browser refresh or durable
  restore remains outside the contract.
- The independent stale `PROJECT_METADATA` source remains a separate Sprint 31
  work item (`WO-S31-002`). This ADR does not change metadata.

## Verification

- Runtime: 25 test files / 705 tests passed.
- Web: 50 test files / 3566 tests passed.
- Runtime/Web TypeScript checks passed.
- Package Lint passed with existing warnings and no errors.
- Web build and `git diff --check` passed.
- Real Studio generated `world-1`, reached Observatory `1 / 2`, returned to
  Game, continued the same world, then reached Observatory `2 / 2`; browser
  error/warning diagnostics were empty.
