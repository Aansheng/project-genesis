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
      <span class="studio-wordmark">Genesis</span>
      <span class="workspace-name">Studio</span>
    </div>
    <div class="studio-status">
      <span class="entity-count">{{ entityCount }} entities</span>
      <span class="runtime-state">Runtime ready</span>
      <RouterLink to="/observatory">
        Observatory
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
  padding: 0 var(--studio-space-4);
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
  gap: var(--studio-space-4);
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
  padding-left: var(--studio-space-4);
  border-left: 1px solid var(--studio-border-strong);
  color: var(--studio-text-muted);
}

.entity-count {
  font-family: var(--studio-font-mono);
  color: var(--studio-text);
}

.runtime-state {
  color: var(--studio-success);
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
</style>
