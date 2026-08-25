# ADR-0273 — Platformer Provider Candidate Completeness Gate

Status: Accepted

Date: 2026-08-24

Work order: WO-S17-002

Architecture: v1.158 → v1.159

## Context

The configured provider path returned a structurally valid `platformer`
candidate that did not contain the entities required by the Product Verified
platformer loop. Structural schema validity alone allowed that candidate to
bypass the deterministic seven-entity baseline and prevented collectible,
enemy, Health/damage, progression, and goal mechanics from being composed.

## Decision

The existing `DefaultGameWorldValidator` performs a bounded platformer baseline
check after structural validation and before the candidate is converted into a
semantic world. The minimum floor is:

- at least two terrain entities;
- at least one enemy;
- at least one collectible item distinct from goal/checkpoint markers; and
- one goal marker using the existing goal semantics.

If the floor is not met, the provider candidate is rejected as
`product_incomplete` and the existing `FallbackGameWorldGenerationProvider`
selects the deterministic platformer baseline. No candidate augmentation or
merge occurs.

Generation diagnostics distinguish `accepted`, `structurally_invalid`,
`product_incomplete`, and `provider_failed` candidate dispositions, plus
`provider_accepted`, `deterministic_baseline`, or `deterministic_fallback`
selection outcomes. Observatory projects these facts without labeling a
completeness rejection as a provider outage.

## Boundaries

- Provider output remains untrusted candidate data.
- Runtime remains gameplay and state authority.
- Gameplay intent and rules remain structured data.
- Renderer, Web, and Observatory remain projections.
- No genre-specific Runtime, manager, quality score, regeneration loop,
  arbitrary executable code, death/respawn, hazard, enemy AI, score, or pacing
  system is introduced.

## Verification

- Complete provider candidate is accepted without deterministic fallback.
- Structurally valid but incomplete provider candidate is rejected and falls
  back to the seven-entity deterministic baseline.
- Provider execution failure retains safe fallback and is separately reported.
- Deterministic fallback retains the existing collectible → XP → level path,
  verified in Studio with 6 remaining entities, `Experience: 1`, and `Level: 2`
  after collectible contact.
