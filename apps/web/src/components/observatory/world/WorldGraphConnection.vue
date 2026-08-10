<script setup lang="ts">
/**
 * Pure CSS vertical connector between parent and child world graph nodes.
 * Renders a vertical line branching downward from a horizontal bar.
 */
</script>

<template>
  <div
    class="world-graph-connection"
    role="img"
    aria-label="connects parent to child"
  >
    <div class="world-graph-connection-vertical" />
    <div class="world-graph-connection-horizontal" />
  </div>
</template>

<style scoped>
.world-graph-connection {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 24px;
}

.world-graph-connection-vertical {
  width: 2px;
  flex: 1;
  min-height: 8px;
  background: var(--obs-border-strong, #3f3f46);
}

.world-graph-connection-horizontal {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--obs-border-strong, #3f3f46);
}
</style>