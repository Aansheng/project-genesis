# ADR-0214: Observatory SPA Runtime Session Integration

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S10-012
- Architecture Version: v1.100 → v1.101

## Context

Vue Router was installed and `/observatory` existed, but the game workspace was
an `App.vue` fallback rather than a route. Production exposed no SPA navigation
controls, so users reached Observatory through a URL load that recreated Vue,
Pinia, `gameStore`, and the authoritative `RuntimeWorldStore`.

Pixi, the visualization runner, and keyboard input were also owned by the root
component lifecycle. A route branch change did not provide a safe lifecycle for
tearing down and remounting those game-only resources.

## Decision

Make `App.vue` a stable router host and add `GameWorkspacePage` as the `/`
route. Both Game and Observatory expose `RouterLink` navigation, so switching
workspaces remains inside the existing Vue + Pinia application lifetime.

Keep `RuntimeWorldStore` owned by the existing Pinia `gameStore`. Move Pixi,
runtime-loop, RAF-runner, and keyboard-input ownership into the game route:

```text
createApp → Pinia → gameStore → RuntimeWorldStore
                    ↓
              Vue Router
              ├── /             GameWorkspacePage → Pixi runtime
              └── /observatory  ObservatoryRuntimeBinding
```

On game-route unmount, stop the runner and visualization loop, detach keyboard
input, and destroy Pixi. On remount, create one fresh presentation/runtime stack
against the same surviving `RuntimeWorldStore` and render its current world.

## Consequences

- Game → Observatory → Game preserves the generated world in one browser session.
- Observatory receives the same real Runtime world; no mock or persistence layer
  is introduced.
- Route switching cannot accumulate RAF loops, keyboard listeners, or Pixi apps.
- Refresh recovery and durable persistence remain explicitly out of scope.

## Verification

The SPA integration suite covers store identity, Mario entities and positions,
replacement worlds, repeated switching, empty direct Observatory sessions, and
balanced Pixi/runner/input mount-unmount counts. Manual browser verification
covers the actual RouterLink flow, six real Observatory entities, retained game
state, one remounted canvas, repeated switching, and zero browser-console errors.
