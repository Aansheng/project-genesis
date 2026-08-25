# Sprint 17 Review — Mechanically Complete Platformer Generation

## Freeze Status

Sprint 17 is **FROZEN** at architecture v1.160. Human/CTO accepted the
Freeze decision on 2026-08-25 after WO-S17-004 closed the measured lethal
failure/recovery gap.

- Code Complete: YES
- Product Verified: YES
- FROZEN: YES
- Architecture: v1.160
- Sprint 16 remains FROZEN at v1.157
- Sprint 18 is explicitly authorized and begins only after this review

## Product Goal

A user can request a simple 2D platformer through natural language and Genesis
can generate a mechanically coherent game that reaches a truthful success or
failure lifecycle using generic structured gameplay capabilities rather than a
genre-specific Runtime.

## Acceptance Evidence

| Product step | Result | Evidence |
| --- | --- | --- |
| Natural-language creation | PASS | Real Studio creation path reaches the provider completeness gate and deterministic baseline when the candidate is incomplete. |
| Provider completeness protection | PASS | Complete candidates are accepted; structurally valid but incomplete candidates are rejected as `product_incomplete` and use the deterministic baseline; provider failure remains distinct. |
| Movement and jump | PASS | Existing Runtime systems remain playable in the generated fallback path. |
| Collectible and progression | PASS | Collectible consumption commits `experience +1` and the typed threshold commits Level 1 → Level 2. |
| Enemy interaction and damage | PASS | Generic enemy stomp and trusted `DAMAGE_ENTITY` remain executable. |
| Failure and recovery | PASS | Health `0` produces Runtime `failed`; Studio exposes Respawn; same-world recovery restores active play while preserving position/entities/progression. |
| Goal completion | PASS | Goal contact executes `COMPLETE_GOAL` and the Runtime session becomes `completed`. |
| World/session truth | PASS | World Evolution continuity and stale World A/B isolation remain covered by Runtime/Web regressions and accumulated Studio evidence. |

The real browser verification of the final recovery slice showed Health `0` →
Respawn → unchanged position → active gameplay. A `99/100` display immediately
after recovery is expected when the preserved position still overlaps an enemy:
the existing contact rule can apply one nonlethal point on the next tick. It does
not indicate that Runtime respawn failed.

## Production Chain

`natural-language request → provider structural validation → platformer
completeness gate → accepted candidate or deterministic baseline → semantic
world → Game DSL → Runtime movement/contact/rules → collectible/progression /
damage/stomp/failure/respawn/goal → COMPLETE_GOAL → Runtime session completed
→ Renderer/Web/Observatory projections`

Gameplay intent remains structured data. Runtime remains gameplay and session
authority. Provider output remains candidate input. Renderer, Web, and
Observatory remain projections.

## Explicitly Non-Blocking at Freeze

Enemy autonomous behavior, hazards, lives, checkpoints, score, level pacing,
advanced visual polish, offline World Evolution fallback, and the stale Full
Observatory v1.157/Sprint 16 title do not block this freeze.

## Deferred Work

Game-over/lives/checkpoint policies, autonomous enemy behavior, hazards, score
beyond the bounded XP/level proof, richer pacing, and broader gameplay state
remain deferred until a later measured product need.

## Freeze Decision and Boundary

Sprint 17's product goal is satisfied. Do not execute additional Sprint 17
product work. Sprint 18 is authorized as **Visually Coherent Platformer
Generation**. `SPRINT_CONTINUOUS` remains enabled inside Sprint 18, but the
Supervisor must select exactly one measured bounded WO at a time and must not
enter Sprint 19 automatically.
