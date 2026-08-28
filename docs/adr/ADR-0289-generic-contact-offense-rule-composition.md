# ADR-0289 — Generic Contact Offense Rule Composition

- Status: Accepted; Product Verified; Sprint 29 Freeze Review selected
- Date: 2026-08-28
- Architecture: v1.178 → v1.179
- Work Order: WO-S29-001

## Context

Sprint 29 found that the production Runtime already supports generic Health,
`DAMAGE_ENTITY`, `REMOVE_ENTITY`, finite numeric progression, typed Health
comparison, atomic multi-action rules, and Player/Enemy contact identity.
Survival lacked only a production RuleSet composition that used those
capabilities for Player-originated offense.

Timed triggers, range/nearest-target conditions, projectile execution, and
gameplay spawning are absent. None is required for the smallest credible
offense because Player movement and the existing contact boundary provide an
intentional, repeatable interaction.

## Decision

Add `contact-offense` as a supported generic gameplay mechanic. The
deterministic Survival specification composes three ordered rules:

1. On a new Player→Enemy contact, apply `DAMAGE_ENTITY(eventTarget, 25)`.
2. On the same event after staged Health reaches zero, atomically remove the
   Enemy and add one Runtime `experience`.
3. Evaluate the existing bounded XP threshold and commit Level 1→2 once.

The existing Enemy→Player contact threat rule remains separate and continues
to apply one Player damage on non-lethal contact events. On a killing contact,
the defeated target is already absent when that later rule evaluates, so it
does not manufacture a stale damage result.

The rules use category selectors and therefore apply to initial and
conversationally added enemies. Runtime entity identity, Health, immutable
World mutation, progression, and rule ordering remain authoritative. The AI
may describe intent but does not choose live targets or outcomes.

## Boundaries

- Contact offense is a bounded first interaction, not automatic ranged combat.
- Health zero is not globally redefined as death; the explicit typed Survival
  defeat rule owns this composition.
- No weapon, projectile, cooldown, timer, radius, nearest-target, spawn/wave,
  inventory, equipment, ability, VFX, animation, or combat manager is added.
- No Runtime or Renderer branch on `worldType` is introduced.
- Platformer keeps its established stomp, side-damage, collectible, goal,
  failure, and presentation behavior.

## Consequences

A generated Survival game can now expose a genuine, mechanically truthful
Player-offense loop by maneuvering into enemies across distinct contacts.
Enemy Health decreases, defeated enemies are removed, XP/Level use the existing
Runtime authority, and the remaining survival loop continues. A future
measured requirement for ranged or periodic offense still needs a separate
bounded timing/range decision.

## Verification

Production-chain tests verify generated rules through Studio system
composition, four distinct contacts, Enemy Health depletion/removal, XP 1,
Level 2, and an active session. Full Shared, AI, Runtime, and Web suites,
TypeScript, ESLint, Web build, and diff hygiene pass. Real provider-backed
Studio verifies initial and evolved Enemy Health damage, pursuit composition,
same-world exact +5 continuity, and clean diagnostics. Product Verified = YES.
