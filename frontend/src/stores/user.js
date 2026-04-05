import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api/novel'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const isGuest = ref(false)
  const token = ref(localStorage.getItem('token') || '')
  const isUnlocked = ref(false) // 快捷键解锁状态
  const unlockTime = ref(null) // 解锁时间
  const unlockIP = ref(null) // 解锁时的IP
  
  // 游客计时暂停相关
  const isTimerPaused = ref(false)
  const pauseStartTime = ref(null)
  const totalPausedMs = ref(parseInt(localStorage.getItem('guestPausedMs') || '0'))

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const username = computed(() => user.value?.username || (isGuest.value ? '游客' : ''))
  
  // 是否有限制（游客且未解锁）
  const isRestricted = computed(() => {
    return isGuest.value && !isUnlocked.value && !isLoggedIn.value
  })

  // 是否可以访问受限功能
  const canAccessRestricted = computed(() => {
    return isLoggedIn.value || isUnlocked.value
  })

  // 获取当前IP
  const getCurrentIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // Actions
  const login = async (username, password) => {
    try {
      const res = await api.login({ username, password })
      token.value = res.token
      user.value = res.user
      localStorage.setItem('token', res.token)
      isGuest.value = false
      isUnlocked.value = false
      
      // 检查是否有游客数据需要导入
      const guestNovels = getGuestNovels()
      if (guestNovels.length > 0) {
        // 保存到返回值中，让调用方处理导入提示
        res.hasGuestData = true
        res.guestNovelCount = guestNovels.length
      }
      
      // 清除游客模式标记
      localStorage.removeItem('guestMode')
      localStorage.removeItem('guestStartTime')
      return res
    } catch (error) {
      throw new Error(error.response?.data?.message || '登录失败')
    }
  }

  const register = async (username, password) => {
    try {
      const res = await api.register({ username, password })
      return res
    } catch (error) {
      throw new Error(error.response?.data?.message || '注册失败')
    }
  }

  const logout = async () => {
    // 如果是游客模式，记录IP锁定
    if (isGuest.value) {
      const ip = await getCurrentIP()
      const lockedIPs = JSON.parse(localStorage.getItem('guestLockedIPs') || '[]')
      if (!lockedIPs.includes(ip)) {
        lockedIPs.push(ip)
        localStorage.setItem('guestLockedIPs', JSON.stringify(lockedIPs))
        console.log(`[Guest] IP ${ip} 已被锁定，无法再次游客登录`)
      }
    }
    
    token.value = ''
    user.value = null
    isGuest.value = false
    isUnlocked.value = false
    unlockTime.value = null
    unlockIP.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('unlocked')
    localStorage.removeItem('guestMode')
    localStorage.removeItem('guestStartTime')
    localStorage.removeItem('guestPausedMs')
  }

  const setGuestMode = (value) => {
    isGuest.value = value
    if (value) {
      user.value = { username: '游客', id: 'guest' }
      // 设置游客模式标记到 localStorage
      localStorage.setItem('guestMode', 'true')
      // 只有在没有开始时间时才设置（首次进入游客模式）
      const existingStartTime = localStorage.getItem('guestStartTime')
      if (!existingStartTime) {
        localStorage.setItem('guestStartTime', Date.now().toString())
      }
    } else {
      localStorage.removeItem('guestMode')
      localStorage.removeItem('guestStartTime')
      localStorage.removeItem('guestPausedMs')
    }
  }

  // 检查游客时间限制（10分钟）
  const checkGuestTimeLimit = () => {
    if (!isGuest.value) return { isExpired: false, remainingMs: null }
    
    const startTime = parseInt(localStorage.getItem('guestStartTime') || '0')
    if (!startTime) return { isExpired: false, remainingMs: null }
    
    const now = Date.now()
    const totalPaused = parseInt(localStorage.getItem('guestPausedMs') || '0')
    let elapsedMs = now - startTime - totalPaused
    
    // 如果正在暂停，扣除当前暂停时长
    if (isTimerPaused.value && pauseStartTime.value) {
      elapsedMs -= (now - pauseStartTime.value)
    }
    
    // 防呆：elapsedMs 最小为0
    elapsedMs = Math.max(0, elapsedMs)
    
    const TIME_LIMIT_MS = 10 * 60 * 1000 // 10分钟
    const remainingMs = Math.max(0, TIME_LIMIT_MS - elapsedMs)
    
    if (remainingMs <= 0) {
      localStorage.removeItem('guestMode')
      localStorage.removeItem('guestStartTime')
      localStorage.removeItem('guestPausedMs')
      isGuest.value = false
      user.value = null
      return { isExpired: true, remainingMs: 0 }
    }
    
    return { isExpired: false, remainingMs }
  }

  // 暂停游客计时
  const pauseGuestTimer = () => {
    if (!isGuest.value || isTimerPaused.value) return
    
    isTimerPaused.value = true
    pauseStartTime.value = Date.now()
    console.log('[GuestTimer] 计时已暂停')
  }
  
  // 恢复游客计时
  const resumeGuestTimer = () => {
    if (!isGuest.value || !isTimerPaused.value) return
    
    const pausedDuration = Date.now() - pauseStartTime.value
    const newTotal = totalPausedMs.value + pausedDuration
    totalPausedMs.value = newTotal
    localStorage.setItem('guestPausedMs', newTotal.toString())
    
    isTimerPaused.value = false
    pauseStartTime.value = null
    console.log('[GuestTimer] 计时已恢复，累计暂停：', Math.floor(newTotal / 1000), '秒')
  }
  const clearGuestMode = () => {
    localStorage.removeItem('guestMode')
    localStorage.removeItem('guestStartTime')
    localStorage.removeItem('guestPausedMs')
    isGuest.value = false
    totalPausedMs.value = 0
    if (!isLoggedIn.value) {
      user.value = null
    }
  }

  // 解锁功能 - 快捷键触发（记录IP）
  const unlockWithShortcut = async () => {
    if (!isGuest.value) {
      ElMessage.info('您已登录，无需解锁')
      return
    }
    
    if (isUnlocked.value) {
      ElMessage.info('已经处于解锁状态')
      return
    }

    // 获取当前IP
    const ip = await getCurrentIP()
    unlockIP.value = ip

    isUnlocked.value = true
    unlockTime.value = Date.now()
    
    // 保存解锁状态和IP
    localStorage.setItem('unlocked', JSON.stringify({
      time: unlockTime.value,
      ip: unlockIP.value
    }))
    
    // 记录解锁日志（可以在控制台查看，也可以发送到后端）
    console.log(`[Unlock] IP: ${ip}, Time: ${new Date().toLocaleString()}`)
    
    ElMessage({
      type: 'success',
      message: `已解锁全部功能！IP: ${ip}`,
      duration: 3000
    })
  }

