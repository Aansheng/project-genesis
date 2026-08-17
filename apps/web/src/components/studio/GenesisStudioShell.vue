<script setup lang="ts">
import StudioHeader from './StudioHeader.vue'
import StudioWorkspace from './StudioWorkspace.vue'
import StudioCommandBar from './StudioCommandBar.vue'
</script>

<template>
  <main class="genesis-studio-shell">
    <StudioHeader />
    <StudioWorkspace />
    <StudioCommandBar />
  </main>
</template>

<style scoped>
.genesis-studio-shell {
  --studio-bg: #0c0d10;
  --studio-surface: #111318;
  --studio-surface-raised: #171a20;
  --studio-surface-hover: #1d2028;
  --studio-border: #272b34;
  --studio-border-strong: #363c48;
  --studio-text: #eef0f4;
  --studio-text-muted: #979da9;
  --studio-text-dim: #656c78;
  --studio-accent: #7d9cff;
  --studio-accent-strong: #9ab1ff;
  --studio-accent-soft: rgb(125 156 255 / 12%);
  --studio-success: #68c08b;
  --studio-radius-sm: 5px;
  --studio-radius-md: 8px;
  --studio-space-1: 4px;
  --studio-space-2: 8px;
  --studio-space-3: 12px;
  --studio-space-4: 16px;
  --studio-space-5: 20px;
  --studio-font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  display: grid;
  grid-template-rows: 48px minmax(0, 1fr) auto;
  width: 100vw;
  min-width: 1024px;
  min-height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background: var(--studio-bg);
  color: var(--studio-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 13px;
  line-height: 1.4;
}
</style>
