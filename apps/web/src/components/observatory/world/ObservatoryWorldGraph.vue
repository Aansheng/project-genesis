<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'
import WorldGraphNode from './WorldGraphNode.vue'
import WorldGraphConnection from './WorldGraphConnection.vue'
import WorldGraphLegend from './WorldGraphLegend.vue'
import type { WorldNodeData } from './WorldGraphNode.vue'

/**
 * Mock world graph data — tree hierarchy layout validation (WO-S6-011).
 * Will be replaced by real world state in a future work order.
 *
 * World
 * ├── Farm
 * ├── Barn
 * ├── WheatField
 * ├── Farmer
 * ├── Merchant
 * └── HarvestQuest
 */

const ROOT_NODE: WorldNodeData = {
  id: 'world-root',
  name: 'World',
  type: 'world',
  status: 'active',
}

const CHILD_NODES: WorldNodeData[] = [
  { id: 'node-farm', name: 'Farm', type: 'location', status: 'active' },
  { id: 'node-barn', name: 'Barn', type: 'location', status: 'inactive' },
  { id: 'node-wheat', name: 'WheatField', type: 'location', status: 'active' },
  { id: 'node-farmer', name: 'Farmer', type: 'npc', status: 'active' },
  { id: 'node-merchant', name: 'Merchant', type: 'npc', status: 'inactive' },
  { id: 'node-quest', name: 'HarvestQuest', type: 'quest', status: 'active' },
]

const LEGEND_TYPES = [
  { key: 'world' as const },
  { key: 'location' as const },
  { key: 'npc' as const },
  { key: 'quest' as const },
]

const LEGEND_STATUSES = [
  { key: 'active' as const },
  { key: 'inactive' as const },
]

const i18n = useI18n()
</script>

<template>
  <div class="observatory-world-graph">
    <section
      class="world-graph-canvas"
      aria-label="World graph"
    >
      <header class="world-graph-header">
        <h2 class="world-graph-title">
          {{ i18n.t('observatory.world.title') }}
        </h2>
      </header>
      <div class="world-graph-tree">
        <div class="world-graph-root">
          <WorldGraphNode :node="ROOT_NODE" />
        </div>
        <div class="world-graph-connectors">
          <div
            v-for="(child, index) in CHILD_NODES"
            :key="child.id"
            class="world-graph-connector-wrapper"
          >
            <template v-if="CHILD_NODES.length === 1">
              <WorldGraphConnection />
            </template>
            <template v-else>
              <div
                v-if="index === 0"
                class="connector-branch connector-branch--left"
              />
              <div
                v-else-if="index === CHILD_NODES.length - 1"
                class="connector-branch connector-branch--right"
              />
              <div
                v-else
                class="connector-branch connector-branch--middle"
              />
              <div class="connector-branch-vertical" />
            </template>
          </div>
        </div>
        <div class="world-graph-children">
          <WorldGraphNode
            v-for="child in CHILD_NODES"
            :key="child.id"
            :node="child"
          />
        </div>
      </div>
    </section>
    <WorldGraphLegend
      :types="LEGEND_TYPES"
      :statuses="LEGEND_STATUSES"
    />
  </div>
</template>

<style scoped>
.observatory-world-graph {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--obs-space-5, 24px);
  min-width: 0;
  height: 100%;
  padding: var(--obs-space-5, 24px);
  overflow-y: auto;
}

.world-graph-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--obs-space-4, 16px);
}

.world-graph-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.world-graph-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--obs-text, #f5f5f4);
}

.world-graph-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--obs-space-2, 8px);
}

.world-graph-root {
  display: flex;
  justify-content: center;
}

.world-graph-connectors {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--obs-space-4, 16px);
  width: 100%;
}

.world-graph-connector-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 160px;
}

.connector-branch {
  width: 50%;
  height: 2px;
  background: var(--obs-border-strong, #3f3f46);
}

.connector-branch--left {
  align-self: flex-end;
}

.connector-branch--right {
  align-self: flex-start;
}

.connector-branch--middle {
  width: 100%;
}

.connector-branch-vertical {
  width: 2px;
  height: 8px;
  background: var(--obs-border-strong, #3f3f46);
}

.world-graph-children {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--obs-space-4, 16px);
  flex-wrap: wrap;
}
</style>