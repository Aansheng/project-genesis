<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const input = ref('')
const gameContainer = ref<HTMLDivElement | null>(null)

let pixiApp: Application | null = null
let visLoop: RuntimeVisualizationLoop | null = null
let runner: VisualizationRunner | null = null
let inputProvider: KeyboardInputProvider | null = null

onMounted(() => {
  if (!gameContainer.value) return

  pixiApp = new Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    autoDensity: true,
  })
  gameContainer.value.appendChild(pixiApp.view as HTMLCanvasElement)

  const entityContainer = new Container()
  pixiApp.stage.addChild(entityContainer)

  const systemRegistry = new DefaultRuntimeSystemRegistry()
  inputProvider = new KeyboardInputProvider(window)
  inputProvider.attach()
  systemRegistry.register(new DefaultPlayerControllerSystem(inputProvider, 3))
  systemRegistry.register(new DefaultJumpSystem(inputProvider, 50))
  systemRegistry.register(new DefaultGravitySystem(1))
  systemRegistry.register(new DefaultGroundCollisionSystem(400))

  const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
  const adapter = new DefaultRuntimeRendererAdapter()
  const entityRenderer = new DefaultPixiEntityRenderer(entityContainer, {
    catalog: new DefaultEntityVisualCatalog(),
    cameraController: new DefaultCameraController(),
  })
  const worldProvider = new StoreBackedWorldProvider(store.worldStore)

  visLoop = new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    entityRenderer,
    store.worldStore.getWorld(),
    worldProvider,
    store.worldStore,
  )
  runner = new DefaultVisualizationRunner(
    new DefaultAnimationFrameScheduler(),
    visLoop,
  )
  runner.start()
})

onUnmounted(() => {
  runner?.stop()
  runner = null
  visLoop?.stop()
  visLoop = null
  inputProvider?.detach()
  inputProvider = null
  pixiApp?.destroy(true, { children: true, texture: true })
  pixiApp = null
})

function handleSend(): void {
  const text = input.value.trim()
  if (!text) return
  void store.send(text)
  input.value = ''
}
</script>

<template>
  <main class="app">
    <nav
      class="workspace-nav"
      aria-label="Workspace navigation"
    >
      <span aria-current="page">Game</span>
      <RouterLink to="/observatory">
        Observatory
      </RouterLink>
    </nav>
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
  </main>
</template>

<style scoped>
.app {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.workspace-nav {
  display: flex;
  gap: 1rem;
  align-self: flex-end;
  font-size: 0.85rem;
}

.workspace-nav span {
  color: #fff;
}

.workspace-nav a {
  color: #8caaff;
  text-decoration: none;
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
  border-color: #2e8b57;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: 0;
  border-radius: 6px;
  background: #2e8b57;
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
  padding: 0.15rem 0;
  color: #666;
  font-family: monospace;
  font-size: 0.8rem;
}
</style>
