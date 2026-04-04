import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../views/Landing.vue'
import NovelList from '../views/NovelList.vue'
import NovelDetail from '../views/NovelDetail.vue'
import Login from '../views/Login.vue'
import AIConfig from '../views/AIConfig.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
    meta: { public: true }
  },
  {
    path: '/novels',
    name: 'NovelList',
    component: NovelList
  },
  {
    path: '/novel/:id',
    name: 'NovelDetail',
    component: NovelDetail
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/ai-config',
    name: 'AIConfig',
    component: AIConfig
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

import { useUserStore } from '../stores/user'

// 路由守卫 - 检查认证状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const isAuthenticated = !!token || isGuest
  
  // 如果路由需要认证且用户未登录（包括游客），重定向到登录页
  if (!to.meta.public && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
