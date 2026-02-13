import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import DashboardView from '../views/DashboardView.vue'
import AuthView from '../views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth init if refreshing
  if (authStore.loading) {
    await authStore.initAuth()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next('/auth')
  } else if (to.path === '/auth' && authStore.user) {
    next('/')
  } else {
    next()
  }
})

export default router
