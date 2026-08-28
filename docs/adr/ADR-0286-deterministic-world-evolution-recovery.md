# ADR-0286: Deterministic World Evolution Recovery

- Status: Accepted
- Date: 2026-08-28
- Work order: WO-S26-003
- Architecture: v1.175 → v1.176

## Context

The active-world Studio path selected the structured World Evolution planner
when a gateway was configured. If that provider was unavailable, a valid
same-world request such as `再加五只怪` failed before the existing semantic
delta, Runtime synchronization, gameplay reconciliation, and visual planning
seams could run. The deterministic evolution provider also lacked enemy
addition aliases and count parsing.

## Decision

Keep structured AI World Evolution as the primary candidate source. When there
is no primary provider, or when the primary planner reports a provider error,
reuse a deterministic `DefaultWorldEvolutionPlanner` as the recovery path. A
recovered operation reports `source: deterministic` and preserves the normal
validation, semantic application, Runtime synchronization, gameplay
reconciliation, and visual planning boundaries.

Extend only the existing deterministic candidate vocabulary for enemy/怪物/怪
addition and Chinese/English count forms. No provider protocol, new mutation
authority, or phrase-specific Runtime behavior is added.

## Consequences

The bounded five-enemy same-world evolution remains usable during provider
failure, and Observatory can distinguish deterministic fallback from successful
structured AI interpretation. Explicit CreateWorld routing is unchanged.
Enemy movement, combat, spawning, waves, timers, progression, and
Survivor-specific Runtime/Renderer systems remain outside this decision.
