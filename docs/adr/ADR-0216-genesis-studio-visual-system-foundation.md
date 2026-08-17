# ADR-0216: Genesis Studio Visual System Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-002
- Architecture Version: v1.102 to v1.103

## Context

WO-S11-001 established the unified Studio shell, but its visual language was
still a functional first pass. The product needed stronger hierarchy around
the real Pixi viewport, quieter side panels, and a more intentional AI command
surface without changing the Runtime, AI, DSL, or renderer architecture.

## Decision

Keep the existing Vue composition and introduce a lightweight token layer on
`GenesisStudioShell` with backward-compatible aliases for the current Studio
variables. Refine the header, Explorer, viewport frame, Inspector, and command
bar using native scoped CSS only. All displayed state continues to come from
`RuntimeWorldStore`, `gameStore.log`, or existing runtime lifecycle state.

The viewport remains the primary visual focal point. Explorer and Inspector
retain independent scrolling, and the command bar retains the existing
`gameStore.send()` and Enter-submit behavior.

## Consequences

- Studio now has a centralized dark-neutral surface, border, typography,
  spacing, radius, and accent vocabulary.
- The canvas is framed as a playable editor viewport without changing Pixi
  rendering or gameplay behavior.
- Explorer and Inspector are easier to scan while remaining read-only.
- No UI framework, icon library, fake product state, or new domain layer is
  introduced.

## Verification

Focused Studio coverage checks the visual root, real empty/generated states,
command surface, Observatory access, and existing RuntimeWorldStore ownership.
Manual browser verification remains required at 1280px, 1440×900, and
1920×1080 when the local browser can reach the development server.
