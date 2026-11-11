import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tasks, type TaskMeta } from '@/tasks/registry'

const HomeView = () => import('@/views/HomeView.vue')

function taskRoute(task: TaskMeta): RouteRecordRaw {
  return {
    path: `/task/${task.slug}`,
    name: `task-${task.slug}`,
    component: task.component,
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    ...tasks.map(taskRoute),
    { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' },
  ],
})