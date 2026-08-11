<script lang="ts">
/** A component belonging to an inspected runtime entity. */
export interface InspectorComponent {
  name: string
  data: Record<string, unknown>
}

/** An inspected runtime entity with its internal components. */
export interface InspectorEntity {
  id: string
  type: string
  components: InspectorComponent[]
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  component: {
    name: string
    data: string | Record<string, unknown>
  }
}>()

const displayData = computed<string>(() => {
  if (typeof props.component.data === 'string') {
    return props.component.data
  }
  return JSON.stringify(props.component.data, null, 2)
})
</script>

<template>
  <article class="runtime-component-card">
    <header class="runtime-component-header">
      <h3 class="runtime-component-name">
        {{ component.name }}
      </h3>
    </header>
    <pre class="runtime-component-json"><code>{{ displayData }}</code></pre>
  </article>
</template>

<style scoped>
.runtime-component-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.runtime-component-header {
  padding: var(--obs-space-2, 8px) var(--obs-space-3, 12px);
  border-bottom: 1px solid var(--obs-border, #232327);
  background: var(--obs-surface-2, #161618);
}

.runtime-component-name {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--obs-text, #f5f5f4);
}

.runtime-component-json {
  margin: 0;
  padding: var(--obs-space-3, 12px);
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 12px;
  line-height: 1.5;
  color: var(--obs-text-muted, #a1a1aa);
  overflow-x: auto;
  white-space: pre;
  tab-size: 2;
}
</style>