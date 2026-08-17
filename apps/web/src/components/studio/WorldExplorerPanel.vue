<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const entities = computed(() => {
  void store.renderVersion
  return store.worldStore.getWorld().entities
})
</script>

<template>
  <aside
    class="world-explorer-panel"
    aria-labelledby="world-explorer-title"
  >
    <header class="panel-header">
      <div>
        <span class="panel-kicker">World</span>
        <h2 id="world-explorer-title">
          Explorer
        </h2>
      </div>
      <span class="panel-count">{{ entities.length }}</span>
    </header>

    <div
      v-if="entities.length"
      class="world-summary"
    >
      <strong>Runtime world</strong>
      <span>{{ entities.length }} entities</span>
    </div>

    <div
      v-if="entities.length === 0"
      class="empty-state"
    >
      <p>No world generated yet</p>
      <span>Describe a game below to create its runtime world.</span>
    </div>

    <ul
      v-else
      class="entity-list"
    >
      <li
        v-for="entity in entities"
        :key="entity.id"
      >
        <button
          class="entity-row"
          :class="{ selected: store.selectedEntityId === entity.id }"
          type="button"
          :aria-pressed="store.selectedEntityId === entity.id"
          @click="store.selectEntity(entity.id)"
        >
          <span
            class="entity-marker"
            aria-hidden="true"
          />
          <span class="entity-id">{{ entity.id }}</span>
          <span class="entity-type">{{ entity.type }}</span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.world-explorer-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 var(--studio-space-4);
  border-bottom: 1px solid var(--studio-border);
}

h2 {
  margin-top: 1px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.panel-kicker {
  display: block;
  color: var(--studio-text-dim);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-count {
  color: var(--studio-text-secondary);
  font-family: var(--studio-font-mono);
  font-size: 11px;
}

.world-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--studio-space-4);
  border-bottom: 1px solid var(--studio-border);
}

.world-summary strong {
  font-size: 12px;
  font-weight: 600;
}

.world-summary span {
  color: var(--studio-text-dim);
  font-family: var(--studio-font-mono);
  font-size: 10px;
}

.panel-header span {
  color: var(--studio-text-dim);
  font-family: var(--studio-font-mono);
  font-size: 11px;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--studio-space-2);
  padding: var(--studio-space-5);
  color: var(--studio-text-muted);
}

.empty-state p {
  color: var(--studio-text);
  font-weight: 600;
}

.empty-state span {
  font-size: 12px;
  line-height: 1.6;
}

.entity-list {
  margin: 0;
  padding: var(--studio-space-2);
  overflow-y: auto;
  list-style: none;
}

.entity-row {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--studio-space-2);
  min-height: 38px;
  padding: 0 var(--studio-space-2);
  border: 0;
  border-radius: var(--studio-radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.entity-row:hover {
  background: var(--studio-surface-hover);
}

.entity-row:focus-visible {
  outline: 2px solid var(--studio-accent);
  outline-offset: -2px;
}

.entity-row.selected {
  background: var(--studio-accent-muted);
  box-shadow: inset 2px 0 var(--studio-accent);
}

.entity-marker {
  width: 5px;
  height: 5px;
  border: 1px solid var(--studio-accent);
  border-radius: 2px;
  background: var(--studio-accent-muted);
}

.entity-id {
  overflow: hidden;
  color: var(--studio-text);
  font-family: var(--studio-font-mono);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-type {
  color: var(--studio-text-dim);
  font-size: 11px;
}
</style>
