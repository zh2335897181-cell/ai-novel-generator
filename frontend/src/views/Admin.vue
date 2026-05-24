<template>
  <div class="admin-panel">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="admin-sidebar">
      <div class="sidebar-header">
        <el-icon><Setting /></el-icon>
        <span>管理后台</span>
      </div>
      <el-menu
        :default-active="activeTab"
        @select="handleMenuSelect"
        class="sidebar-menu"
      >
        <el-menu-item index="dashboard" v-if="hasPermission('dashboard')">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="users" v-if="hasPermission('users')">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="sub-admins" v-if="isSuperAdmin">
          <el-icon><UserFilled /></el-icon>
          <span>次管理员管理</span>
        </el-menu-item>
        <el-menu-item index="reviews" v-if="hasPermission('reviews')">
          <el-icon><DocumentChecked /></el-icon>
          <span>内容审核</span>
          <el-badge v-if="stats.reviews?.pending > 0" :value="stats.reviews.pending" class="badge" />
        </el-menu-item>
        <el-menu-item index="reports" v-if="hasPermission('reports')">
          <el-icon><Warning /></el-icon>
          <span>举报处理</span>
          <el-badge v-if="stats.reports?.pending > 0" :value="stats.reports.pending" class="badge" />
        </el-menu-item>
        <el-menu-item index="novels" v-if="hasPermission('novels')">
          <el-icon><Reading /></el-icon>
          <span>小说管理</span>
        </el-menu-item>
        <el-menu-item index="logs" v-if="hasPermission('logs')">
          <el-icon><Memo /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="invite-codes" v-if="hasPermission('invite-codes')">
          <el-icon><Ticket /></el-icon>
          <span>邀请码管理</span>
        </el-menu-item>
        <el-menu-item index="sensitive-words" v-if="hasPermission('sensitive-words')">
          <el-icon><Warning /></el-icon>
          <span>敏感词管理</span>
        </el-menu-item>
        <el-menu-item index="devices" v-if="hasPermission('devices')">
          <el-icon><Monitor /></el-icon>
          <span>受信任设备</span>
        </el-menu-item>
        <el-menu-item index="settings" v-if="hasPermission('settings')">
          <el-icon><Tools /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
        <el-menu-item index="changelogs" v-if="hasPermission('changelogs')">
          <el-icon><Notebook /></el-icon>
          <span>更新日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-main class="admin-main">
      <!-- 顶部栏 -->
      <el-header class="admin-header">
        <div class="header-left">
          <h2>{{ menuTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="admin-info">{{ username }}</span>
          <el-button @click="handleLogout" type="danger" size="small">退出</el-button>
        </div>
      </el-header>

      <!-- 内容区 -->
      <div class="admin-content">
        <!-- 数据概览 -->
        <div v-if="activeTab === 'dashboard'" class="dashboard-view">
          <el-row :gutter="20" class="stats-cards">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon user-icon">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ dashboardData.users?.total || 0 }}</div>
                    <div class="stat-label">总用户数</div>
                    <div class="stat-trend">+{{ dashboardData.users?.today_new || 0 }} 今日新增</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon novel-icon">
                    <el-icon><Reading /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ dashboardData.novels?.total || 0 }}</div>
                    <div class="stat-label">总小说数</div>
                    <div class="stat-trend">+{{ dashboardData.novels?.today_new || 0 }} 今日新增</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon chapter-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ dashboardData.chapters?.total || 0 }}</div>
                    <div class="stat-label">总章节数</div>
                    <div class="stat-trend">+{{ dashboardData.chapters?.today_new || 0 }} 今日新增</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon review-icon">
                    <el-icon><DocumentChecked /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ dashboardData.reviews?.pending || 0 }}</div>
                    <div class="stat-label">待审核</div>
                    <div class="stat-trend">{{ dashboardData.reviews?.total || 0 }} 总数</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="charts-row">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>用户注册趋势（7天）</span>
                </template>
                <div class="chart-placeholder">
                  <div v-for="(item, index) in dashboardData.userTrend" :key="index" class="trend-item">
                    <span class="trend-date">{{ item.date }}</span>
                    <div class="trend-bar">
                      <div class="trend-fill" :style="{ width: (item.count / Math.max(...dashboardData.userTrend.map(t => t.count)) * 100) + '%' }"></div>
                    </div>
                    <span class="trend-count">{{ item.count }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>小说创建趋势（7天）</span>
                </template>
                <div class="chart-placeholder">
                  <div v-for="(item, index) in dashboardData.novelTrend" :key="index" class="trend-item">
                    <span class="trend-date">{{ item.date }}</span>
                    <div class="trend-bar">
                      <div class="trend-fill" :style="{ width: (item.count / Math.max(...dashboardData.novelTrend.map(t => t.count)) * 100) + '%' }"></div>
                    </div>
                    <span class="trend-count">{{ item.count }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 次管理员管理 -->
        <div v-if="activeTab === 'sub-admins'" class="sub-admins-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>次管理员管理</span>
                <el-button v-if="isSuperAdmin" type="primary" @click="createSubAdminDialog = true">
                  创建次管理员
                </el-button>
              </div>
            </template>
            <el-table :data="subAdmins" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" width="150" />
              <el-table-column label="角色" width="100">
                <template #default="{ row }">
                  <el-tag type="warning">次管理员</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                    {{ row.status === 'active' ? '正常' : '封禁' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="权限" min-width="250">
                <template #default="{ row }">
                  <el-tag
                    v-for="p in (row.permissions || [])"
                    :key="p"
                    size="small"
                    style="margin:2px;"
                  >{{ permLabel(p) }}</el-tag>
                  <span v-if="!(row.permissions || []).length" style="color:#909399;font-size:12px;">无权限</span>
                </template>
              </el-table-column>
              <el-table-column prop="parent_admin_name" label="上级管理员" width="150" />
              <el-table-column prop="created_at" label="创建时间" width="180" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button v-if="isSuperAdmin" size="small" type="primary" @click="openPermDialog(row)">权限</el-button>
                  <el-button v-if="isSuperAdmin" size="small" type="danger" @click="handleDeleteSubAdmin(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="subAdminPage"
              :page-size="subAdminPageSize"
              :total="subAdminTotal"
              @current-change="loadSubAdmins"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'" class="users-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>用户管理</span>
                <el-input
                  v-model="userKeyword"
                  placeholder="搜索用户名或ID"
                  style="width: 200px"
                  @change="loadUsers"
                />
              </div>
            </template>
            <el-table :data="users" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" width="150" />
              <el-table-column label="角色" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : row.status === 'banned' ? 'danger' : 'warning'">
                    {{ row.status === 'active' ? '正常' : row.status === 'banned' ? '封禁' : '禁言' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="novel_count" label="小说数" width="100" />
              <el-table-column prop="chapter_count" label="章节数" width="100" />
              <el-table-column prop="created_at" label="注册时间" width="180" />
              <el-table-column label="操作" width="300">
                <template #default="{ row }">
                  <el-button size="small" @click="handleUserStatus(row)">状态</el-button>
                  <el-button size="small" @click="handleUserRole(row)">角色</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="userPage"
              :page-size="userPageSize"
              :total="userTotal"
              @current-change="loadUsers"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 内容审核 -->
        <div v-if="activeTab === 'reviews'" class="reviews-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>内容审核</span>
                <div style="display:flex;gap:8px;align-items:center;">
                  <el-select v-model="reviewStatus" @change="loadReviews" style="width: 150px">
                    <el-option label="待审核" value="pending" />
                    <el-option label="已通过" value="approved" />
                    <el-option label="已拒绝" value="rejected" />
                  </el-select>
                </div>
              </div>
            </template>
            <!-- 批量操作栏 -->
            <div v-if="selectedReviews.length > 0 && reviewStatus === 'pending'" class="batch-action-bar">
              <span class="batch-selected-count">已选 {{ selectedReviews.length }} 项</span>
              <el-button size="small" type="success" :loading="batchReviewing" @click="handleBatchReview('approved')">
                批量通过
              </el-button>
              <el-button size="small" type="danger" :loading="batchReviewing" @click="handleBatchReview('rejected')">
                批量拒绝
              </el-button>
              <el-button size="small" @click="selectedReviews = []">取消选择</el-button>
            </div>
            <el-table :data="reviews" v-loading="loading" @selection-change="val => selectedReviews = val">
              <el-table-column type="selection" width="50" :selectable="row => row.status === 'pending'" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column label="类型" width="100">
                <template #default="{ row }">
                  <el-tag>{{ row.content_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="author_name" label="作者" width="120" />
              <el-table-column prop="novel_title" label="小说" width="150" />
              <el-table-column prop="content" label="内容" show-overflow-tooltip />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">
                    {{ row.status === 'approved' ? '通过' : row.status === 'rejected' ? '拒绝' : '待审核' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="提交时间" width="180" />
              <el-table-column label="操作" width="280">
                <template #default="{ row }">
                  <el-button v-if="row.status === 'pending'" size="small" type="success" @click="handleReview(row, 'approved')">通过</el-button>
                  <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="handleReview(row, 'rejected')">拒绝</el-button>
                  <el-button v-if="row.status === 'pending'" size="small" type="info" :loading="aiChecking" @click="handleAICheck(row)">AI检测</el-button>
                  <el-button size="small" @click="handleViewReview(row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="reviewPage"
              :page-size="reviewPageSize"
              :total="reviewTotal"
              @current-change="loadReviews"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 举报处理 -->
        <div v-if="activeTab === 'reports'" class="reports-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>举报处理</span>
                <el-select v-model="reportStatus" @change="loadReports" style="width: 150px">
                  <el-option label="待处理" value="pending" />
                  <el-option label="已处理" value="resolved" />
                  <el-option label="已忽略" value="dismissed" />
                </el-select>
              </div>
            </template>
            <el-table :data="reports" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column label="类型" width="110">
                <template #default="{ row }">
                  <el-tag :type="getReportTypeTag(row)">{{ getReportTypeLabel(row) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reporter_name" label="举报人" width="120" />
              <el-table-column prop="target_user_name" label="被举报人" width="120" />
              <el-table-column prop="novel_title" label="相关小说" width="150" />
              <el-table-column label="原因详情" min-width="250">
                <template #default="{ row }">
                  <div class="reason-cell">{{ getReportReason(row) }}</div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'resolved' ? 'success' : row.status === 'dismissed' ? 'info' : 'warning'">
                    {{ row.status === 'resolved' ? '已处理' : row.status === 'dismissed' ? '已忽略' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="举报时间" width="180" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button v-if="row.status === 'pending'" size="small" type="success" @click="handleReportAction(row, 'resolved')">处理</el-button>
                  <el-button v-if="row.status === 'pending'" size="small" @click="handleReportAction(row, 'dismissed')">忽略</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="reportPage"
              :page-size="reportPageSize"
              :total="reportTotal"
              @current-change="loadReports"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 小说管理 -->
        <div v-if="activeTab === 'novels'" class="novels-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>小说管理</span>
                <el-input
                  v-model="novelKeyword"
                  placeholder="搜索小说标题或ID"
                  style="width: 200px"
                  @change="loadNovels"
                />
              </div>
            </template>
            <el-table :data="novels" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="title" label="标题" width="200" />
              <el-table-column prop="author_name" label="作者" width="120" />
              <el-table-column label="状态" width="130">
                <template #default="{ row }">
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    <el-tag :type="row.status === 'active' ? 'success' : row.status === 'blocked' ? 'danger' : 'warning'" size="small">
                      {{ row.status === 'active' ? '正常' : row.status === 'blocked' ? '封禁' : '审核中' }}
                    </el-tag>
                    <span v-if="row.pending_reviews > 0" style="font-size:11px;color:#e6a23c;">
                      待审: {{ row.pending_reviews }}项
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="chapter_count" label="章节数" width="100" />
              <el-table-column prop="created_at" label="创建时间" width="180" />
              <el-table-column label="操作" width="250">
                <template #default="{ row }">
                  <el-button size="small" @click="handleNovelDetail(row)">详情</el-button>
                  <el-button size="small" @click="handleNovelStatus(row)">状态</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteNovel(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="novelPage"
              :page-size="novelPageSize"
              :total="novelTotal"
              @current-change="loadNovels"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 操作日志 -->
        <div v-if="activeTab === 'logs'" class="logs-view">
          <el-card>
            <template #header>
              <span>操作日志</span>
            </template>
            <el-table :data="logs" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="admin_name" label="管理员" width="120" />
              <el-table-column prop="action" label="操作" width="150" />
              <el-table-column label="目标" width="150">
                <template #default="{ row }">
                  {{ row.target_type }} #{{ row.target_id }}
                </template>
              </el-table-column>
              <el-table-column prop="detail" label="详情" show-overflow-tooltip />
              <el-table-column prop="created_at" label="时间" width="180" />
            </el-table>
            <el-pagination
              v-model:current-page="logPage"
              :page-size="logPageSize"
              :total="logTotal"
              @current-change="loadLogs"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 邀请码管理 -->
        <div v-if="activeTab === 'invite-codes'" class="invite-codes-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>邀请码管理</span>
                <div>
                  <el-switch
                    v-model="inviteOnly"
                    active-text="邀请码模式"
                    inactive-text="开放注册"
                    @change="handleToggleInviteOnly"
                    style="margin-right: 16px"
                  />
                  <el-button type="primary" @click="showGenerateCodesDialog = true">生成邀请码</el-button>
                </div>
              </div>
            </template>
            <el-table :data="inviteCodes" v-loading="loading">
              <el-table-column prop="code" label="邀请码" width="220" />
              <el-table-column prop="creator_name" label="创建者" width="120" />
              <el-table-column label="使用情况" width="120">
                <template #default="{ row }">
                  {{ row.current_uses }} / {{ row.max_uses }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'info'">
                    {{ row.is_active ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="expires_at" label="过期时间" width="180">
                <template #default="{ row }">
                  {{ row.expires_at ? new Date(row.expires_at).toLocaleString('zh-CN') : '永不过期' }}
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ new Date(row.created_at).toLocaleString('zh-CN') }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" @click="handleToggleCodeStatus(row)">
                    {{ row.is_active ? '禁用' : '启用' }}
                  </el-button>
                  <el-button size="small" type="danger" @click="handleDeleteInviteCode(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="inviteCodePage"
              :page-size="inviteCodePageSize"
              :total="inviteCodeTotal"
              @current-change="loadInviteCodes"
              layout="total, prev, pager, next"
              class="pagination"
            />
          </el-card>
        </div>

        <!-- 生成邀请码对话框 -->
        <el-dialog v-model="showGenerateCodesDialog" title="生成邀请码" width="450px">
          <el-form :model="generateCodesForm">
            <el-form-item label="生成数量">
              <el-input-number v-model="generateCodesForm.count" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="每个可用次数">
              <el-input-number v-model="generateCodesForm.maxUses" :min="1" :max="1000" />
            </el-form-item>
            <el-form-item label="过期时间">
              <el-date-picker
                v-model="generateCodesForm.expiresAt"
                type="datetime"
                placeholder="留空则永不过期"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showGenerateCodesDialog = false">取消</el-button>
            <el-button type="primary" @click="handleGenerateCodes">生成</el-button>
          </template>
        </el-dialog>

        <!-- 敏感词管理 -->
        <div v-if="activeTab === 'sensitive-words'" class="sensitive-words-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>敏感词库（{{ sensitiveTotal }} 个）</span>
                <div style="display: flex; gap: 8px;">
                  <el-input v-model="sensitiveSearch" placeholder="搜索敏感词" size="small" style="width: 180px" clearable @clear="loadSensitiveWords" @keyup.enter="loadSensitiveWords" />
                  <el-button type="primary" size="small" @click="showAddWordDialog = true">添加</el-button>
                  <el-button size="small" @click="showBatchImportDialog = true">批量导入</el-button>
                  <el-button size="small" @click="showTestDialog = true">测试过滤</el-button>
                </div>
              </div>
            </template>
            <el-table :data="sensitiveWords" stripe>
              <el-table-column prop="word" label="敏感词" width="160" />
              <el-table-column prop="severity" label="严重程度" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'" size="small">
                    {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="replacement" label="替换词" width="120">
                <template #default="{ row }">{{ row.replacement || '***' }}</template>
              </el-table-column>
              <el-table-column prop="is_active" label="状态" width="80">
                <template #default="{ row }">
                  <el-switch v-model="row.is_active" :active-value="1" :inactive-value="0" @change="(val) => handleToggleWord(row, val)" />
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-button size="small" @click="editWord = row; showEditWordDialog = true">编辑</el-button>
                  <el-popconfirm title="确定删除？" @confirm="handleDeleteWord(row.id)">
                    <template #reference>
                      <el-button size="small" type="danger" text>删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 添加敏感词对话框 -->
          <el-dialog v-model="showAddWordDialog" title="添加敏感词" width="450px">
            <el-form :model="wordForm" label-width="80px">
              <el-form-item label="敏感词">
                <el-input v-model="wordForm.word" placeholder="输入敏感词" />
              </el-form-item>
              <el-form-item label="严重程度">
                <el-select v-model="wordForm.severity">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                </el-select>
              </el-form-item>
              <el-form-item label="替换词">
                <el-input v-model="wordForm.replacement" placeholder="可选，用于替换敏感词" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="showAddWordDialog = false">取消</el-button>
              <el-button type="primary" @click="handleAddWord">添加</el-button>
            </template>
          </el-dialog>

          <!-- 编辑敏感词对话框 -->
          <el-dialog v-model="showEditWordDialog" title="编辑敏感词" width="450px">
            <el-form :model="editWord" label-width="80px">
              <el-form-item label="敏感词">
                <el-input v-model="editWord.word" />
              </el-form-item>
              <el-form-item label="严重程度">
                <el-select v-model="editWord.severity">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                </el-select>
              </el-form-item>
              <el-form-item label="替换词">
                <el-input v-model="editWord.replacement" placeholder="可选" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="showEditWordDialog = false">取消</el-button>
              <el-button type="primary" @click="handleUpdateWord">保存</el-button>
            </template>
          </el-dialog>

          <!-- 批量导入对话框 -->
          <el-dialog v-model="showBatchImportDialog" title="批量导入敏感词" width="500px">
            <el-alert title="每行一个敏感词，格式：敏感词|严重程度|替换词" type="info" :closable="false" style="margin-bottom: 12px" />
            <p style="font-size: 12px; color: #909399;">例如：暴力|high| 或 广告|medium|推广</p>
            <el-input v-model="batchWordsText" type="textarea" :rows="10" placeholder="每行一个敏感词" style="margin-top: 8px" />
            <template #footer>
              <el-button @click="showBatchImportDialog = false">取消</el-button>
              <el-button type="primary" @click="handleBatchImport">导入</el-button>
            </template>
          </el-dialog>

          <!-- 测试过滤对话框 -->
          <el-dialog v-model="showTestDialog" title="测试敏感词过滤" width="600px">
            <el-input v-model="testText" type="textarea" :rows="5" placeholder="输入测试文本" />
            <el-button type="primary" @click="handleTestFilter" style="margin-top: 12px" :loading="testLoading">测试</el-button>
            <div v-if="testResult" style="margin-top: 16px">
              <el-divider />
              <h4>过滤结果</h4>
              <div class="test-result-box">{{ testResult.filtered }}</div>
              <h4 style="margin-top: 12px">命中敏感词</h4>
              <el-tag v-for="h in testResult.hits" :key="h.word" style="margin-right: 8px; margin-bottom: 4px" :type="h.severity === 'high' ? 'danger' : 'warning'">
                {{ h.word }} ({{ h.severity }})
              </el-tag>
              <div v-if="testResult.hits.length === 0" style="color: #67c23a">未命中任何敏感词</div>
            </div>
            <template #footer>
              <el-button @click="showTestDialog = false">关闭</el-button>
            </template>
          </el-dialog>
        </div>

        <!-- 受信任设备 -->
        <div v-if="activeTab === 'devices'" class="devices-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>受信任设备</span>
                <span style="color: #909399; font-size: 13px;">受信任设备登录时无需安全码</span>
              </div>
            </template>
            <el-table :data="devices" stripe>
              <el-table-column prop="device_name" label="设备名称" width="160" />
              <el-table-column prop="ip_address" label="IP地址" width="150" />
              <el-table-column prop="last_used" label="最后使用" width="180">
                <template #default="{ row }">
                  {{ new Date(row.last_used).toLocaleString('zh-CN') }}
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="首次信任" width="180">
                <template #default="{ row }">
                  {{ new Date(row.created_at).toLocaleString('zh-CN') }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-popconfirm title="撤销后该设备登录需重新验证安全码" @confirm="handleRevokeDevice(row.id)">
                    <template #reference>
                      <el-button size="small" type="danger" text>撤销信任</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="devices.length === 0" description="暂无受信任设备" />
          </el-card>
        </div>

        <!-- 系统设置 -->
        <div v-if="activeTab === 'settings'" class="settings-view">
          <el-card>
            <template #header>
              <span>系统设置</span>
            </template>
            <el-form :model="settings" label-width="200px" style="max-width: 600px">
              <el-form-item label="自动审核">
                <el-switch v-model="settings.auto_review" />
              </el-form-item>
              <el-form-item label="敏感词列表">
                <el-input v-model="settings.sensitive_words" type="textarea" :rows="4" placeholder="逗号分隔敏感词" />
              </el-form-item>
              <el-form-item label="每用户最大小说数">
                <el-input-number v-model="settings.max_novels_per_user" :min="1" :max="1000" />
              </el-form-item>
              <el-form-item label="每小说最大章节数">
                <el-input-number v-model="settings.max_chapters_per_novel" :min="1" :max="10000" />
              </el-form-item>
              <el-form-item label="游客时间限制(分钟)">
                <el-input-number v-model="settings.guest_time_limit" :min="1" :max="1440" />
              </el-form-item>
              <el-form-item label="维护模式">
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                  <el-switch v-model="settings.maintenance_mode" />
                  <el-date-picker
                    v-model="settings.maintenance_estimated_end"
                    type="datetime"
                    placeholder="预计完成时间（可选）"
                    format="YYYY-MM-DD HH:00"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    :disabled-date="disabledDate"
                    style="width:220px;"
                  />
                </div>
                <div v-if="settings.maintenance_mode && settings.maintenance_estimated_end" style="margin-top:6px;font-size:12px;color:#e6a23c;">
                  预计 {{ settings.maintenance_estimated_end.replace('T', ' ') }} 完成维护
                </div>
              </el-form-item>
              <el-form-item label="定时维护">
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                  <el-switch v-model="settings.maintenance_scheduled_enabled" active-text="定时开启" />
                  <el-date-picker
                    v-model="settings.maintenance_scheduled_time"
                    type="datetime"
                    placeholder="开始时间"
                    format="YYYY-MM-DD HH:00"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    :disabled-date="disabledDate"
                    style="width:220px;"
                  />
                  <span style="color:#909399;">至</span>
                  <el-date-picker
                    v-model="settings.maintenance_scheduled_end"
                    type="datetime"
                    placeholder="结束时间（可选）"
                    format="YYYY-MM-DD HH:00"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    :disabled-date="disabledDate"
                    style="width:220px;"
                  />
                </div>
                <div v-if="settings.maintenance_scheduled_enabled && settings.maintenance_scheduled_time" style="margin-top:6px;font-size:12px;color:#909399;">
                  将于 {{ settings.maintenance_scheduled_time.replace('T', ' ') }} 自动开启<template v-if="settings.maintenance_scheduled_end">，{{ settings.maintenance_scheduled_end.replace('T', ' ') }} 自动结束</template>
                </div>
              </el-form-item>
              <el-form-item label="站点公告">
                <div style="display:flex;gap:12px;margin-bottom:8px;align-items:center;">
                  <el-switch v-model="settings.site_notice_enabled" active-text="启用" />
                  <el-select v-model="settings.site_notice_type" size="small" style="width:140px;">
                    <el-option label="信息 (蓝色)" value="info" />
                    <el-option label="警告 (橙色)" value="warning" />
                    <el-option label="重要 (红色)" value="danger" />
                  </el-select>
                </div>
                <el-input v-model="settings.site_notice" type="textarea" :rows="4" placeholder="输入公告内容..." />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveSettings">保存设置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 更新日志 -->
        <div v-if="activeTab === 'changelogs'" class="changelogs-view">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>更新日志</span>
                <el-button type="primary" size="small" @click="openChangelogDialog(null)">
                  <el-icon><Plus /></el-icon>添加版本
                </el-button>
              </div>
            </template>
            <!-- 时间线列表 -->
            <div v-if="changelogs.length === 0" style="text-align:center;padding:40px;color:#909399;">
              暂无更新日志，点击"添加版本"开始记录
            </div>
            <div class="changelog-timeline" v-else>
              <div
                v-for="(entry, idx) in changelogs"
                :key="entry.id"
                class="changelog-entry"
              >
                <div class="changelog-dot" :class="'dot-' + (entry.type || 'feature')"></div>
                <div v-if="idx < changelogs.length - 1" class="changelog-line"></div>
                <div class="changelog-card">
                  <div class="changelog-card-header">
                    <div>
                      <span class="changelog-version">{{ entry.version }}</span>
                      <el-tag
                        :type="entry.type === 'feature' ? 'success' : entry.type === 'bugfix' ? 'danger' : entry.type === 'breaking' ? 'danger' : 'warning'"
                        size="small"
                        style="margin-left:8px;"
                      >
                        {{ typeLabel(entry.type) }}
                      </el-tag>
                    </div>
                    <span class="changelog-date">{{ entry.release_date?.split('T')[0] || entry.release_date }}</span>
                  </div>
                  <div class="changelog-card-title">{{ entry.title }}</div>
                  <div class="changelog-card-changes">{{ entry.changes }}</div>
                  <div class="changelog-card-actions">
                    <el-button size="small" text @click="openChangelogDialog(entry)">
                      <el-icon><Edit /></el-icon>编辑
                    </el-button>
                    <el-popconfirm title="确定删除此更新日志？" @confirm="handleDeleteChangelog(entry.id)">
                      <template #reference>
                        <el-button size="small" text type="danger">
                          <el-icon><Delete /></el-icon>删除
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-main>

    <!-- 对话框 -->
    <el-dialog v-model="createSubAdminDialog" title="创建次管理员" width="420px">
      <el-form :model="subAdminForm">
        <el-form-item label="用户名">
          <el-input v-model="subAdminForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="subAdminForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-divider content-position="left">初始权限</el-divider>
        <el-checkbox-group v-model="subAdminForm.permissions" class="perm-checkbox-group">
          <el-checkbox v-for="p in allPermissionOptions" :key="p.key" :label="p.key" :value="p.key">{{ p.label }}</el-checkbox>
        </el-checkbox-group>
      </el-form>
      <template #footer>
        <el-button @click="createSubAdminDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubAdmin">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑次管理员权限对话框 -->
    <el-dialog v-model="permDialogVisible" :title="'编辑权限 - ' + permTarget?.username" width="420px">
      <el-checkbox-group v-model="permForm.permissions" class="perm-checkbox-group">
        <el-checkbox v-for="p in allPermissionOptions" :key="p.key" :label="p.key" :value="p.key">{{ p.label }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPerm" @click="handleSavePermissions">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userStatusDialog" title="修改用户状态" width="400px">
      <el-form :model="userStatusForm">
        <el-form-item label="状态">
          <el-select v-model="userStatusForm.status">
            <el-option label="正常" value="active" />
            <el-option label="封禁" value="banned" />
            <el-option label="禁言" value="muted" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="userStatusForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUserStatus">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialog" title="审核内容" width="600px">
      <el-form :model="reviewForm">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核原因">
          <el-input v-model="reviewForm.reason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReview">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="aiCheckDialog" title="AI 内容审核检测" width="700px">
      <div class="ai-check-content" v-html="aiCheckResultHtml" />
      <template #footer>
        <el-button type="primary" @click="aiCheckDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialog" title="处理举报" width="600px">
      <el-form :model="reportForm">
        <el-form-item label="处理结果">
          <el-radio-group v-model="reportForm.status">
            <el-radio value="resolved">已处理</el-radio>
            <el-radio value="dismissed">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理动作">
          <el-select v-model="reportForm.action">
            <el-option label="无操作" value="" />
            <el-option label="封禁用户" value="ban_user" />
            <el-option label="封禁小说" value="block_content" />
            <el-option label="封禁章节" value="block_chapter" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="reportForm.reason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReportAction">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="novelDetailDialog" title="小说详情" width="800px">
      <div v-if="currentNovel" class="novel-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentNovel.novel.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ currentNovel.novel.title }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ currentNovel.novel.author_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentNovel.novel.status === 'active' ? 'success' : 'danger'">
              {{ currentNovel.novel.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="章节数">{{ currentNovel.chapters.length }}</el-descriptions-item>
          <el-descriptions-item label="角色数">{{ currentNovel.characters.length }}</el-descriptions-item>
        </el-descriptions>
        <h3>章节列表</h3>
        <el-table :data="currentNovel.chapters" max-height="300">
          <el-table-column prop="chapter_number" label="章节号" width="100" />
          <el-table-column prop="chapter_title" label="标题" width="200" />
          <el-table-column prop="content" label="内容" show-overflow-tooltip />
        </el-table>
      </div>
    </el-dialog>

    <!-- 更新日志编辑对话框 -->
    <el-dialog v-model="changelogDialog" :title="editingChangelog ? '编辑更新日志' : '添加更新日志'" width="650px">
      <el-form :model="changelogForm" label-width="80px">
        <el-form-item label="版本号">
          <el-input v-model="changelogForm.version" placeholder="如 v1.2.0" />
        </el-form-item>
        <el-form-item label="发布日期">
          <el-date-picker v-model="changelogForm.release_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%;" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="changelogForm.title" placeholder="如：新增自动审核功能" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="changelogForm.type" style="width:100%;">
            <el-option label="新功能 (feature)" value="feature" />
            <el-option label="优化改进 (improvement)" value="improvement" />
            <el-option label="问题修复 (bugfix)" value="bugfix" />
            <el-option label="重大变更 (breaking)" value="breaking" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新内容">
          <el-input v-model="changelogForm.changes" type="textarea" :rows="8" placeholder="每行一条更新内容，如：&#10;- 新增自动审核功能&#10;- 优化首页加载速度&#10;- 修复登录闪退问题" />
          <div style="margin-top:6px;">
            <el-button size="small" text type="primary" @click="applyChangelogTemplate">
              <el-icon><MagicStick /></el-icon>应用模板
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changelogDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingChangelog" @click="handleSaveChangelog">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, DataAnalysis, User, UserFilled, DocumentChecked, Warning,
  Reading, Memo, Tools, Document, Monitor, Ticket,
  Notebook
} from '@element-plus/icons-vue'
import adminApi from '../api/admin'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const activeTab = ref('dashboard')
const loading = ref(false)

const menuTitle = computed(() => {
  const titles = {
    dashboard: '数据概览',
    users: '用户管理',
    'sub-admins': '次管理员管理',
    reviews: '内容审核',
    reports: '举报处理',
    novels: '小说管理',
    logs: '操作日志',
    'invite-codes': '邀请码管理',
    'sensitive-words': '敏感词管理',
    devices: '受信任设备',
    settings: '系统设置',
    changelogs: '更新日志'
  }
  return titles[activeTab.value]
})

const username = computed(() => userStore.user?.username || '管理员')
const isSuperAdmin = computed(() => userStore.user?.role === 'super_admin')
const isSubAdmin = computed(() => userStore.user?.role === 'admin')
const adminPermissions = computed(() => userStore.user?.permissions || [])

// 检查是否有指定权限（超级管理员始终全权限）
const hasPermission = (key) => {
  if (isSuperAdmin.value) return true
  if (!isSubAdmin.value) return false
  return adminPermissions.value.includes(key)
}

// 统计数据
const stats = ref({})
const dashboardData = ref({})

// 用户管理
const users = ref([])
const userKeyword = ref('')
const userPage = ref(1)
const userPageSize = ref(20)
const userTotal = ref(0)
const userStatusDialog = ref(false)
const userStatusForm = ref({ status: 'active', reason: '' })
const currentUser = ref(null)

// 次管理员管理
const subAdmins = ref([])
const subAdminPage = ref(1)
const subAdminPageSize = ref(20)
const subAdminTotal = ref(0)
const createSubAdminDialog = ref(false)
const subAdminForm = ref({ username: '', password: '', permissions: ['reviews', 'reports', 'novels', 'sensitive-words'] })

// 权限编辑
const permDialogVisible = ref(false)
const permTarget = ref(null)
const permForm = ref({ permissions: [] })
const savingPerm = ref(false)

const allPermissionOptions = [
  { key: 'dashboard', label: '数据概览' },
  { key: 'users', label: '用户管理' },
  { key: 'reviews', label: '内容审核' },
  { key: 'reports', label: '举报处理' },
  { key: 'novels', label: '小说管理' },
  { key: 'logs', label: '操作日志' },
  { key: 'invite-codes', label: '邀请码管理' },
  { key: 'sensitive-words', label: '敏感词管理' },
  { key: 'devices', label: '受信任设备' },
  { key: 'settings', label: '系统设置' },
  { key: 'changelogs', label: '更新日志' }
]

const permLabel = (key) => {
  const found = allPermissionOptions.find(p => p.key === key)
  return found ? found.label : key
}

const openPermDialog = (row) => {
  permTarget.value = row
  permForm.value.permissions = [...(row.permissions || [])]
  permDialogVisible.value = true
}

const handleSavePermissions = async () => {
  savingPerm.value = true
  try {
    await adminApi.updateSubAdmin(permTarget.value.id, permForm.value.permissions)
    ElMessage.success('权限已更新')
    permDialogVisible.value = false
    loadSubAdmins()
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    savingPerm.value = false
  }
}

// 内容审核
const reviews = ref([])
const reviewStatus = ref('pending')
const reviewPage = ref(1)
const reviewPageSize = ref(20)
const reviewTotal = ref(0)
const reviewDialog = ref(false)
const reviewForm = ref({ status: 'approved', reason: '' })
const currentReview = ref(null)
const aiChecking = ref(false)
const aiCheckDialog = ref(false)
const aiCheckResultHtml = ref('')
const selectedReviews = ref([])
const batchReviewing = ref(false)

// 举报处理
const reports = ref([])
const reportStatus = ref('pending')
const reportPage = ref(1)
const reportPageSize = ref(20)
const reportTotal = ref(0)
const reportDialog = ref(false)
const reportForm = ref({ status: 'resolved', action: '', reason: '' })
const currentReport = ref(null)

// 小说管理
const novels = ref([])
const novelKeyword = ref('')
const novelPage = ref(1)
const novelPageSize = ref(20)
const novelTotal = ref(0)
const novelDetailDialog = ref(false)
const currentNovel = ref(null)

// 操作日志
const logs = ref([])
const logPage = ref(1)
const logPageSize = ref(20)
const logTotal = ref(0)

// 受信任设备
const devices = ref([])

// 邀请码管理
const inviteCodes = ref([])
const inviteCodePage = ref(1)
const inviteCodePageSize = ref(20)
const inviteCodeTotal = ref(0)
const inviteOnly = ref(false)
const showGenerateCodesDialog = ref(false)
const generateCodesForm = ref({ count: 5, maxUses: 1, expiresAt: '' })

// 敏感词管理
const sensitiveWords = ref([])
const sensitiveTotal = ref(0)
const sensitiveSearch = ref('')
const showAddWordDialog = ref(false)
const showEditWordDialog = ref(false)
const showBatchImportDialog = ref(false)
const showTestDialog = ref(false)
const wordForm = ref({ word: '', severity: 'medium', replacement: '' })
const editWord = ref({ id: null, word: '', severity: 'medium', replacement: '' })
const batchWordsText = ref('')
const testText = ref('')
const testLoading = ref(false)
const testResult = ref(null)

// 系统设置
const settings = ref({
  auto_review: false,
  sensitive_words: '',
  max_novels_per_user: 50,
  max_chapters_per_novel: 500,
  guest_time_limit: 10,
  maintenance_mode: false,
  maintenance_estimated_end: '',
  maintenance_scheduled_enabled: false,
  maintenance_scheduled_time: '',
  maintenance_scheduled_end: '',
  site_notice: '',
  site_notice_enabled: false,
  site_notice_type: 'info'
})

const handleMenuSelect = (index) => {
  activeTab.value = index
  loadData()
}

const loadData = async () => {
  switch (activeTab.value) {
    case 'dashboard':
      await loadDashboard()
      break
    case 'users':
      await loadUsers()
      break
    case 'sub-admins':
      await loadSubAdmins()
      break
    case 'reviews':
      await loadReviews()
      break
    case 'reports':
      await loadReports()
      break
    case 'novels':
      await loadNovels()
      break
    case 'logs':
      await loadLogs()
      break
    case 'invite-codes':
      await loadInviteCodes()
      break
    case 'sensitive-words':
      await loadSensitiveWords()
      break
    case 'devices':
      await loadDevices()
      break
    case 'settings':
      await loadSettings()
      break
    case 'changelogs':
      await loadChangelogs()
      break
  }
}

const loadDashboard = async () => {
  try {
    loading.value = true
    const res = await adminApi.getDashboard()
    dashboardData.value = res.data
    stats.value = {
      reviews: res.data.reviews,
      reports: res.data.reports
    }
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    loading.value = true
    const res = await adminApi.getUsers({
      page: userPage.value,
      pageSize: userPageSize.value,
      keyword: userKeyword.value
    })
    users.value = res.data.list
    userTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadSubAdmins = async () => {
  try {
    loading.value = true
    const res = await adminApi.getSubAdmins({
      page: subAdminPage.value,
      pageSize: subAdminPageSize.value
    })
    subAdmins.value = res.data.list
    subAdminTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadReviews = async () => {
  try {
    loading.value = true
    const res = await adminApi.getReviews({
      page: reviewPage.value,
      pageSize: reviewPageSize.value,
      status: reviewStatus.value
    })
    reviews.value = res.data.list
    reviewTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadReports = async () => {
  try {
    loading.value = true
    const res = await adminApi.getReports({
      page: reportPage.value,
      pageSize: reportPageSize.value,
      status: reportStatus.value
    })
    reports.value = res.data.list
    reportTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 举报类型标签提取（从reason字段解析反馈类型）
const getReportTypeLabel = (row) => {
  const typeMap = { bug: '功能故障', suggestion: '产品建议', content: '内容举报', other: '其他', novel: '小说举报', chapter: '章节举报', user: '用户举报' }
  if (row.type && row.type !== 'other') return typeMap[row.type] || row.type
  const match = row.reason?.match(/【(.+?)】/)
  return match ? match[1] : typeMap[row.type] || row.type
}
const getReportTypeTag = (row) => {
  const typeMap = { bug: 'danger', suggestion: '', content: 'warning', other: 'info', novel: 'warning', chapter: 'warning', user: 'danger' }
  if (row.type && row.type !== 'other') return typeMap[row.type] || 'info'
  const match = row.reason?.match(/【(.+?)】/)
  const label = match ? match[1] : ''
  if (label.includes('故障')) return 'danger'
  if (label.includes('建议')) return 'success'
  if (label.includes('举报')) return 'warning'
  return 'info'
}
const getReportReason = (row) => {
  if (!row.reason) return '-'
  // 去掉【类型】前缀，只显示实际内容
  const cleaned = row.reason.replace(/^【.+?】\s*\n?/, '')
  return cleaned || row.reason
}

const loadNovels = async () => {
  try {
    loading.value = true
    const res = await adminApi.getNovels({
      page: novelPage.value,
      pageSize: novelPageSize.value,
      keyword: novelKeyword.value
    })
    novels.value = res.data.list
    novelTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadLogs = async () => {
  try {
    loading.value = true
    const res = await adminApi.getLogs({
      page: logPage.value,
      pageSize: logPageSize.value
    })
    logs.value = res.data.list
    logTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadSettings = async () => {
  try {
    loading.value = true
    const res = await adminApi.getSettings()
    const data = res.data || {}
    // 类型转换：数据库存储的是字符串，需要转换回正确的JS类型
    settings.value = {
      auto_review: data.auto_review === 'true' || data.auto_review === '1',
      sensitive_words: data.sensitive_words || '',
      max_novels_per_user: parseInt(data.max_novels_per_user) || 50,
      max_chapters_per_novel: parseInt(data.max_chapters_per_novel) || 500,
      guest_time_limit: parseInt(data.guest_time_limit) || 10,
      maintenance_mode: data.maintenance_mode === 'true' || data.maintenance_mode === '1',
      maintenance_estimated_end: data.maintenance_estimated_end || '',
      maintenance_scheduled_enabled: data.maintenance_scheduled_enabled === 'true' || data.maintenance_scheduled_enabled === '1',
      maintenance_scheduled_time: data.maintenance_scheduled_time || '',
      maintenance_scheduled_end: data.maintenance_scheduled_end || '',
      site_notice: data.site_notice || '',
      site_notice_enabled: data.site_notice_enabled === 'true' || data.site_notice_enabled === '1',
      site_notice_type: data.site_notice_type || 'info'
    }
    inviteOnly.value = data.invite_only === 'true' || data.invite_only === '1'
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadDevices = async () => {
  try {
    loading.value = true
    const res = await adminApi.getDevices()
    devices.value = res.data
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleRevokeDevice = async (deviceId) => {
  try {
    await adminApi.revokeDevice(deviceId)
    ElMessage.success('设备信任已撤销')
    loadDevices()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const loadInviteCodes = async () => {
  try {
    loading.value = true
    const res = await adminApi.getInviteCodes({
      page: inviteCodePage.value,
      pageSize: inviteCodePageSize.value
    })
    inviteCodes.value = res.data.list
    inviteCodeTotal.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleToggleInviteOnly = async (val) => {
  try {
    await adminApi.updateSettings({ invite_only: val ? 'true' : 'false' })
    ElMessage.success(val ? '已开启邀请码注册模式' : '已关闭邀请码注册模式')
  } catch (error) {
    ElMessage.error(error.message)
    inviteOnly.value = !val
  }
}

const handleGenerateCodes = async () => {
  try {
    const res = await adminApi.generateInviteCodes({
      count: generateCodesForm.value.count,
      maxUses: generateCodesForm.value.maxUses,
      expiresAt: generateCodesForm.value.expiresAt || undefined
    })
    ElMessage.success(res.message)
    showGenerateCodesDialog.value = false
    // 显示生成的邀请码
    ElMessageBox.alert(
      res.data.codes.map(c => `<code style="font-size:16px;font-family:monospace">${c}</code>`).join('<br>'),
      '生成的邀请码',
      { dangerouslyUseHTMLString: true, confirmButtonText: '已复制保存' }
    )
    loadInviteCodes()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleToggleCodeStatus = async (row) => {
  try {
    await adminApi.updateInviteCode(row.id, { isActive: !row.is_active })
    ElMessage.success(row.is_active ? '邀请码已禁用' : '邀请码已启用')
    loadInviteCodes()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleDeleteInviteCode = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该邀请码吗？', '警告', { type: 'warning' })
    await adminApi.deleteInviteCode(row.id)
    ElMessage.success('邀请码已删除')
    loadInviteCodes()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message)
  }
}

const handleUserStatus = (row) => {
  currentUser.value = row
  userStatusForm.value = { status: row.status, reason: row.ban_reason || '' }
  userStatusDialog.value = true
}

const confirmUserStatus = async () => {
  try {
    await adminApi.updateUserStatus(currentUser.value.id, userStatusForm.value.status, userStatusForm.value.reason)
    ElMessage.success('用户状态已更新')
    userStatusDialog.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleUserRole = async (row) => {
  try {
    const newRole = row.role === 'admin' ? 'user' : 'admin'
    await adminApi.updateUserRole(row.id, newRole)
    ElMessage.success('用户角色已更新')
    loadUsers()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleDeleteUser = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复。', '警告', {
      type: 'warning'
    })
    await adminApi.deleteUser(row.id)
    ElMessage.success('用户已删除')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message)
  }
}

const handleCreateSubAdmin = async () => {
  try {
    if (!subAdminForm.value.username || !subAdminForm.value.password) {
      ElMessage.warning('请填写用户名和密码')
      return
    }
    await adminApi.createSubAdmin(subAdminForm.value.username, subAdminForm.value.password, subAdminForm.value.permissions)
    ElMessage.success('次管理员创建成功')
    createSubAdminDialog.value = false
    subAdminForm.value = { username: '', password: '', permissions: ['reviews', 'reports', 'novels', 'sensitive-words'] }
    loadSubAdmins()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleDeleteSubAdmin = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该次管理员吗？此操作不可恢复。', '警告', {
      type: 'warning'
    })
    await adminApi.deleteSubAdmin(row.id)
    ElMessage.success('次管理员已删除')
    loadSubAdmins()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message)
  }
}

const handleReview = (row, status) => {
  currentReview.value = row
  reviewForm.value = { status, reason: '' }
  reviewDialog.value = true
}

const confirmReview = async () => {
  try {
    await adminApi.reviewContent(currentReview.value.id, reviewForm.value.status, reviewForm.value.reason)
    ElMessage.success('审核完成')
    reviewDialog.value = false
    loadReviews()
    loadDashboard()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleBatchReview = async (status) => {
  try {
    const label = status === 'approved' ? '通过' : '拒绝'
    await ElMessageBox.confirm(
      `确定要批量${label} ${selectedReviews.value.length} 条内容吗？`,
      '批量审核',
      { type: 'warning' }
    )
    batchReviewing.value = true
    const ids = selectedReviews.value.map(r => r.id)
    await adminApi.batchReviewContent(ids, status)
    ElMessage.success(`已批量${label} ${ids.length} 条内容`)
    selectedReviews.value = []
    loadReviews()
    loadDashboard()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '批量审核失败')
  } finally {
    batchReviewing.value = false
  }
}

const handleViewReview = (row) => {
  ElMessageBox.alert(row.content, '内容详情', {
    confirmButtonText: '关闭'
  })
}

const escapeHtml = (str) => {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

const handleAICheck = async (row) => {
  aiChecking.value = true
  try {
    const res = await adminApi.aiCheckReview(row.id)
    const parsed = res.data.parsed
    let html = ''
    // 显示解析结果摘要
    if (parsed) {
      const decisionMap = { approved: '✅ 通过', rejected: '❌ 违规', pending: '⚠️ 需人工复核' }
      const riskMap = { low: '低', medium: '中', high: '高' }
      html += `<div style="margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.03);border-radius:6px;">`
      html += `<div style="font-size:16px;font-weight:700;margin-bottom:6px;">${decisionMap[parsed.decision] || parsed.decision}</div>`
      html += `<div style="font-size:13px;color:#606266;">风险等级：<strong>${riskMap[parsed.riskLevel] || parsed.riskLevel}</strong></div>`
      html += `<div style="font-size:13px;color:#606266;">${escapeHtml(parsed.reason || '')}</div>`
      html += `</div>`
    }
    // 显示原始AI结果
    html += '<div style="border-top:1px solid #ebeef5;padding-top:10px;margin-top:8px;">'
    html += '<div style="font-size:12px;color:#909399;margin-bottom:6px;">AI原始输出：</div>'
    html += escapeHtml(res.data.result)
      .replace(/\n/g, '<br>')
      .replace(/【(.+?)】/g, '<strong style="color:#fb7185">【$1】</strong>')
    html += '</div>'
    aiCheckResultHtml.value = html
    aiCheckDialog.value = true
  } catch (error) {
    ElMessage.error(error.message || 'AI检测失败')
  } finally {
    aiChecking.value = false
  }
}

const handleReportAction = (row, status) => {
  currentReport.value = row
  reportForm.value = { status, action: '', reason: '' }
  reportDialog.value = true
}

const confirmReportAction = async () => {
  try {
    await adminApi.handleReport(currentReport.value.id, reportForm.value.status, reportForm.value.action, reportForm.value.reason)
    ElMessage.success('举报已处理')
    reportDialog.value = false
    loadReports()
    loadDashboard()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleNovelDetail = async (row) => {
  try {
    loading.value = true
    const res = await adminApi.getNovelDetail(row.id)
    currentNovel.value = res.data
    novelDetailDialog.value = true
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleNovelStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'blocked' : 'active'
    await adminApi.updateNovelStatus(row.id, newStatus)
    ElMessage.success('小说状态已更新')
    loadNovels()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleDeleteNovel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该小说吗？此操作不可恢复。', '警告', {
      type: 'warning'
    })
    await adminApi.deleteNovel(row.id)
    ElMessage.success('小说已删除')
    loadNovels()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message)
  }
}

// 定时维护：禁止选择过去的时间
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 3600000 // 允许当前小时内
}

// ===== 更新日志 =====
const changelogs = ref([])
const changelogDialog = ref(false)
const savingChangelog = ref(false)
const editingChangelog = ref(null)
const changelogForm = ref({
  version: '',
  release_date: '',
  title: '',
  changes: '',
  type: 'feature'
})

const typeLabel = (t) => ({ feature: '新功能', improvement: '优化', bugfix: '修复', breaking: '重大' }[t] || t)

const applyChangelogTemplate = () => {
  const now = new Date()
  changelogForm.value.release_date = now.toISOString().split('T')[0]
  if (!changelogForm.value.title) changelogForm.value.title = '系统更新'
  if (!changelogForm.value.changes) {
    changelogForm.value.changes = '- 新增：\n- 优化：\n- 修复：\n- 其他：'
  }
}

const loadChangelogs = async () => {
  try {
    loading.value = true
    const res = await adminApi.getChangelogs()
    changelogs.value = res.data || []
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const openChangelogDialog = (entry) => {
  if (entry) {
    editingChangelog.value = entry
    changelogForm.value = {
      version: entry.version || '',
      release_date: entry.release_date?.split('T')[0] || '',
      title: entry.title || '',
      changes: entry.changes || '',
      type: entry.type || 'feature'
    }
  } else {
    editingChangelog.value = null
    changelogForm.value = { version: '', release_date: '', title: '', changes: '', type: 'feature' }
  }
  changelogDialog.value = true
}

const handleSaveChangelog = async () => {
  if (!changelogForm.value.version || !changelogForm.value.release_date || !changelogForm.value.title || !changelogForm.value.changes) {
    ElMessage.warning('请填写完整信息')
    return
  }
  savingChangelog.value = true
  try {
    if (editingChangelog.value) {
      await adminApi.updateChangelog(editingChangelog.value.id, changelogForm.value)
      ElMessage.success('已更新')
    } else {
      await adminApi.createChangelog(changelogForm.value)
      ElMessage.success('已添加')
    }
    changelogDialog.value = false
    loadChangelogs()
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    savingChangelog.value = false
  }
}

const handleDeleteChangelog = async (id) => {
  try {
    await adminApi.deleteChangelog(id)
    ElMessage.success('已删除')
    loadChangelogs()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleSaveSettings = async () => {
  try {
    await adminApi.updateSettings(settings.value)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 敏感词管理方法
const loadSensitiveWords = async () => {
  try {
    loading.value = true
    const res = await adminApi.getSensitiveWords({ search: sensitiveSearch.value || undefined })
    sensitiveWords.value = res.list
    sensitiveTotal.value = res.total
  } catch (e) {
    ElMessage.error('加载敏感词失败：' + e.message)
  } finally {
    loading.value = false
  }
}

const handleAddWord = async () => {
  if (!wordForm.value.word.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  try {
    await adminApi.addSensitiveWord(wordForm.value)
    ElMessage.success('敏感词已添加')
    showAddWordDialog.value = false
    wordForm.value = { word: '', severity: 'medium', replacement: '' }
    loadSensitiveWords()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleUpdateWord = async () => {
  try {
    await adminApi.updateSensitiveWord(editWord.value.id, {
      word: editWord.value.word,
      severity: editWord.value.severity,
      replacement: editWord.value.replacement
    })
    ElMessage.success('敏感词已更新')
    showEditWordDialog.value = false
    loadSensitiveWords()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleToggleWord = async (row, val) => {
  try {
    await adminApi.updateSensitiveWord(row.id, { is_active: val })
    ElMessage.success(val ? '已启用' : '已禁用')
  } catch (e) {
    ElMessage.error(e.message)
    loadSensitiveWords()
  }
}

const handleDeleteWord = async (id) => {
  try {
    await adminApi.deleteSensitiveWord(id)
    ElMessage.success('已删除')
    loadSensitiveWords()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleBatchImport = async () => {
  if (!batchWordsText.value.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  const lines = batchWordsText.value.split('\n').filter(l => l.trim())
  const words = lines.map(line => {
    const parts = line.split('|')
    return { word: parts[0].trim(), severity: parts[1]?.trim() || 'medium', replacement: parts[2]?.trim() || null }
  })
  try {
    const res = await adminApi.batchImportWords(words)
    ElMessage.success(res.message || '导入完成')
    showBatchImportDialog.value = false
    batchWordsText.value = ''
    loadSensitiveWords()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleTestFilter = async () => {
  if (!testText.value.trim()) {
    ElMessage.warning('请输入测试文本')
    return
  }
  testLoading.value = true
  try {
    const res = await adminApi.testSensitiveWords(testText.value)
    testResult.value = res.data
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    testLoading.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  window.location.href = '/login'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-panel {
  display: flex;
  height: 100vh;
  background: var(--bg-page);
}

.admin-sidebar {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.06);
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-menu {
  flex: 1;
  border: none;
  background: transparent;
}
.sidebar-menu :deep(.el-menu-item) {
  color: #94a3b8;
  margin: 2px 8px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.06);
  color: #e2e8f0;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(244,63,94,0.25);
}

.badge {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.badge :deep(.el-badge__content) {
  position: static;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.admin-header {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
}
.header-left h2 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.header-right { display: flex; align-items: center; gap: 16px; }
.admin-info { color: var(--text-secondary); font-weight: 500; font-size: var(--text-sm); }
.admin-content { flex: 1; padding: 24px; overflow-y: auto; }

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all var(--transition-spring);
  border-radius: var(--radius-lg) !important;
  border: 1px solid var(--border-glass) !important;
  box-shadow: var(--shadow-card) !important;
  overflow: hidden;
  position: relative;
}
.stat-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--gradient-primary);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover) !important;
}
.stat-content { display: flex; align-items: center; }
.stat-icon {
  width: 52px; height: 52px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  margin-right: 16px; font-size: 24px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}
.user-icon { background: var(--gradient-primary); color: #fff; }
.novel-icon { background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff; }
.chapter-icon { background: var(--gradient-accent); color: #fff; }
.review-icon { background: var(--gradient-warm); color: #fff; }
.stat-value { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
.stat-label { font-size: var(--text-sm); color: var(--text-muted); margin-top: 4px; }
.stat-trend { font-size: var(--text-xs); color: var(--success); margin-top: 4px; font-weight: 500; }

.charts-row {
  margin-bottom: 20px;
}

.chart-placeholder {
  min-height: 200px;
}

.trend-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.trend-date {
  width: 100px;
  font-size: 12px;
  color: #909399;
}

.trend-bar {
  flex: 1;
  height: 20px;
  background: #f1f5f9;
  border-radius: var(--radius-full);
  margin: 0 15px;
  overflow: hidden;
}
.trend-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease-out-expo);
}

.trend-count {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ===== 更新日志时间线 ===== */
.changelog-timeline {
  position: relative;
  padding-left: 24px;
}

.changelog-entry {
  position: relative;
  padding-bottom: 20px;
}

.changelog-dot {
  position: absolute;
  left: -29px;
  top: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #409EFF;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #409EFF;
  z-index: 1;
}
.dot-feature { background: #67C23A; box-shadow: 0 0 0 2px #67C23A; }
.dot-improvement { background: #E6A23C; box-shadow: 0 0 0 2px #E6A23C; }
.dot-bugfix { background: #F56C6C; box-shadow: 0 0 0 2px #F56C6C; }
.dot-breaking { background: #F56C6C; box-shadow: 0 0 0 2px #F56C6C; }

.changelog-line {
  position: absolute;
  left: -25px;
  top: 20px;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.changelog-card {
  background: var(--bg-glass, rgba(255,255,255,0.72));
  border: 1px solid var(--border-glass, rgba(0,0,0,0.06));
  border-radius: var(--radius-lg, 12px);
  padding: 16px 20px;
  box-shadow: var(--shadow-card);
}

.changelog-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.changelog-version {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
}

.changelog-date {
  font-size: 13px;
  color: var(--text-muted);
}

.changelog-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.changelog-card-changes {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.perm-checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.changelog-card-actions {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light, rgba(0,0,0,0.04));
}

.batch-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 8px;
}

.batch-selected-count {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  margin-right: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.novel-detail h3 {
  margin: 20px 0 10px;
}

@media (max-width: 768px) {
  .admin-sidebar { width: 100% !important; max-height: 56px; overflow: hidden; }
  .admin-sidebar .el-menu { display: flex; flex-direction: row; overflow-x: auto; }
  .admin-sidebar .el-menu-item { flex-shrink: 0; padding: 0 12px !important; font-size: 13px; margin: 0 2px !important; }
  .admin-header { flex-wrap: wrap; padding: 10px 16px; gap: 8px; height: auto; min-height: 56px; }
  .header-left h2 { font-size: var(--text-base); }
  .header-right { width: 100%; justify-content: flex-end; }
  .admin-content { padding: 16px; }
  .stat-value { font-size: 24px !important; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .card-header .el-button { width: 100%; }
  .admin-info { display: none; }
}
@media (max-width: 480px) {
  .admin-content { padding: 12px; }
  .admin-header { padding: 8px 12px; }
  .header-left h2 { font-size: 14px; }
  .stat-value { font-size: 20px !important; }
}
.reason-cell {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 13px;
  max-height: 80px;
  overflow-y: auto;
}

.test-result-box {
  background: var(--bg-glass);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  padding: 16px;
  white-space: pre-wrap;
  line-height: 1.8;
  font-family: var(--font-mono);
}
</style>
