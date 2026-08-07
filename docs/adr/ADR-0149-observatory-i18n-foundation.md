# ADR-0149: Observatory I18n Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-006.5  
**Architecture Version:** v1.35 → v1.36

---

## Context

WO-S6-001 through WO-S6-006 delivered the Observatory Shell, Overview Dashboard, and the Trace / Timeline / History / Diff viewers — all with hardcoded English strings. Before the remaining viewers (Runtime Graph, Prompt Explorer) are built, the shell needs a localization foundation so new panels can ship with both Chinese and English text from day one.

This work order establishes a **lightweight i18n foundation** for the Observatory only. It deliberately avoids external libraries (no vue-i18n, no i18next) and converts only the shell-level texts: header, sidebar, content placeholders, and the Overview dashboard labels. The Trace / Timeline / History / Diff viewer details remain untouched and will be converted incrementally later.

### Problem

1. **Hardcoded strings** — every Observatory label was a literal English string
2. **No localization infrastructure** — no catalogs, no `t()` lookup, no language state
3. **No user-facing language control** — the shell had no way to switch between Chinese and English

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime / Planner / Pipeline / PromptBuilder / AI / Strategy changes
- No business logic changes — selection state, store defaults, and viewer behavior are unchanged
- No new dependencies (no vue-i18n, no i18next, no external localization libraries)
- No viewer-detail conversion (Trace / Timeline / History / Diff details stay English for now)
- No persistence of the chosen language (in-memory only; persistence is future work)

---

## Decision

### File Layout

```
apps/web/src/i18n/
├── index.ts          — resolveKey(), createI18n(), types, constants (dependency-free core)
└── locales/
    ├── zh-CN.ts      — simplified Chinese catalog (default)
    └── en-US.ts      — English catalog
apps/web/src/stores/i18n.ts  — reactive Pinia store: language / setLanguage / t / has
```

### Core (`i18n/index.ts`)

A small, pure, dependency-free module:

- `Language` = `'zh-CN' | 'en-US'`; `SUPPORTED_LANGUAGES` and `DEFAULT_LANGUAGE = 'zh-CN'`
- `MessageCatalog` = nested `Record<string, unknown>` whose leaves are strings
- `resolveKey(catalog, key)` — traverses dot-separated keys (`observatory.panels.overview`), returns `undefined` for missing keys, non-object intermediate nodes, arrays, or non-string leaves
- `createI18n(catalogs, initial?)` — standalone instance with `language`, `setLanguage` (guards unsupported languages), `t` (falls back to the key string), `has`

The default language is **zh-CN** per the work order.

### Store (`stores/i18n.ts`)

`useI18nStore` is a Pinia setup store (aliased as `useI18n`):

- `language: ref<Language>` defaults to `'zh-CN'`
- `setLanguage(next)` — updates the ref; unsupported values are ignored
- `t(key)` — resolves against the current language's catalog, falls back to the key string
- `has(key)` — key presence check

**Reactivity note:** `t()` reads the `language` ref on every call. Because translations are rendered through `t()` during the component render effect, changing the language invalidates every observer and re-renders in place — no page reload, no component remount.

### Translation Keys — `observatory` namespace

| Key | zh-CN | en-US |
| --- | --- | --- |
| `observatory.title` | 可观测中心 | Observatory |
| `observatory.panels.overview/trace/timeline/history/diff/runtime/settings` | 概览/追踪/时间线/历史记录/差异分析/运行时/设置 | Overview/Trace/Timeline/History/Diff/Runtime/Settings |
| `observatory.status.ready` | 就绪 | Ready |
| `observatory.labels.version/sprint/status/count/active/comingSoon` | 版本/迭代/状态/数量/活动/即将推出 | Version/Sprint/Status/Count/Active/Coming Soon |
| `observatory.sections.*` | 工件概览/可观测中心快照/系统状态 | Artifact Summary/Observatory Snapshot/System Status |
| `observatory.artifacts.*` | artifact descriptions | artifact descriptions |
| `observatory.snapshot.*` | snapshot labels | snapshot labels |
| `observatory.common.yes/no` | 是/否 | Yes/No |

Keys extend the work order's example list with the minimal additions required to fully localize the shell: `settings` (sidebar completeness), `status`/`count`/`active`/`comingSoon` (overview + placeholders), plus sections/artifacts/snapshot/common labels for the Overview dashboard.

### Integration Scope (converted)

- **`ObservatoryHeader.vue`** — title, status badge (translated "Ready" when status is `Ready`, raw status otherwise), sprint label (`Sprint 6` / `迭代 6`), version aria-label, plus the compact **language switcher** (`[ 中文 ▼ ]` style native select with 中文 / English options)
- **`ObservatorySidebar.vue`** — all 7 panel labels via `observatory.panels.*`
- **`ObservatoryContent.vue`** — placeholder card titles via `observatory.panels.*`, plus the "Coming Soon" / "Active" tags
- **`ObservatoryOverview.vue`** — section titles, artifact titles/descriptions/count, snapshot labels, Yes/No values, and System Status labels

NOT converted: Trace / Timeline / History / Diff viewer details — those are incremental follow-up work.

### Language Switcher

A native `<select>` inside the header right cluster (`locale-switcher`), bound with `:value="language"` and `@change` → `setLanguage`. Options are `中文` (zh-CN) and `English` (en-US). It is keyboard accessible, exposes `aria-label="Language"`, shows selected language text with a decorative `▼` caret, and updates the whole shell reactively.

---

## Consequences

### Positive

1. **Zero new dependencies** — hand-rolled, ~50 lines of core; no Vue plugin lifecycle
2. **Reactive without reload** — `t()` tracks the language ref, so all shell observers update in place
3. **Safe fallback** — missing keys render the key string instead of crashing
4. **Backward compatible** — viewer details unchanged; existing 600+ tests preserved by running legacy assertions against en-US
5. **Future-ready** — new panels (Runtime Graph, Prompt Explorer) can translate from day one; viewer-detail conversion is incremental
6. **Tested** — 128 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

- Default language is zh-CN, so prior English-string assertions in the shell/overview tests had to be pinned to en-US (`activateEn()` helper) — a one-time test-discipline change, not a behavior change.

### Risks

None — additive infrastructure. No Runtime / Planner / Pipeline / PromptBuilder / AI / Strategy files touched.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 732 tests across 8 files in `apps/web` (128 i18n + 120 diff + 106 shell + 103 history + 99 trace + 99 timeline + 62 overview + 15 streaming); 8328 across the monorepo
- **Language switcher works** — verified (header select switches `store.language`; title/badge/sprint/sidebar/overview update reactively)
- **zh-CN and en-US supported** — verified (default zh-CN rendering + en-US switching)
- **Observatory shell localized** — verified (header/sidebar/content/overview converted; viewer details untouched)
- **No new dependencies** — verified (`package.json` unchanged)
- **Mock data only / no business logic changes** — verified (selection, panels, viewers unchanged)
- **Architecture version** v1.35 → v1.36

---

## Completion Condition

The Observatory shell now reads all its chrome text through `useI18n().t()`, supports zh-CN / en-US, and exposes a working in-header language switcher. Future work orders may incrementally convert the Trace / Timeline / History / Diff viewer details and persist the user's language choice.