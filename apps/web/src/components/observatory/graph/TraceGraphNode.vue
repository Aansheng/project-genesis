<script lang="ts">
/** A single node in the trace graph. */
export interface GraphNode {
  id: string
  label: string
  status: 'completed' | 'pending' | 'failed'
}

/** A directed edge between two nodes. */
export interface GraphEdge {
  from: string
  to: string
}
</script>

<script setup lang="ts">
defineProps<{
  node: GraphNode
}>()
</script>

<template>
  <article
    class="graph-node"
    :class="`graph-node--${node.status}`"
  >
    <header class="graph-node-header">
      <span class="graph-node-status-dot" />
      <span class="graph-node-status-label">
        {{ node.status }}
      </span>
    </header>
    <p class="graph-node-label">
      {{ node.label }}
    </p>
  </article>
</template>

<style scoped>
.graph-node {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  min-width: 180px;
  padding: var(--obs-space-3, 12px) var(--obs-space-4, 16px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  cursor: default;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.graph-node:hover {
  border-color: var(--obs-accent, #6e7bff);
  background: var(--obs-surface-2, #161618);
}

.graph-node-header {
  display: flex;
  align-items: center;
  gap: var(--obs-space-2, 8px);
}

.graph-node-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.graph-node--completed .graph-node-status-dot {
  background: var(--obs-success, #22c55e);
}

.graph-node--pending .graph-node-status-dot {
  background: var(--obs-warning, #eab308);
}

.graph-node--failed .graph-node-status-dot {
  background: var(--obs-error, #ef4444);
}

.graph-node-status-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.graph-node-label {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 13px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.graph-node--completed {
  border-color: rgba(34, 197, 94, 0.3);
}

.graph-node--pending {
  border-color: rgba(234, 179, 8, 0.3);
}

.graph-node--failed {
  border-color: rgba(239, 68, 68, 0.3);
}
</style>