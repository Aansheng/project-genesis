# ADR-0269 — Targeted Gameplay Rule Reconciliation Across World Evolution

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.154 → v1.155
- Work order: WO-S16-001

## Context

Semantic World Evolution already applies a validated delta and synchronizes
the current Runtime world in place. The world-bound `GameplayRuleSet`,
however, was marked stale after every applied semantic revision. That made an
otherwise playable world lose its executable gameplay rules, even when the
delta did not touch any rule dependency.

The reconciliation boundary must keep `GameplaySpecification` as design
intent, the `GameplayRuleSet` as the executable rule plan, and Runtime as
execution/state authority. It must not become a second gameplay manager,
generic workflow engine, or blind AI regeneration path.

## Decision

After an applied semantic mutation, Web invokes the shared
`GameplayRuleReconciler` contract before committing the new semantic state.
`DefaultGameplayRuleReconciler` in `@genesis/ai` uses the existing deterministic
`GameplayRuleBuilder` and `GameplayRuleValidator` with the current
`GameplaySpecification`, current capability catalog, and both sides of the
semantic mutation.

For each current rule it records one explicit fact:

- preserve an unaffected valid rule by identity;
- revalidate and rebuild an affected rule that remains valid;
- rebuild a changed known deterministic rule from the current baseline;
- remove an invalid or no-longer-resolvable rule; or
- defer only when an affected rule cannot be rebuilt deterministically.

Deterministic rules newly resolvable after the delta are added as rebuilt
facts. The resulting immutable RuleSet is bound to the updated semantic
revision and current world. Reconciliation is local and revision-guarded:
stale RuleSets, mismatched worlds, unapplied mutations, and semantic-world
mismatches fail before Web commits the semantic mutation. No Provider or AI
request is made for this deterministic path.

The existing Runtime execution loop and Runtime world/session remain in place;
their existing getters observe the current RuleSet and semantic revision.
World Evolution Observatory projections expose reconciliation stages, events,
status, revision, and counts separately from Runtime synchronization and
gameplay execution facts.

## Consequences

Unrelated semantic evolution preserves executable gameplay and advances its
binding revision. Targeted changes update only dependent rules, and dangling
exact references cannot remain executable. The same Runtime/session and
Renderer projection continue without a full rebuild. Reconciliation is
deterministic and provider-free, but broader ambiguous intent still requires a
separate accepted fallback path.

The bounded bridge does not add progression, score, death/respawn, spawn
execution, a generic gameplay-state manager, event sourcing, arbitrary code,
or a second authority. Deferred facts remain visible in RuleSet warnings and
Observatory evidence.

## Verification

- Shared contract and World Evolution stage/event types are covered by the
  affected Web integration path.
- AI tests cover unaffected preservation, targeted removal/rebuild, revision
  binding, immutability, and deterministic reconciliation.
- Runtime tests cover continuing the same execution loop after the RuleSet
  advances its semantic revision.
- Web integration covers semantic commit, Runtime synchronization, RuleSet
  current binding, and truthful Observatory reconciliation stages.
- Affected-package regressions, TypeScript, ESLint, Web build, and a manual
  Studio session are required before Sprint 16 freeze review.
