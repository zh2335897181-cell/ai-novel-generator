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
    path: '/novel/:id/analysis',
    name: 'DeepAnalysis',
    component: () => import('../views/DeepAnalysis.vue')
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
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: () => import('../views/Maintenance.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

import { useUserStore } from '../stores/user'

// 维护模式缓存
let maintenanceCache = { enabled: false, checkedAt: 0 }

async function checkMaintenance() {
  if (Date.now() - maintenanceCache.checkedAt < 30000) {
    return maintenanceCache.enabled
  }
  try {
    const res = await fetch('/api/maintenance-status')
    const data = await res.json()
    maintenanceCache = { enabled: data.maintenance, checkedAt: Date.now() }
    return data.maintenance
  } catch {
    return false
  }
}

// 路由守卫 - 检查认证状态和维护模式
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const isAuthenticated = !!token || isGuest

  // 公开页面始终放行（包括维护页面自身和登录页）
  if (to.meta.public) {
    next()
    return
  }

  // 如果路由需要认证且用户未登录，重定向到登录页
  if (!isAuthenticated) {
    next('/login')
    return
  }

  // 检查是否为管理员
  const userStore = useUserStore()
  const userRole = userStore.user?.role
  const hasAdminKey = !!localStorage.getItem('adminKey')
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || hasAdminKey

  // 如果路由需要管理员权限
  if (to.meta.requiresAdmin) {
    if (!isAdmin) {
      next('/login')
      return
    }
    next()
    return
  }

  // 维护模式检查（管理员可绕过）
  if (!isAdmin) {
    const maintenance = await checkMaintenance()
    if (maintenance) {
      next('/maintenance')
      return
    }
  }

  next()
})

export default router

