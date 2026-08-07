<script setup lang="ts">
import { ref } from 'vue'
import {
  useObservatoryStore,
  OBSERVATORY_PANELS,
  type ObservatoryPanel,
} from '../../stores/observatory'

const store = useObservatoryStore()
const itemRefs = ref<HTMLButtonElement[]>([])

function setItemRef(el: unknown, index: number): void {
  if (el) itemRefs.value[index] = el as HTMLButtonElement
}

function onKeydown(event: KeyboardEvent): void {
  const current = OBSERVATORY_PANELS.indexOf(store.selectedPanel)
  let next = current

  if (event.key === 'ArrowDown') {
    next = Math.min(current + 1, OBSERVATORY_PANELS.length - 1)
  } else if (event.key === 'ArrowUp') {
    next = Math.max(current - 1, 0)
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = OBSERVATORY_PANELS.length - 1
  } else {
    return
  }

  event.preventDefault()
  const panel = OBSERVATORY_PANELS[next]
  store.selectPanel(panel)
  itemRefs.value[next]?.focus()
}

function select(panel: ObservatoryPanel): void {
  store.selectPanel(panel)
}
</script>

<template>
  <nav
    class="observatory-sidebar"
    aria-label="Observatory panels"
    @keydown="onKeydown"
  >
    <ul class="sidebar-list">
      <li
        v-for="(panel, index) in OBSERVATORY_PANELS"
        :key="panel"
        class="sidebar-item"
      >
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="sidebar-button"
          :class="{ 'sidebar-button--active': store.selectedPanel === panel }"
          :aria-current="store.selectedPanel === panel ? 'page' : undefined"
          @click="select(panel)"
        >
          {{ panel }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.observatory-sidebar {
  display: flex;
  flex-direction: column;
  padding: var(--obs-space-3) var(--obs-space-3) var(--obs-space-5);
  border-right: 1px solid var(--obs-border);
  background: var(--obs-surface);
  overflow-y: auto;
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1);
}

.sidebar-item {
  margin: 0;
  padding: 0;
}

.sidebar-button {
  display: block;
  width: 100%;
  padding: var(--obs-space-2) var(--obs-space-3);
  border: 1px solid transparent;
  border-radius: var(--obs-radius-s);
  background: transparent;
  color: var(--obs-text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.sidebar-button:hover {
  background: var(--obs-surface-2);
  color: var(--obs-text);
}

.sidebar-button:focus-visible {
  outline: 2px solid var(--obs-accent);
  outline-offset: -2px;
}

.sidebar-button--active,
.sidebar-button--active:hover {
  background: var(--obs-accent-soft);
  border-color: rgba(110, 123, 255, 0.35);
  color: var(--obs-text);
}
</style>