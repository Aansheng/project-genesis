<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const entityCount = computed(() => {
  void store.renderVersion
  return store.worldStore.getWorld().entities.length
})
</script>

<template>
  <header class="studio-header">
    <div class="studio-identity">
      <span
        class="brand-mark"
        aria-hidden="true"
      >G</span>
      <div>
        <span class="studio-wordmark">Genesis</span>
        <span class="workspace-name">AI Game Studio</span>
      </div>
    </div>
    <div class="studio-status">
      <span class="runtime-state">
        <i aria-hidden="true" />
        {{ entityCount ? 'Runtime active' : 'Runtime idle' }}
      </span>
      <span class="entity-count">{{ entityCount }} entities</span>
      <RouterLink to="/observatory">
        Open Observatory <span aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.studio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--studio-space-4);
  padding: 0 var(--studio-space-5);
  border-bottom: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

.studio-identity,
.studio-status {
  display: flex;
  align-items: center;
  min-width: 0;
}

.studio-identity {
  gap: var(--studio-space-3);
}

.brand-mark {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--studio-accent);
  border-radius: var(--studio-radius-sm);
  color: var(--studio-accent-strong);
  font-size: 12px;
  font-weight: 800;
}

.studio-wordmark,
.workspace-name {
  display: block;
}

.studio-status {
  gap: var(--studio-space-3);
  color: var(--studio-text-muted);
  font-size: 12px;
}

.studio-wordmark {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.workspace-name {
  margin-top: 1px;
  color: var(--studio-text-dim);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.entity-count {
  font-family: var(--studio-font-mono);
  color: var(--studio-text);
}

.runtime-state {
  display: inline-flex;
  align-items: center;
  gap: var(--studio-space-1);
  color: var(--studio-success);
}

.runtime-state i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

a {
  color: var(--studio-accent-strong);
  text-decoration: none;
}

a:hover,
a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
}

a:focus-visible {
  outline: 2px solid var(--studio-accent);
  outline-offset: 3px;
}
</style>
