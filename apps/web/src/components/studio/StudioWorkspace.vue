<script setup lang="ts">
import WorldExplorerPanel from './WorldExplorerPanel.vue'
import GameViewportPanel from './GameViewportPanel.vue'
import InspectorPanel from './InspectorPanel.vue'
</script>

<template>
  <section
    class="studio-workspace"
    aria-label="Studio workspace"
  >
    <WorldExplorerPanel />
    <GameViewportPanel />
    <InspectorPanel />
  </section>
</template>

<style scoped>
.studio-workspace {
  display: grid;
  grid-template-columns: clamp(220px, 16vw, 264px) minmax(0, 1fr) clamp(280px, 21vw, 344px);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1180px) {
  .studio-workspace {
    grid-template-columns: 210px minmax(0, 1fr) 260px;
  }
}
</style>
