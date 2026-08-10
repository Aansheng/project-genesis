<script lang="ts">
/**
 * A single node in the world graph.
 */
export interface WorldNodeData {
  id: string
  name: string
  type: 'world' | 'location' | 'npc' | 'quest'
  status: 'active' | 'inactive'
}
</script>

<script setup lang="ts">
defineProps<{
  node: WorldNodeData
}>()
</script>

<template>
  <article
    class="world-graph-node"
    :class="[`world-graph-node--${node.type}`, `world-graph-node--${node.status}`]"
  >
    <header class="world-graph-node-header">
      <span class="world-graph-node-type-badge">{{ node.type }}</span>
      <span class="world-graph-node-status">
        <span class="world-graph-node-status-dot" />
        <span class="world-graph-node-status-label">{{ node.status }}</span>
      </span>
    </header>
    <p class="world-graph-node-name">
      {{ node.name }}
    </p>
  </article>
</template>

<style scoped>
.world-graph-node {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  min-width: 160px;
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  cursor: default;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.world-graph-node:hover {
  border-color: var(--obs-accent, #6e7bff);
  background: var(--obs-surface-2, #161618);
}

.world-graph-node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--obs-space-2, 8px);
}

.world-graph-node-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.4;
}

.world-graph-node--world .world-graph-node-type-badge {
  background: rgba(168, 85, 247, 0.18);
  color: #c084fc;
}

.world-graph-node--location .world-graph-node-type-badge {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
}

.world-graph-node--npc .world-graph-node-type-badge {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.world-graph-node--quest .world-graph-node-type-badge {
  background: rgba(251, 146, 60, 0.18);
  color: #fdba74;
}

.world-graph-node-status {
  display: flex;
  align-items: center;
  gap: var(--obs-space-1, 4px);
}

.world-graph-node-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.world-graph-node--active .world-graph-node-status-dot {
  background: var(--obs-success, #4ade80);
}

.world-graph-node--inactive .world-graph-node-status-dot {
  background: var(--obs-text-dim, #63636d);
}

.world-graph-node-status-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.world-graph-node-name {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.world-graph-node--active {
  border-color: rgba(74, 222, 128, 0.25);
}

.world-graph-node--inactive {
  border-color: rgba(99, 99, 109, 0.25);
}
</style>