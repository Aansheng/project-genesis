<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'
import TraceGraphNode from './TraceGraphNode.vue'
import TraceGraphEdge from './TraceGraphEdge.vue'
import TraceGraphLegend from './TraceGraphLegend.vue'

/**
 * Mock trace graph data — layout validation only (WO-S6-010).
 * Will be replaced by real trace graph state in a future work order.
 */
const MOCK_NODES = [
  { id: 'node-1', label: 'CreateWorld', status: 'completed' as const },
  { id: 'node-2', label: 'GenerateTerrain', status: 'completed' as const },
  { id: 'node-3', label: 'CreateFarm', status: 'completed' as const },
  { id: 'node-4', label: 'CreateNPC', status: 'completed' as const },
  { id: 'node-5', label: 'CreateInventory', status: 'completed' as const },
  { id: 'node-6', label: 'CreateQuest', status: 'completed' as const },
]

const LEGEND_ITEMS = [
  { status: 'completed' as const },
  { status: 'pending' as const },
  { status: 'failed' as const },
]

const i18n = useI18n()
</script>

<template>
  <div class="observatory-trace-graph">
    <section
      class="graph-canvas"
      aria-label="Trace graph"
    >
      <header class="graph-header">
        <h2 class="graph-title">
          {{ i18n.t('observatory.graph.title') }}
        </h2>
      </header>
      <div class="graph-flow">
        <template
          v-for="(node, index) in MOCK_NODES"
          :key="node.id"
        >
          <TraceGraphNode :node="node" />
          <TraceGraphEdge v-if="index < MOCK_NODES.length - 1" />
        </template>
      </div>
    </section>
    <TraceGraphLegend :items="LEGEND_ITEMS" />
  </div>
</template>

<style scoped>
.observatory-trace-graph {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--obs-space-5, 24px);
  min-width: 0;
  height: 100%;
  padding: var(--obs-space-5, 24px);
  overflow-y: auto;
}

.graph-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--obs-space-4, 16px);
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.graph-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--obs-text, #f5f5f4);
}

.graph-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>