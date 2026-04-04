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
  const isTimerPaused = ref(false) // 计时是否暂停
  const pauseStartTime = ref(null) // 暂停开始时间
  const totalPausedMs = ref(0) // 累计暂停时长（毫秒）

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

  const logout = () => {
    token.value = ''
    user.value = null
    isGuest.value = false
    isUnlocked.value = false
    unlockTime.value = null
    unlockIP.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('unlocked')
  }

  const setGuestMode = (value) => {
    isGuest.value = value
    if (value) {
      user.value = { username: '游客', id: 'guest' }
    }
  }

  // 检查游客时间限制（10分钟），支持暂停功能
  const checkGuestTimeLimit = () => {
    if (!isGuest.value) return { isExpired: false, remainingMinutes: null }
    
    const startTime = parseInt(localStorage.getItem('guestStartTime') || '0')
    if (!startTime) return { isExpired: false, remainingMinutes: null }
    
    // 计算实际经过的时间（扣除暂停时间）
    let elapsedMs = Date.now() - startTime - totalPausedMs.value
    
    // 如果当前处于暂停状态，再扣除当前暂停的时长
    if (isTimerPaused.value && pauseStartTime.value) {
      elapsedMs -= (Date.now() - pauseStartTime.value)
    }
    
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000))
    const remainingMinutes = Math.max(0, 10 - elapsedMinutes)
    
    if (elapsedMinutes >= 10) {
      // 时间已过期，清理游客状态
      localStorage.removeItem('guestMode')
      localStorage.removeItem('guestStartTime')
      isGuest.value = false
      user.value = null
      return { isExpired: true, remainingMinutes: 0 }
    }
    
    return { isExpired: false, remainingMinutes }
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
    
    // 计算本次暂停的时长并累加
    const pausedDuration = Date.now() - pauseStartTime.value
    totalPausedMs.value += pausedDuration
    
    isTimerPaused.value = false
    pauseStartTime.value = null
    console.log('[GuestTimer] 计时已恢复，累计暂停：', Math.floor(totalPausedMs.value / 1000), '秒')
  }
  const clearGuestMode = () => {
    localStorage.removeItem('guestMode')
    localStorage.removeItem('guestStartTime')
    isGuest.value = false
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
    clearGuestMode,
    pauseGuestTimer,
    resumeGuestTimer,
    getCurrentIP
  }
})
