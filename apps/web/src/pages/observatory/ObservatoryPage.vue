<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ObservatoryShell from '../../components/observatory/ObservatoryShell.vue'

onMounted(() => document.body.classList.add('observatory'))
onUnmounted(() => document.body.classList.remove('observatory'))
</script>

<template>
  <main class="observatory-page">
    <RouterLink
      class="game-link"
      to="/"
    >
      Game
    </RouterLink>
    <ObservatoryShell />
  </main>
</template>

<style>
body.observatory {
  display: block;
  align-items: unset;
  justify-content: unset;
  min-width: 1280px;
  overflow-x: hidden;
  background: #0a0a0b;
}

.observatory-page .game-link {
  position: fixed;
  z-index: 10;
  top: 16px;
  right: 168px;
  color: #8caaff;
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  text-decoration: none;
}
</style>
