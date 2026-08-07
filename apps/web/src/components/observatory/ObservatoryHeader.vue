<script setup lang="ts">
import { useObservatoryStore } from '../../stores/observatory'

const store = useObservatoryStore()
</script>

<template>
  <header
    class="observatory-header"
    role="banner"
    aria-label="Genesis Observatory header"
  >
    <div class="header-left">
      <span class="header-title">Genesis Observatory</span>
      <span
        class="header-badge"
        :aria-label="`Status: ${store.status}`"
        role="status"
      >
        <span
          class="badge-dot"
          aria-hidden="true"
        />
        {{ store.status }}
      </span>
      <span
        class="header-version"
        aria-label="Observatory version"
      >{{ store.version }}</span>
    </div>
    <div class="header-right">
      <span class="header-sprint">Sprint 6</span>
    </div>
  </header>
</template>

<style scoped>
.observatory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 var(--obs-space-5);
  border-bottom: 1px solid var(--obs-border);
  background: var(--obs-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--obs-space-4);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--obs-text);
  white-space: nowrap;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--obs-space-1);
  padding: 2px var(--obs-space-2);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 999px;
  background: var(--obs-success-soft);
  color: var(--obs-success);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--obs-success);
}

.header-version {
  font-family: var(--obs-font-mono);
  font-size: 12px;
  color: var(--obs-text-dim);
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--obs-space-4);
}

.header-sprint {
  font-family: var(--obs-font-mono);
  font-size: 12px;
  color: var(--obs-text-muted);
  white-space: nowrap;
}
</style>