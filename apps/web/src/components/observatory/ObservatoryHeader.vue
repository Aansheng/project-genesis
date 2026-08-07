<script setup lang="ts">
import { useObservatoryStore } from '../../stores/observatory'
import { useI18n } from '../../stores/i18n'
import type { Language } from '../../i18n'

const store = useObservatoryStore()
const i18n = useI18n()

function statusText(): string {
  return store.status === 'Ready'
    ? i18n.t('observatory.status.ready')
    : store.status
}

function onLanguageChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as Language
  i18n.setLanguage(value)
}
</script>

<template>
  <header
    class="observatory-header"
    role="banner"
    aria-label="Genesis Observatory header"
  >
    <div class="header-left">
      <span class="header-title">{{ i18n.t('observatory.title') }}</span>
      <span
        class="header-badge"
        :aria-label="`Status: ${store.status}`"
        role="status"
      >
        <span
          class="badge-dot"
          aria-hidden="true"
        />
        {{ statusText() }}
      </span>
      <span
        class="header-version"
        :aria-label="i18n.t('observatory.labels.version')"
      >{{ store.version }}</span>
    </div>
    <div class="header-right">
      <div class="locale-switcher">
        <select
          class="locale-select"
          :value="i18n.language"
          aria-label="Language"
          @change="onLanguageChange"
        >
          <option value="zh-CN">
            中文
          </option>
          <option value="en-US">
            English
          </option>
        </select>
        <span
          class="locale-caret"
          aria-hidden="true"
        >▼</span>
      </div>
      <span class="header-sprint">{{ i18n.t('observatory.labels.sprint') }} 6</span>
    </div>
  </header>
</template>

<style scoped>
.observatory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 var(--obs-space-5);
  border-bottom: 1px solid var(--obs-border);
  background: var(--obs-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--obs-space-4);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--obs-text);
  white-space: nowrap;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--obs-space-1);
  padding: 2px var(--obs-space-2);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 999px;
  background: var(--obs-success-soft);
  color: var(--obs-success);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--obs-success);
}

.header-version {
  font-family: var(--obs-font-mono);
  font-size: 12px;
  color: var(--obs-text-dim);
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--obs-space-4);
}

.locale-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.locale-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 2px 18px 2px var(--obs-space-2);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface-2, #161618);
  color: var(--obs-text, #f5f5f4);
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}

.locale-select:focus-visible {
  outline: 2px solid var(--obs-accent, #6e7bff);
  outline-offset: -2px;
}

.locale-caret {
  position: absolute;
  right: 6px;
  pointer-events: none;
  font-size: 8px;
  color: var(--obs-text-dim, #63636d);
}

.header-sprint {
  font-family: var(--obs-font-mono);
  font-size: 12px;
  color: var(--obs-text-muted);
  white-space: nowrap;
}
</style>