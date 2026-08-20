<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ObservatoryShell from '../../components/observatory/ObservatoryShell.vue'

onMounted(() => document.body.classList.add('observatory'))
onUnmounted(() => document.body.classList.remove('observatory'))
</script>

<template>
  <main class="observatory-page">
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
</style>
