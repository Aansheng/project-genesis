<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>

<template>
  <div class="runtime-stat-card">
    <dt class="runtime-stat-label">
      {{ label }}
    </dt>
    <dd class="runtime-stat-value">
      {{ value }}
    </dd>
  </div>
</template>

<style scoped>
.runtime-stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
  padding: var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.runtime-stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.runtime-stat-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--obs-text, #f5f5f4);
}
</style>