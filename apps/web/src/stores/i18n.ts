import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_LANGUAGE,
  resolveKey,
  SUPPORTED_LANGUAGES,
  type Language,
  type MessageCatalog,
} from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'

/**
 * Observatory i18n store (WO-S6-006.5).
 *
 * Lightweight, dependency-free localization state. Components translate
 * through the `t(key)` helper (equivalent of `useI18n().t`). `t()` reads the
 * `language` ref on every call, so any component that renders a translation
 * re-renders when the language changes — no page reload required.
 */
const CATALOGS: Record<Language, MessageCatalog> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export const useI18nStore = defineStore('i18n', () => {
  const language = ref<Language>(DEFAULT_LANGUAGE)

  function setLanguage(next: Language): void {
    if (!SUPPORTED_LANGUAGES.includes(next)) return
    language.value = next
  }

  function t(key: string): string {
    return resolveKey(CATALOGS[language.value], key) ?? key
  }

  function has(key: string): boolean {
    return resolveKey(CATALOGS[language.value], key) !== undefined
  }

  return {
    language,
    setLanguage,
    t,
    has,
  }
})

/** Alias matching the canonical `useI18n()` helper name. */
export const useI18n = useI18nStore