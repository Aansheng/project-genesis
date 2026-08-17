<script setup lang="ts">
import ObservatoryHeader from './ObservatoryHeader.vue'
import ObservatorySidebar from './ObservatorySidebar.vue'
import ObservatoryContent from './ObservatoryContent.vue'
import { onMounted } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { ObservatoryRuntimeBinding } from '../../adapters/observatory'

const gameStore = useGameStore()
const observatoryDataStore = useObservatoryDataStore()
const runtimeBinding = new ObservatoryRuntimeBinding(gameStore.worldStore, observatoryDataStore)

onMounted(() => runtimeBinding.sync())
</script>

<template>
  <div class="observatory-shell">
    <ObservatoryHeader class="observatory-area observatory-area--header" />
    <ObservatorySidebar class="observatory-area observatory-area--sidebar" />
    <ObservatoryContent class="observatory-area observatory-area--content" />
  </div>
</template>

<style scoped>
.observatory-shell {
  /* Design tokens — shared with all observatory components via CSS inheritance. */
  --obs-bg: #0a0a0b;
  --obs-surface: #111113;
  --obs-surface-2: #161618;
  --obs-border: #232327;
  --obs-border-strong: #303036;
  --obs-text: #f5f5f4;
  --obs-text-muted: #a1a1aa;
  --obs-text-dim: #63636d;
  --obs-accent: #6e7bff;
  --obs-accent-soft: rgba(110, 123, 255, 0.14);
  --obs-success: #4ade80;
  --obs-success-soft: rgba(74, 222, 128, 0.12);
  --obs-radius-s: 6px;
  --obs-radius-m: 10px;
  --obs-space-1: 4px;
  --obs-space-2: 8px;
  --obs-space-3: 12px;
  --obs-space-4: 16px;
  --obs-space-5: 24px;
  --obs-space-6: 32px;
  --obs-font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;

  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  grid-template-rows: 52px minmax(0, 1fr);
  grid-template-areas:
    'header header'
    'sidebar content';

  min-width: 1280px;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: var(--obs-bg);
  color: var(--obs-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.observatory-area--header {
  grid-area: header;
}

.observatory-area--sidebar {
  grid-area: sidebar;
}

.observatory-area--content {
  grid-area: content;
}
</style>
