const BASE = '/api/admin'

const getAdminHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('token')
  const adminKey = localStorage.getItem('adminKey') || ''
  const headers = { ...extraHeaders }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (adminKey) {
    headers['x-admin-key'] = adminKey
  }

  return headers
}

export default {
  // 初始化数据库
  async initTables() {
    const response = await fetch(`${BASE}/init`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '初始化失败')
    return data
  },

  // 仪表盘统计
  async getDashboard() {
    const response = await fetch(`${BASE}/dashboard`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取统计失败')
    return data
  },

  // 用户管理
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/users?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取用户列表失败')
    return data
  },

  async updateUserStatus(userId, status, reason = '') {
    const response = await fetch(`${BASE}/users/${userId}/status`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async updateUserRole(userId, role) {
    const response = await fetch(`${BASE}/users/${userId}/role`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async deleteUser(userId) {
    const response = await fetch(`${BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // 次管理员管理
  async getSubAdmins(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/sub-admins?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取次管理员列表失败')
    return data
  },

  async createSubAdmin(username, password, permissions = null) {
    const response = await fetch(`${BASE}/sub-admins`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username, password, permissions })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '创建失败')
    return data
  },

  async updateSubAdmin(userId, permissions) {
    const response = await fetch(`${BASE}/sub-admins/${userId}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ permissions })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async deleteSubAdmin(userId) {
    const response = await fetch(`${BASE}/sub-admins/${userId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // 内容审核
  async getReviews(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/reviews?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取审核列表失败')
    return data
  },

  async reviewContent(reviewId, status, reason = '') {
    const response = await fetch(`${BASE}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '审核失败')
    return data
  },

  async aiCheckReview(reviewId) {
    const response = await fetch(`${BASE}/reviews/${reviewId}/ai-check`, {
      method: 'POST',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'AI检测失败')
    return data
  },

  async batchReviewContent(ids, status, reason = '') {
    const response = await fetch(`${BASE}/reviews/batch`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ids, status, reason })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '批量审核失败')
    return data
  },

  // 举报管理
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/reports?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取举报列表失败')
    return data
  },

  async createReport(data) {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '提交举报失败')
    return result
  },

  async handleReport(reportId, status, action = '', reason = '') {
    const response = await fetch(`${BASE}/reports/${reportId}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, action, reason })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '处理失败')
    return data
  },

  // 小说管理
  async getNovels(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/novels?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取小说列表失败')
    return data
  },

  async getNovelDetail(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取详情失败')
    return data
  },

  async updateNovelStatus(novelId, status, reason = '') {
    const response = await fetch(`${BASE}/novels/${novelId}/status`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async deleteNovel(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // 操作日志
  async getLogs(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/logs?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取日志失败')
    return data
  },

  // 系统设置
  async getSettings() {
    const response = await fetch(`${BASE}/settings`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取设置失败')
    return data
  },

  async updateSettings(settings) {
    const response = await fetch(`${BASE}/settings`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ settings })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新设置失败')
    return data
  },

  // 受信任设备管理
  async getDevices() {
    const response = await fetch(`${BASE}/devices`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取设备列表失败')
    return data
  },

  async revokeDevice(deviceId) {
    const response = await fetch(`${BASE}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '撤销失败')
    return data
  },

  // 邀请码管理
  async getInviteCodes(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/invite-codes?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取邀请码列表失败')
    return data
  },

  async generateInviteCodes({ count, maxUses, expiresAt }) {
    const response = await fetch(`${BASE}/invite-codes`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ count, maxUses, expiresAt })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '生成邀请码失败')
    return data
  },

  async updateInviteCode(codeId, updates) {
    const response = await fetch(`${BASE}/invite-codes/${codeId}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async deleteInviteCode(codeId) {
    const response = await fetch(`${BASE}/invite-codes/${codeId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // 敏感词管理
  async getSensitiveWords(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE}/sensitive-words?${query}`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取敏感词列表失败')
    return data
  },

  async addSensitiveWord(data) {
    const response = await fetch(`${BASE}/sensitive-words`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '添加失败')
    return result
  },

  async batchImportWords(words) {
    const response = await fetch(`${BASE}/sensitive-words/batch`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ words })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '批量导入失败')
    return data
  },

  async updateSensitiveWord(wordId, data) {
    const response = await fetch(`${BASE}/sensitive-words/${wordId}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '更新失败')
    return result
  },

  async deleteSensitiveWord(wordId) {
    const response = await fetch(`${BASE}/sensitive-words/${wordId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  async testSensitiveWords(text) {
    const response = await fetch(`${BASE}/sensitive-words/test`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '测试失败')
    return data
  },

  // 更新日志
  async getChangelogs() {
    const response = await fetch(`${BASE}/changelogs`, {
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取失败')
    return data
  },

  async createChangelog(changelog) {
    const response = await fetch(`${BASE}/changelogs`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(changelog)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '创建失败')
    return data
  },

  async updateChangelog(id, changelog) {
    const response = await fetch(`${BASE}/changelogs/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(changelog)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新失败')
    return data
  },

  async deleteChangelog(id) {
    const response = await fetch(`${BASE}/changelogs/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  }
}
