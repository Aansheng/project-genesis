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
  --genesis-bg: #0c0d10;
  --genesis-surface-1: #111318;
  --genesis-surface-2: #171a20;
  --genesis-surface-3: #1d2028;
  --genesis-border-subtle: #272b34;
  --genesis-border-strong: #363c48;
  --genesis-text-primary: #eef0f4;
  --genesis-text-secondary: #a4aab5;
  --genesis-text-tertiary: #6d7481;
  --genesis-accent: #7d9cff;
  --genesis-accent-hover: #a7baff;
  --genesis-accent-muted: rgb(125 156 255 / 12%);
  --genesis-success: #68c08b;
  --genesis-radius-xs: 4px;
  --genesis-radius-sm: 6px;
  --genesis-radius-md: 8px;
  --genesis-space-1: 4px;
  --genesis-space-2: 8px;
  --genesis-space-3: 12px;
  --genesis-space-4: 16px;
  --genesis-space-5: 20px;
  --genesis-header-height: 52px;
  --genesis-command-height: 96px;

  /* Backward-compatible aliases for the existing Studio components. */
  --studio-bg: var(--genesis-bg);
  --studio-surface: var(--genesis-surface-1);
  --studio-surface-raised: var(--genesis-surface-2);
  --studio-surface-hover: var(--genesis-surface-3);
  --studio-border: var(--genesis-border-subtle);
  --studio-border-strong: var(--genesis-border-strong);
  --studio-text: var(--genesis-text-primary);
  --studio-text-muted: var(--genesis-text-secondary);
  --studio-text-dim: var(--genesis-text-tertiary);
  --studio-accent: var(--genesis-accent);
  --studio-accent-strong: var(--genesis-accent-hover);
  --studio-accent-soft: var(--genesis-accent-muted);
  --studio-success: var(--genesis-success);
  --studio-radius-sm: var(--genesis-radius-sm);
  --studio-radius-md: var(--genesis-radius-md);
  --studio-space-1: var(--genesis-space-1);
  --studio-space-2: var(--genesis-space-2);
  --studio-space-3: var(--genesis-space-3);
  --studio-space-4: var(--genesis-space-4);
  --studio-space-5: var(--genesis-space-5);
  --studio-font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  display: grid;
  grid-template-rows: var(--genesis-header-height) minmax(0, 1fr) var(--genesis-command-height);
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
