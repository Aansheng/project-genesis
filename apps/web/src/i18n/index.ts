/**
 * Lightweight internal i18n for the Observatory UI (WO-S6-006.5).
 *
 * Deliberately dependency-free: no vue-i18n, no i18next. This layer only
 * provides locale catalogs, nested dot-key resolution, and a `t()` lookup
 * with key-string fallback. The reactive Pinia store in
 * `apps/web/src/stores/i18n.ts` is the canonical integration point.
 */

export type Language = 'zh-CN' | 'en-US'

export const SUPPORTED_LANGUAGES: readonly Language[] = ['zh-CN', 'en-US']

export const DEFAULT_LANGUAGE: Language = 'zh-CN'

/**
 * A message catalog is a nested object whose leaves are translation strings.
 * Example: `{ observatory: { title: '可观测中心' } }`
 */
export type MessageCatalog = Record<string, unknown>

export interface I18nInstance {
  readonly language: Language
  setLanguage(next: Language): void
  t(key: string): string
  has(key: string): boolean
}

/**
 * Resolve a dot-separated key (`observatory.panels.overview`) against a
 * nested catalog. Returns `undefined` for missing keys, non-object
 * intermediate nodes, or non-string leaves.
 */
export function resolveKey(
  catalog: MessageCatalog,
  key: string,
): string | undefined {
  let node: unknown = catalog
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      return undefined
    }
    const next = (node as Record<string, unknown>)[part]
    if (next === undefined) return undefined
    node = next
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * Create a standalone i18n instance bound to a set of locale catalogs.
 * `t()` falls back to the requested key string whenever a translation is
 * missing — guaranteed to never throw.
 */
export function createI18n(
  catalogs: Record<Language, MessageCatalog>,
  initial: Language = DEFAULT_LANGUAGE,
): I18nInstance {
  let current: Language = initial

  return {
    get language(): Language {
      return current
    },
    setLanguage(next: Language): void {
      if (!SUPPORTED_LANGUAGES.includes(next)) return
      current = next
    },
    t(key: string): string {
      return resolveKey(catalogs[current], key) ?? key
    },
    has(key: string): boolean {
      return resolveKey(catalogs[current], key) !== undefined
    },
  }
}