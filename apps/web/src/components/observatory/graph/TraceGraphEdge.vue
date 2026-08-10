<script setup lang="ts">
/**
 * Pure CSS vertical connector edge between trace graph nodes.
 * Renders a simple vertical line with arrow head.
 */
</script>

<template>
  <div
    class="graph-edge"
    role="img"
    aria-label="connects to"
  >
    <div class="graph-edge-line" />
    <div class="graph-edge-arrow" />
  </div>
</template>

<style scoped>
.graph-edge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 24px;
}

.graph-edge-line {
  width: 2px;
  flex: 1;
  min-height: 8px;
  background: var(--obs-border-strong, #3f3f46);
}

.graph-edge-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--obs-border-strong, #3f3f46);
}
</style>