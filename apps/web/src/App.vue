<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from './stores/gameStore'
import { Application, Container } from 'pixi.js'
import {
  DefaultRuntimeRendererAdapter,
  DefaultPixiEntityRenderer,
  DefaultRuntimeVisualizationLoop,
  DefaultAnimationFrameScheduler,
  DefaultVisualizationRunner,
  StoreBackedWorldProvider,
  DefaultEntityVisualCatalog,
  KeyboardInputProvider,
  DefaultCameraController,
} from '@genesis/renderer'
import type { RuntimeVisualizationLoop, VisualizationRunner } from '@genesis/renderer'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeSystemRegistry,
  DefaultPlayerControllerSystem,
  DefaultJumpSystem,
  DefaultGravitySystem,
  DefaultGroundCollisionSystem,
} from '@genesis/runtime'

const route = useRoute()
const isObservatory = computed(() => route.name === 'observatory')

const store = useGameStore()
const input = ref('')
const gameContainer = ref<HTMLDivElement | null>(null)

let pixiApp: Application | null = null
let visLoop: RuntimeVisualizationLoop | null = null
let runner: VisualizationRunner | null = null
let inputProvider: KeyboardInputProvider | null = null

onMounted(async () => {
  if (!gameContainer.value) return

  // 1. Create PIXI Application
  pixiApp = new Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    autoDensity: true,
  })

  // 2. Append canvas to the host container
  gameContainer.value.appendChild(pixiApp.view as HTMLCanvasElement)

  // 3. Create entity container and add to Pixi stage
  const entityContainer = new Container()
  pixiApp.stage.addChild(entityContainer)

  // 4. Create runtime execution components
  const systemRegistry = new DefaultRuntimeSystemRegistry()
  inputProvider = new KeyboardInputProvider(window)
  inputProvider.attach()
  systemRegistry.register(new DefaultPlayerControllerSystem(inputProvider, 3))
  systemRegistry.register(new DefaultJumpSystem(inputProvider, 50))
  systemRegistry.register(new DefaultGravitySystem(1))
  systemRegistry.register(new DefaultGroundCollisionSystem(400))
  const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)

  // 5. Create renderer adapter and entity renderer
  const adapter = new DefaultRuntimeRendererAdapter()
  const entityRenderer = new DefaultPixiEntityRenderer(entityContainer, {
    catalog: new DefaultEntityVisualCatalog(),
    cameraController: new DefaultCameraController(),
  })

  // 6. Create world provider backed by the store's RuntimeWorldStore
  const worldProvider = new StoreBackedWorldProvider(store.worldStore)

  // 7. Create visualization loop with world provider
  const initialWorld = store.worldStore.getWorld()
  visLoop = new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    entityRenderer,
    initialWorld,
    worldProvider,
    store.worldStore,
  )

  // 8. Create scheduler and runner
  const scheduler = new DefaultAnimationFrameScheduler()
  runner = new DefaultVisualizationRunner(scheduler, visLoop)

  // 9. Start continuous rendering
  runner.start()
})

onUnmounted(() => {
  runner?.stop()
  visLoop?.stop()
  inputProvider?.detach()
  inputProvider = null
  if (pixiApp) {
    pixiApp.destroy(true, { children: true, texture: true })
    pixiApp = null
  }
})

function handleSend() {
  const text = input.value.trim()
  if (!text) return
  store.send(text)
  input.value = ''
}
</script>

<template>
  <router-view v-if="isObservatory" />
  <div
    v-else
    class="app"
  >
    <h1>Project Genesis</h1>
    <div
      ref="gameContainer"
      class="game-container"
    />
    <div class="controls">
      <input
        v-model="input"
        type="text"
        placeholder="输入指令... (例如: 创建 MarioWorld)"
        class="input"
        @keyup.enter="handleSend"
      >
      <button
        class="btn"
        @click="handleSend"
      >
        发送
      </button>
    </div>
    <div
      v-if="store.log.length"
      class="log"
    >
      <div
        v-for="(entry, i) in store.log"
        :key="i"
        class="log-entry"
      >
        {{ entry }}
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.game-container {
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  line-height: 0;
}

.controls {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  align-items: center;
}

.input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}

.input:focus {
  border-color: #2E8B57;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  background: #2E8B57;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover {
  background: #3aa86a;
}

.log {
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.log-entry {
  font-size: 0.8rem;
  color: #666;
  padding: 0.15rem 0;
  font-family: monospace;
}
</style>
