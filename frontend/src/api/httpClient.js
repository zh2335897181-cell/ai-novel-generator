/**
 * 共享 HTTP 客户端 — 统一处理认证、游客、错误、请求取消
 */

// 普通用户请求头
export function getUserHeaders(extraHeaders = {}) {
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const token = localStorage.getItem('token')
  const headers = { ...extraHeaders }

  if (isGuest) {
    headers['x-guest-mode'] = 'true'
    const guestToken = localStorage.getItem('guestToken')
    if (guestToken) headers['x-guest-token'] = guestToken
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// 管理员请求头
export function getAdminHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token')
  const adminKey = localStorage.getItem('adminKey') || ''
  const headers = { ...extraHeaders }

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (adminKey) headers['x-admin-key'] = adminKey

  return headers
}

// 统一 API 请求封装
export async function apiRequest(url, options = {}, { isAdmin = false } = {}) {
  const headers = isAdmin ? getAdminHeaders() : getUserHeaders()

  const config = {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  }

  let response
  try {
    response = await fetch(url, config)
  } catch (error) {
    throw new Error('网络请求失败，请检查网络连接')
  }

  // 捕获游客token
  const guestToken = response.headers.get('x-guest-token')
  if (guestToken) localStorage.setItem('guestToken', guestToken)

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || `请求失败 (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 便捷方法
export const http = {
  get(url, opts) { return apiRequest(url, { method: 'GET', ...opts }, opts) },
  post(url, body, opts) { return apiRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }, opts) },
  put(url, body, opts) { return apiRequest(url, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }, opts) },
  delete(url, opts) { return apiRequest(url, { method: 'DELETE', ...opts }, opts) }
}
