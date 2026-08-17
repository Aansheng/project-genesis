# ADR-0215: Genesis Studio Shell Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S11-001
- Architecture Version: v1.101 to v1.102

## Context

Sprint 10 completed the functional natural-language-to-playable-world pipeline,
but the Web product still presented Game and Observatory as separate technical
pages. The game route combined Pixi lifecycle, commands, navigation, and debug
output in one component and had no integrated world or runtime inspection.

## Decision

Make `/` the Genesis Studio foundation and preserve `/observatory` as the full
backward-compatible observability workspace.

The Studio is a Web-only composition layer:

```text
GenesisStudioShell
├── StudioHeader
├── StudioWorkspace
│   ├── WorldExplorerPanel
│   ├── GameViewportPanel
│   └── InspectorPanel
└── StudioCommandBar
```

`gameStore.worldStore` remains the only Runtime world owner. The World Explorer
reads it through the existing generation version signal. `GameViewportPanel`
owns the proven Pixi, runner, visualization-loop, and keyboard lifecycle.
`InspectorPanel` synchronizes the existing `ObservatoryRuntimeBinding` into the
existing Observatory ViewModel. `StudioCommandBar` delegates to `gameStore.send()`.

Add a small native-CSS Studio token layer with one dark theme, one blue accent,
compact spacing, and consistent 5-8px radii. No UI framework or component
library is introduced.

## Consequences

- Game, real World entities, real Runtime inspection, and natural-language
  commands are visible in one workspace.
- World Explorer and Inspector are read-only foundations.
- The Pixi/runtime call chain is moved, not rewritten.
- Full Observatory remains available and shares the same SPA session.
- No persistence, entity editing, new AI behavior, or new gameplay is added.

## Verification

Focused Studio tests cover empty and generated states, six Mario entities, real
Inspector data, shared store identity, route compatibility, and balanced runtime
resources. Manual browser verification covers 1440x900 and 1920x1080 layouts,
world generation, real Inspector and Observatory data, SPA return continuity,
one canvas, and zero browser-console errors.
