import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../views/Landing.vue'

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
    component: () => import('../views/NovelList.vue')
  },
  {
    path: '/novel/:id',
    name: 'NovelDetail',
    component: () => import('../views/NovelDetail.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/ai-config',
    name: 'AIConfig',
    component: () => import('../views/AIConfig.vue')
  },
  {
    path: '/mobile-test',
    name: 'MobileTest',
    component: () => import('../views/MobileTest.vue'),
    meta: { public: true }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/PrivacyPolicy.vue'),
    meta: { public: true }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/TermsOfService.vue'),
    meta: { public: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/bookshelf',
    name: 'BookShelf',
    component: () => import('../views/BookShelf.vue'),
    meta: { public: true }
  },
  {
    path: '/read/:novelId',
    name: 'PublicRead',
    component: () => import('../views/PublicRead.vue'),
    meta: { public: true }
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
    return
  }
  
  // 如果路由需要管理员权限
  if (to.meta.requiresAdmin) {
    const userStore = useUserStore()
    const userRole = userStore.user?.role
    if (userRole !== 'admin' && userRole !== 'super_admin' && !localStorage.getItem('adminKey')) {
      next('/login')
      return
    }
  }
  
  next()
})

export default router