// 检查解锁状态是否过期
  const checkUnlockStatus = () => {
    if (!isUnlocked.value) return
    
    const savedUnlock = localStorage.getItem('unlocked')
    if (savedUnlock) {
      const unlockData = JSON.parse(savedUnlock)
      // 24小时后自动过期
      if (Date.now() - unlockData.time > 24 * 60 * 60 * 1000) {
        isUnlocked.value = false
        unlockTime.value = null
        unlockIP.value = null
        localStorage.removeItem('unlocked')
        ElMessage.warning('解锁状态已过期，请重新解锁')
      }
    }
  }

  // 检查IP是否被游客模式锁定
  const checkGuestIPLock = async () => {
    const ip = await getCurrentIP()
    const lockedIPs = JSON.parse(localStorage.getItem('guestLockedIPs') || '[]')
    return lockedIPs.includes(ip)
  }

  const fetchUserInfo = async () => {
    // 游客模式跳过API调用
    if (isGuest.value) {
      console.log('[User] 游客模式，跳过用户信息获取')
      return
    }
    if (!token.value) return
    try {
      const res = await api.getUserInfo()
      user.value = res.user
    } catch (error) {
      // Token 无效，清除登录状态
      logout()
    }
  }

  // 保存游客小说到本地存储
  const saveGuestNovel = (novelData) => {
    const guestNovels = getGuestNovels()
    const novelWithTimestamp = {
      ...novelData,
      guestCreatedAt: Date.now(),
      isGuestData: true
    }
    guestNovels.push(novelWithTimestamp)
    localStorage.setItem('guestNovels', JSON.stringify(guestNovels))
    console.log('[Guest] 小说已保存到本地:', novelData.title)
    return novelWithTimestamp
  }

  // 获取所有游客小说
  const getGuestNovels = () => {
    try {
      return JSON.parse(localStorage.getItem('guestNovels') || '[]')
    } catch {
      return []
    }
  }

  // 导入游客数据到登录账号
  const importGuestData = async () => {
    const guestNovels = getGuestNovels()
    if (guestNovels.length === 0) {
      return { success: false, message: '没有可导入的游客数据' }
    }
    
    let importedCount = 0
    let failedCount = 0
    
    for (const novel of guestNovels) {
      try {
        // 调用API导入小说
        await api.importNovel({
          title: novel.title,
          content: novel.content,
          worldState: novel.worldState,
          characters: novel.characters,
          createdAt: novel.guestCreatedAt
        })
        importedCount++
      } catch (error) {
        console.error('[Guest] 导入小说失败:', novel.title, error)
        failedCount++
      }
    }
    
    // 清空游客数据
    localStorage.removeItem('guestNovels')
    
    return {
      success: true,
      importedCount,
      failedCount,
      message: `成功导入 ${importedCount} 本小说${failedCount > 0 ? `，${failedCount} 本失败` : ''}`
    }
  }

  // 清除游客数据（不导入）
  const clearGuestData = () => {
    localStorage.removeItem('guestNovels')
    console.log('[Guest] 游客数据已清除')
  }

  return {
    user,
    isGuest,
    token,
    isUnlocked,
    unlockTime,
    unlockIP,
    isTimerPaused,
    isLoggedIn,
    username,
    isRestricted,
    canAccessRestricted,
    login,
    register,
    logout,
    setGuestMode,
    fetchUserInfo,
    unlockWithShortcut,
    checkUnlockStatus,
    checkGuestTimeLimit,
    checkGuestIPLock,
    clearGuestMode,
    pauseGuestTimer,
    resumeGuestTimer,
    getCurrentIP,
    saveGuestNovel,
    getGuestNovels,
    importGuestData,
    clearGuestData
  }
})
