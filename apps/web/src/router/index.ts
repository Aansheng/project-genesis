import {
  createRouter,
  createWebHistory,
  type RouterHistory,
  type RouteRecordRaw,
} from 'vue-router'
import GameWorkspacePage from '../pages/game/GameWorkspacePage.vue'
import ObservatoryPage from '../pages/observatory/ObservatoryPage.vue'
import AISettingsPage from '../pages/settings/AISettingsPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'game',
    component: GameWorkspacePage,
  },
  {
    path: '/observatory',
    name: 'observatory',
    component: ObservatoryPage,
  },
  { path: '/settings/ai', name: 'ai-settings', component: AISettingsPage },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({ history, routes })
}

const router = createAppRouter()

export default router
