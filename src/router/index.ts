import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue')
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../pages/EditorPage.vue')
    },
    {
      path: '/focus',
      name: 'focus',
      component: () => import('../pages/FocusBeadPage.vue')
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../pages/HelpPage.vue')
    }
  ]
})

export default router
