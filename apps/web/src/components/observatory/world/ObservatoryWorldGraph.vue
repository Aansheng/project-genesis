<script setup lang="ts">
import { computed } from 'vue'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import WorldGraphNode from './WorldGraphNode.vue'
import WorldGraphConnection from './WorldGraphConnection.vue'
import type { WorldNodeData } from './WorldGraphNode.vue'

const dataStore = useObservatoryDataStore()
const entities = computed<readonly WorldNodeData[]>(() =>
  dataStore.viewModel.runtimeView.entities.map((entity) => ({
    id: entity.id,
    name: entity.id,
    type: entity.type || 'entity',
    status: 'active',
  })),
)
const root = computed<WorldNodeData>(() => ({
  id: 'current-world',
  name: 'Current World',
  type: 'world',
  status: entities.value.length > 0 ? 'active' : 'empty',
}))
</script>

<template>
  <section class="observatory-world-graph" aria-labelledby="world-graph-title">
    <h2 id="world-graph-title">Current World Structure</h2>
    <p v-if="entities.length === 0" class="empty-state">No current Runtime entities are available.</p>
    <div v-else class="world-tree">
      <WorldGraphNode :node="root" />
      <WorldGraphConnection />
      <div class="entity-grid">
        <WorldGraphNode v-for="entity in entities" :key="entity.id" :node="entity" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.observatory-world-graph { display: flex; flex-direction: column; align-items: center; gap: var(--obs-space-4); min-width: 0; padding: var(--obs-space-5); }
h2 { margin: 0; color: var(--obs-text); font-size: 13px; }
.world-tree { display: flex; flex-direction: column; align-items: center; width: 100%; }
.entity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--obs-space-3); width: 100%; }
.empty-state { width: 100%; box-sizing: border-box; margin: 0; padding: var(--obs-space-4); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); color: var(--obs-text-dim); font-size: 13px; }
</style>
