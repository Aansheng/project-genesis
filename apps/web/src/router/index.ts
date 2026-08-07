import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ObservatoryPage from '../pages/observatory/ObservatoryPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/observatory',
    name: 'observatory',
    component: ObservatoryPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router