# ADR-0282 — Runtime-Authoritative One-Way Platform Surfaces

- Status: Accepted bounded implementation; Product Verification pending
- Date: 2026-08-26
- Sprint: Sprint 20
- Work Order: WO-S20-001 — Playable Platform Geometry
- Architecture: v1.167 → v1.170

## Context

The platformer baseline has a semantic `Platform` at a bounded elevated
position and a dedicated visual asset, but it previously projected no Runtime
collision bounds for its `terrain` category. `DefaultGroundCollisionSystem`
only clamped to the continuous global `groundY`; `DefaultEntityContactSystem`
could only observe overlapping bounds and emit events. Neither system resolved
Player movement against a Platform.

The existing layout requires the Player to jump upward through the Platform's
underside before landing on its top. Treating that surface as solid on all
sides would block the current intended path.

## Decision

- Project semantic `terrain` named `Platform` into an explicit `96 × 24`
  `collision-bounds` Runtime component. This mapping is structured data and
  does not consult Renderer catalogs, image dimensions, or image pixels.
- Extend the existing `DefaultGroundCollisionSystem` with the smallest bounded
  support check: a Player with downward velocity crossing the top of a semantic
  Platform is placed on that top and has vertical velocity resolved to zero.
- Keep Platform one-way: upward movement from below remains unblocked. Support
  ends when horizontal overlap ends, then existing gravity and vertical motion
  resume.
- Preserve the continuous `groundY` plane as the fallback support surface and
  retain `DefaultEntityContactSystem` as observation-only.

## Consequences

The Runtime chain is now `semantic Platform → collision bounds → gravity /
vertical motion → bounded top-surface resolution → Runtime position and
velocity → Renderer`. Generated imagery remains visual skin only. No physics
engine, manager, genre-specific Runtime, image-derived collision, or general
collision policy framework is introduced.

## Follow-up visual alignment repair

Manual Studio verification exposed a visible offset: Runtime treats Platform
position as the center of its `96 × 24` collision bounds, whereas the Renderer
had treated the same coordinate as the generated image's top-left corner. The
Player could therefore stand in a transparent area above-left of the visible
Platform. The bounded v1.169 correction sets the existing Platform visual's
anchor to `center`, yielding the same rendered rectangle `(252, 308, 96, 24)`
as its Runtime collision bounds at position `(300, 320)`. This changes only
visual projection; Runtime geometry remains the authority.

## Follow-up Player contact-point repair

The generated-image Studio screenshot confirmed that the Platform image was
correctly sized and positioned. It also exposed the actual remaining mismatch:
the established Player `PositionComponent.y` is a feet contact point (as
demonstrated by global `groundY` clamping and the Player's feet-anchored
Renderer), while the first Platform resolver treated it as the center of the
generic Player contact envelope. That placed a standing Player one half-height
above the visible Platform.

The bounded v1.170 repair resolves and observes Platform support using the
Player's existing feet coordinate against the Runtime Platform top. Generic
collision bounds remain the authoritative horizontal extent and contact
envelope; no image or renderer measurement is used for gameplay.

## Verification

Automated regression covers semantic Platform geometry, production-registered
Runtime landing/support/edge-fall behavior, upward pass-through, global ground,
and the Web Runtime-to-Renderer chain. Real Studio verification remains pending
because the local world-creation request had not completed at recording time.
