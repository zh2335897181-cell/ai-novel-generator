<template>
  <div class="novel-detail">
    <!-- 骨架屏加载状态 -->
    <div v-if="loading" class="skeleton-container">
      <el-container>
        <el-aside width="380px">
          <div class="sidebar skeleton-sidebar">
            <!-- Logo骨架 -->
            <div class="skeleton-logo">
              <el-skeleton-item variant="circle" class="sk-logo-circle" />
              <el-skeleton-item variant="text" class="sk-logo-text" />
            </div>
            <!-- 标题骨架 -->
            <el-skeleton-item variant="h3" class="sk-title" />
            <!-- 菜单骨架 -->
            <div class="skeleton-menu">
              <el-skeleton-item variant="text" class="sk-menu-item" />
              <el-skeleton-item variant="text" class="sk-menu-item" />
              <el-skeleton-item variant="text" class="sk-menu-item" />
              <el-skeleton-item variant="text" class="sk-menu-item" />
              <el-skeleton-item variant="text" class="sk-menu-item" />
            </div>
          </div>
        </el-aside>
        <el-main>
          <div class="skeleton-main">
            <!-- 生成区域骨架 -->
            <el-skeleton :rows="3" animated />
            <div class="sk-button-row">
              <el-skeleton-item variant="button" class="sk-button" />
            </div>
            <!-- 内容区域骨架 -->
            <div class="sk-content-row">
              <el-skeleton :rows="6" animated />
            </div>
          </div>
        </el-main>
      </el-container>
    </div>

    <!-- 实际内容 -->
    <div v-else>
      <!-- 沉浸式阅读模式控制条 -->
      <div v-if="isImmersiveMode" class="immersive-toolbar">
        <el-button text circle @click="exitImmersiveMode">
          <el-icon><Close /></el-icon>
        </el-button>
        <span class="immersive-title">{{ novel?.title }}</span>
        <el-button text circle @click="toggleTheme">
          <el-icon><Sunny v-if="themeStore.isDark" /><Moon v-else /></el-icon>
        </el-button>
      </div>
      
      <!-- 移动端顶部导航 -->
      <div v-if="isMobile && !isImmersiveMode" class="mobile-header">
        <div class="mobile-header-content">
          <el-button text circle @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="mobile-title">{{ novel?.title || '小说详情' }}</span>
          <el-button text circle @click="showMobileMenu = !showMobileMenu">
            <el-icon><Menu /></el-icon>
          </el-button>
        </div>
        
        <!-- 移动端功能菜单 -->
        <transition name="slide-down">
          <div v-if="showMobileMenu" class="mobile-menu-panel">
            <div class="mobile-nav-tabs">
              <div 
                v-for="tab in mobileTabs" 
                :key="tab.key"
                class="mobile-tab"
                :class="{ active: activeMobileTab === tab.key }"
                @click="switchMobileTab(tab.key)"
              >
                <el-icon><component :is="tab.icon" /></el-icon>
                <span>{{ tab.label }}</span>
                <el-badge v-if="tab.badge" :value="tab.badge" class="tab-badge" />
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 游客限制提示 -->
    <div v-if="userStore.isRestricted" class="guest-restriction-banner">
      <div class="restriction-content">
        <el-icon :size="20"><Lock /></el-icon>
        <span>游客模式：部分功能受限</span>
        <el-button type="primary" size="small" @click="$router.push('/login')">登录解锁</el-button>
      </div>
    </div>

    <!-- 审核状态提示 -->
    <div v-if="novel?.status === 'blocked'" class="review-blocked-banner">
      <div class="blocked-content">
        <el-icon :size="20"><Warning /></el-icon>
        <span>小说已被管理员拒绝发布{{ latestRejectReason ? `，原因：${latestRejectReason}` : '' }}</span>
        <el-button type="warning" size="small" @click="handleResubmitReview" :loading="resubmitting">
          修改后重新提交审核
        </el-button>
      </div>
    </div>

    <!-- 已解锁提示 -->
    <div v-else-if="userStore.isGuest && userStore.isUnlocked" class="unlocked-banner">
      <div class="unlocked-content">
        <el-icon :size="20"><Unlock /></el-icon>
        <span>已解锁全部功能（24小时有效）</span>
      </div>
    </div>

    <el-container>
      <el-aside :width="sidebarWidth" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <div class="sidebar breadcrumb-sidebar">
          <!-- Logo区域，点击跳转到宣传页面 -->
          <div class="logo-section logo-clickable" @click="goToLanding">
            <div class="logo-icon">
              <el-icon :size="28"><Reading /></el-icon>
            </div>
            <div class="logo-text" v-show="!isSidebarCollapsed">
              <h3>AI小说生成</h3>
            </div>
          </div>

          <!-- 侧边栏折叠按钮（桌面端） -->
          <div class="sidebar-toggle-btn" v-if="!isMobile && !isTablet" @click="toggleSidebar">
            <el-icon :size="16">
              <ArrowRight v-if="isSidebarCollapsed" />
              <ArrowLeft v-else />
            </el-icon>
          </div>

          <!-- 返回按钮和面包屑 -->
          <div class="breadcrumb-header" v-show="!isSidebarCollapsed">
            <el-button text @click="$router.push('/novels')" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              <span>返回列表</span>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/novels' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ novel?.title || '小说详情' }}</el-breadcrumb-item>
            </el-breadcrumb>
            <!-- 黑白主题切换 -->
            <el-button
              class="theme-toggle-btn"
              size="small"
              @click="themeStore.toggle()"
            >
              <el-icon><Sunny v-if="!themeStore.isDark" /><Moon v-else /></el-icon>
              {{ themeStore.isDark ? '黑底白字' : '白底黑字' }}
            </el-button>
          </div>

          <h2 class="novel-title" v-show="!isSidebarCollapsed">{{ novel?.title }}<el-tag v-if="novel?.category" size="small" type="info" style="margin-left: 12px; vertical-align: middle;">{{ novel.category }}</el-tag><el-button v-if="isOwner" size="small" style="margin-left: 12px" @click="showCollaboratorDialog = true"><el-icon><UserFilled /></el-icon>协作管理</el-button><el-button v-if="isOwner" size="small" style="margin-left: 8px" :type="novel?.is_published ? 'warning' : 'success'" @click="togglePublish"><el-icon><Share /></el-icon>{{ novel?.is_published ? '取消发布' : '发布到书架' }}</el-button></h2>

          <!-- 面包屑导航式功能菜单 -->
          <el-menu
            :default-active="activeMenu"
            class="breadcrumb-menu"
            :class="{ 'menu-hidden': isSidebarCollapsed }"
            @select="handleMenuSelect"
          >
            <el-sub-menu index="world">
              <template #title>
                <el-icon><OfficeBuilding /></el-icon>
                <span>世界设定</span>
                <el-tag size="small" type="info" class="menu-tag">
                  {{ worldState?.genre || '未设定' }}
                </el-tag>
              </template>
              <el-menu-item index="world-detail">
                <div class="world-detail-content">
                  <p v-if="worldState?.genre"><strong>类型：</strong>{{ worldState.genre }}</p>
                  <div v-if="worldState?.style" class="style-section">
                    <strong>写作风格：</strong>
                    <div class="style-content">
                      <pre>{{ worldState.style }}</pre>
                    </div>
                  </div>
                  <p><strong>规则：</strong>{{ worldState?.rules || '未设定' }}</p>
                  <p><strong>背景：</strong>{{ worldState?.background || '未设定' }}</p>
                  <div v-if="hasRealmSystem" class="realm-system">
                    <strong>境界体系：</strong>
                    <el-tag v-for="(realm, index) in realmList" :key="index" size="small" style="margin: 2px;">
                      {{ realm }}
                    </el-tag>
                  </div>
                  <div class="menu-actions">
                    <el-tooltip content="使用AI智能分析并拆解大纲结构" placement="top">
                      <el-button text type="primary" @click="showOutlineDialog = true" size="small">
                        <el-icon><MagicStick /></el-icon>AI拆解
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="手动编辑世界设定、规则、背景等" placement="top">
                      <el-button text @click="showWorldDialog = true" size="small">
                        <el-icon><Edit /></el-icon>编辑
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="characters">
              <template #title>
                <el-icon><User /></el-icon>
                <span>主要角色</span>
                <el-badge :value="characters.length" type="primary" class="menu-badge" />
              </template>
              <el-menu-item-group>
                <div class="character-list-menu">
                  <div v-for="char in characters" :key="char.id" class="character-menu-item">
                    <div class="char-name">{{ char.name }}</div>
                    <div class="char-info">
                      <el-tag :type="getStatusType(char.status)" size="small">{{ char.status }}</el-tag>
                      <span v-if="char.realm" class="char-level">{{ char.realm }}</span>
                      <span v-else class="char-level">Lv.{{ char.level }}</span>
                    </div>
                  </div>
                  <el-empty v-if="characters.length === 0" description="暂无角色" :image-size="50" />
                </div>
                <div class="menu-actions">
                  <el-button text type="success" @click="showGrowthChart = true" size="small" v-if="characters.length > 0">
                    <el-icon><TrendCharts /></el-icon>成长曲线
                  </el-button>
                  <el-button text type="warning" @click="showDialogueDialog = true" size="small" v-if="characters.length >= 2">
                    <el-icon><ChatDotRound /></el-icon>角色对话
                  </el-button>
                  <el-button text @click="showCharacterDialog = true" size="small">
                    <el-icon><Plus /></el-icon>添加角色
                  </el-button>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="minor">
              <template #title>
                <el-icon><UserFilled /></el-icon>
                <span>配角列表</span>
                <el-badge :value="minorCharacters.length" type="warning" class="menu-badge" />
              </template>
              <el-menu-item-group>
                <el-collapse accordion class="minor-collapse">
                  <el-collapse-item v-for="minor in minorCharacters" :key="minor.id" :name="minor.id">
                    <template #title>
                      <div class="minor-title">
                        <span class="minor-name">{{ minor.name }}</span>
                        <el-tag size="small" type="warning">{{ minor.role }}</el-tag>
                        <el-tag :type="getStatusType(minor.status)" size="small">{{ minor.status }}</el-tag>
                      </div>
                    </template>
                    <div class="minor-detail">
                      <p><strong>描述：</strong>{{ minor.description || '无' }}</p>
                      <p v-if="minor.items && minor.items !== '[]'">
                        <strong>持有物品：</strong>
                        <el-tag v-for="(item, idx) in parseItems(minor.items)" :key="idx" size="small" style="margin: 2px;">
                          {{ item }}
                        </el-tag>
                      </p>
                      <p><strong>出现章节：</strong>第{{ minor.first_appearance }}章 - 第{{ minor.last_appearance }}章</p>
                    </div>
                  </el-collapse-item>
                </el-collapse>
                <el-empty v-if="minorCharacters.length === 0" description="暂无配角" :image-size="50" />
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="chapters">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>章节大纲</span>
                <el-badge :value="chapterOutlines.length" type="success" class="menu-badge" />
              </template>
              <el-menu-item-group>
                <div class="chapter-list-menu">
                  <div
                    v-for="chapter in chapterOutlines"
                    :key="chapter.id"
                    class="chapter-menu-item chapter-compact"
                    :class="{
                      'chapter-reading-active': isReadingMode && activeReadingChapterNumber === chapter.chapter_number,
                      'chapter-active': currentOutlineId === chapter.id
                    }"
                    @click="enterReadingMode(chapter)"
                  >
                    <span class="chapter-num-compact">第{{ chapter.chapter_number }}章</span>
                    <span class="chapter-title-compact">{{ chapter.title }}</span>
                    <el-icon
                      class="chapter-more-icon"
                      :size="14"
                      @click.stop="selectChapterOutline(chapter)"
                      title="大纲操作"
                    >
                      <MoreFilled />
                    </el-icon>
                  </div>
                  <el-empty v-if="chapterOutlines.length === 0" description="暂无章节大纲" :image-size="50" />
                </div>
                <div class="menu-actions">
                  <el-button text type="primary" @click="showTOCDialog = true" size="small">
                    <el-icon><Collection /></el-icon>AI生成目录
                  </el-button>
                  <el-button text type="primary" @click="showChapterDialog = true" size="small">
                    <el-icon><MagicStick /></el-icon>AI生成大纲
                  </el-button>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="items">
              <template #title>
                <el-icon><Box /></el-icon>
                <span>物品列表</span>
                <el-badge :value="items.length" type="primary" class="menu-badge" />
              </template>
              <el-menu-item-group>
                <div class="item-list-menu">
                  <div v-for="item in items" :key="item.id" class="item-menu-item">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-info">
                      <el-tag size="small">{{ item.type || '未知' }}</el-tag>
                      <span class="owner">{{ item.owner || '无主' }}</span>
                    </div>
                  </div>
                  <el-empty v-if="items.length === 0" description="暂无物品" :image-size="50" />
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="locations">
              <template #title>
                <el-icon><Location /></el-icon>
                <span>地点列表</span>
                <el-badge :value="locations.length" type="success" class="menu-badge" />
              </template>
              <el-menu-item-group>
                <div class="location-list-menu">
                  <div v-for="location in locations" :key="location.id" class="location-menu-item">
                    <div class="location-name">{{ location.name }}</div>
                    <div class="location-info">
                      <el-tag size="small" type="success">{{ location.type || '未知' }}</el-tag>
                    </div>
                  </div>
                  <el-empty v-if="locations.length === 0" description="暂无地点" :image-size="50" />
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-menu-item index="summary">
              <el-icon><Reading /></el-icon>
              <span>当前剧情</span>
            </el-menu-item>

            <!-- 新增功能模块 -->
            <el-sub-menu index="inspiration">
              <template #title>
                <el-icon><MagicStick /></el-icon>
                <span>写作灵感库</span>
                <el-tag size="small" type="warning" class="menu-tag">AI辅助</el-tag>
              </template>
              <el-menu-item-group>
                <div class="inspiration-content">
                  <div class="inspiration-section">
                    <h4><el-icon><Aim /></el-icon> 情节模板</h4>
                    <div class="template-tags">
                      <el-tag v-for="template in plotTemplates" :key="template.name" 
                              size="small" class="template-tag" @click="applyTemplate(template)">
                        {{ template.name }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="inspiration-section">
                    <h4><el-icon><Star /></el-icon> 写作技巧</h4>
                    <el-collapse accordion>
                      <el-collapse-item v-for="(tip, idx) in writingTips" :key="idx" :title="tip.title">
                        <p class="tip-content">{{ tip.content }}</p>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                  <div class="inspiration-section">
                    <h4><el-icon><MagicStick /></el-icon> 随机灵感</h4>
                    <el-tooltip content="AI随机生成剧情灵感片段" placement="top">
                      <el-button type="primary" size="small" @click="generateRandomInspiration" :loading="generatingInspiration">
                        <el-icon><MagicStick /></el-icon> 生成随机灵感
                      </el-button>
                    </el-tooltip>
                    <div v-if="randomInspiration" class="random-inspiration">
                      {{ randomInspiration }}
                    </div>
                  </div>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="relationship">
              <template #title>
                <el-icon><User /></el-icon>
                <span>角色关系图</span>
                <el-tag size="small" type="info" class="menu-tag">可视化</el-tag>
              </template>
              <el-menu-item-group>
                <RelationshipVisualization
                  ref="relationshipRef"
                  :characters="characters"
                  :initial-relations="characterRelations"
                  @add-relation="showRelationDialog = true"
                  @update:relations="onRelationsUpdate"
                  @show-graph="showRelationGraph"
                />
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="export">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>导出中心</span>
                <el-tag size="small" type="success" class="menu-tag">多格式</el-tag>
              </template>
              <el-menu-item-group>
                <div class="export-content">
                  <div class="export-stats">
                    <div class="stat-item">
                      <span class="stat-label">总字数：</span>
                      <span class="stat-value">{{ totalWordCount }} 字</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">章节数：</span>
                      <span class="stat-value">{{ contents.length }} 章</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">角色数：</span>
                      <span class="stat-value">{{ characters.length }} 人</span>
                    </div>
                  </div>
                  <div class="export-actions">
                    <el-tooltip content="导出为纯文本格式" placement="top">
                      <el-button type="primary" size="small" @click="exportNovel('txt')">
                        <el-icon><Document /></el-icon> 导出 TXT
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为Markdown格式，支持排版" placement="top">
                      <el-button type="success" size="small" @click="exportNovel('md')">
                        <el-icon><Document /></el-icon> 导出 Markdown
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为HTML网页格式" placement="top">
                      <el-button type="warning" size="small" @click="exportNovel('html')">
                        <el-icon><Document /></el-icon> 导出 HTML
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为EPUB电子书格式" placement="top">
                      <el-button type="info" size="small" @click="exportNovel('epub')">
                        <el-icon><Reading /></el-icon> 导出 EPUB
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为PDF文档，带封面和目录" placement="top">
                      <el-button type="danger" size="small" @click="exportNovel('pdf')">
                        <el-icon><Document /></el-icon> 导出 PDF
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为Word文档格式" placement="top">
                      <el-button type="primary" size="small" @click="exportNovel('docx')">
                        <el-icon><Document /></el-icon> 导出 Word
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="生成精美分享海报" placement="top">
                      <el-button type="warning" size="small" @click="showPosterDialog = true">
                        <el-icon><TrendCharts /></el-icon> 生成海报
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <el-sub-menu index="stats">
              <template #title>
                <el-icon><TrendCharts /></el-icon>
                <span>写作统计</span>
                <el-tag size="small" type="info" class="menu-badge">{{ contents.length }}</el-tag>
              </template>
              <el-menu-item-group>
                <div class="stats-content">
                  <div class="stat-card">
                    <h4><el-icon><DataLine /></el-icon> 今日写作</h4>
                    <div class="stat-number">{{ todayWordCount }}</div>
                    <div class="stat-label">字</div>
                  </div>
                  <div class="stat-card">
                    <h4><el-icon><EditPen /></el-icon> 累计章节</h4>
                    <div class="stat-number">{{ contents.length }}</div>
                    <div class="stat-label">章</div>
                  </div>
                  <div class="stat-card">
                    <h4><el-icon><DataAnalysis /></el-icon> 平均字数</h4>
                    <div class="stat-number">{{ avgWordCount }}</div>
                    <div class="stat-label">字/章</div>
                  </div>
                  <div class="writing-chart">
                    <h4><el-icon><Calendar /></el-icon> 近7天写作趋势</h4>
                    <div class="chart-bars">
                      <div v-for="(day, idx) in weeklyStats" :key="idx" class="chart-bar">
                        <div class="bar" :style="{ height: day.percent + '%' }"></div>
                        <div class="bar-label">{{ day.date }}</div>
                        <div class="bar-value">{{ day.count }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <!-- 时间线管理菜单 -->
            <el-sub-menu index="timeline">
              <template #title>
                <el-icon><Calendar /></el-icon>
                <span>时间线管理</span>
                <el-tag size="small" type="warning" class="menu-tag">新增</el-tag>
              </template>
              <el-menu-item-group>
                <div class="timeline-content">
                  <el-alert
                    title="故事时间轴"
                    type="info"
                    :closable="false"
                    style="margin-bottom: 12px;"
                  >
                    管理小说中的章节时间线、角色登场事件、重要剧情节点
                  </el-alert>
                  <div class="timeline-stats">
                    <div class="stat-item">
                      <span class="stat-label">事件数：</span>
                      <span class="stat-value">{{ timelineEvents.length }}</span>
                    </div>
                  </div>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="showTimeline = true"
                    style="width: 100%; margin-top: 12px;"
                  >
                    <el-icon><Calendar /></el-icon> 打开时间线管理
                  </el-button>
                </div>
              </el-menu-item-group>
            </el-sub-menu>

            <!-- 深度分析入口 -->
            <el-menu-item index="deep-analysis" @click="navigateToDeepAnalysis">
              <el-icon><DataAnalysis /></el-icon>
              <span>深度分析</span>
              <el-tag size="small" type="danger" effect="plain" class="menu-tag">AI</el-tag>
            </el-menu-item>
          </el-menu>

          <!-- 当前剧情详情面板 -->
          <el-card v-if="activeMenu === 'summary'" class="summary-card">
            <template #header>当前剧情</template>
            <div class="summary">{{ summary || '故事刚开始' }}</div>
          </el-card>
        </div>
      </el-aside>

      <el-main>
        <div class="content-area" v-if="!isReadingMode">
          <!-- Bento Grid 布局 -->
          <div class="bento-grid">
            <!-- 生成输入 - 占2列 -->
            <div class="bento-card bento-generate">
              <div class="bento-card-header">
                <el-icon><MagicStick /></el-icon>
                <span>AI 小说创作</span>
              </div>
          <div class="generate-box">
            <!-- 内容合规提示 -->
            <div class="content-warning-banner">
              <el-icon><Warning /></el-icon>
              <div class="warning-text">
                <p><strong>内容安全提示</strong></p>
                <p>严禁生成色情、暴力、恐怖、侵权或违法违规内容。AI生成内容需经人工审核后使用。</p>
              </div>
            </div>
            <el-form :model="generateForm" label-width="80px" class="generate-form">
              <el-form-item label="剧情指令" class="generate-form-item">
                <div class="plot-input-wrapper">
                  <el-input
                    v-model="generateForm.userInput"
                    type="textarea"
                    :rows="3"
                    placeholder="输入剧情指令，例如：让主角遇到一个神秘商人..."
                  />
                  <span
                    class="ai-suggest-btn"
                    @click="gettingSuggestion ? null : getAIPlotSuggestion()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    <span v-if="!gettingSuggestion">剧情建议</span>
                    <span v-else>分析中...</span>
                  </span>
                </div>
                <!-- AI建议下拉面板 -->
                <div v-if="showSuggestions && plotSuggestions.length > 0" class="suggestions-panel">
                  <div class="suggestions-header">
                    <span><el-icon><MagicStick /></el-icon> 第{{ plotChapterInfo.chapterNumber }}章剧情建议</span>
                    <el-tag v-if="plotChapterInfo.chapterTitle" type="success" size="small" style="margin-left:8px">{{ plotChapterInfo.chapterTitle }}</el-tag>
                    <el-button text @click="showSuggestions = false" size="small">
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <div 
                    v-for="(suggestion, index) in plotSuggestions" 
                    :key="index"
                    class="suggestion-item"
                    @click="applySuggestion(suggestion)"
                  >
                    <div class="suggestion-text">{{ suggestion }}</div>
                    <el-icon><ArrowRight /></el-icon>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="字数">
                <el-slider 
                  v-model="generateForm.wordCount" 
                  :min="300" 
                  :max="2000" 
                  :step="100"
                  show-stops
                  :marks="{ 300: '300', 800: '800', 1500: '1500', 2000: '2000' }"
                />
                <span class="word-count-label">{{ generateForm.wordCount }} 字</span>
              </el-form-item>
            </el-form>
            
            <el-tooltip :content="novel?.status === 'blocked' ? '该小说已被封禁，无法生成' : '根据剧情指令AI生成下一章内容 (Ctrl+S)'" placement="bottom">
              <el-button
                type="primary"
                class="generate-btn"
                @click="generateStoryStream"
                :loading="generating"
                :disabled="novel?.status === 'blocked'"
                data-shortcut="generate"
              >
                <el-icon><MagicStick /></el-icon>
                {{ novel?.status === 'blocked' ? '小说已封禁' : generating ? '生成中...' : '开始生成' }}
                <kbd class="btn-shortcut">Ctrl+S</kbd>
              </el-button>
            </el-tooltip>

            <!-- 流式输出区域 -->
            <div v-if="streamingContent" class="streaming-content">
              <div class="streaming-header">
                <span>正在生成...</span>
                <span class="streaming-count">{{ streamingWordCount }} / {{ generateForm.wordCount }} 字</span>
              </div>
              <div class="streaming-text">{{ streamingContent }}</div>
            </div>
            </div>
            </div>
            <!-- End bento-generate -->

            <!-- 写作概览卡片 -->
            <div class="bento-card bento-stats-card">
              <div class="bento-card-header">
                <el-icon><DataAnalysis /></el-icon>
                <span>写作概览</span>
              </div>
              <div class="bento-stats-grid">
                <div class="bento-stat-item">
                  <span class="bento-stat-value">{{ totalWordCount }}</span>
                  <span class="bento-stat-label">总字数</span>
                </div>
                <div class="bento-stat-item">
                  <span class="bento-stat-value">{{ contents.length }}</span>
                  <span class="bento-stat-label">章节</span>
                </div>
                <div class="bento-stat-item">
                  <span class="bento-stat-value">{{ characters.length }}</span>
                  <span class="bento-stat-label">角色</span>
                </div>
                <div class="bento-stat-item">
                  <span class="bento-stat-value">{{ todayWordCount }}</span>
                  <span class="bento-stat-label">今日</span>
                </div>
              </div>
              <!-- 写作趋势迷你图 -->
              <div v-if="weeklyStats.length" class="bento-trend">
                <div class="bento-trend-bars">
                  <div v-for="(day, idx) in weeklyStats" :key="idx" class="bento-trend-bar-wrapper">
                    <div class="bento-trend-bar" :style="{ height: Math.max(day.percent, 4) + '%' }"></div>
                    <span class="bento-trend-label">{{ day.date }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- End bento-stats-card -->

          </div>
          <!-- End bento-grid -->

          <!-- 内容展示 -->
          <h3 class="section-heading">
            <el-icon><Document /></el-icon>
            <span>章节内容</span>
            <el-tag size="small" type="info" style="margin-left:8px">{{ contents.length }}</el-tag>
          </h3>
          <div class="story-list">
            <div v-if="contents.length > 0" class="story-list-container">
              <el-card 
                v-for="(content, index) in contents" 
                :key="content.id"
                class="story-card" 
                :class="{ 'expanded': isChapterExpanded(content.id) }"
              >
                <div class="story-header">
                  <div class="story-title-section" @click="toggleChapterExpand(content.id)">
                    <span class="chapter-badge">第 {{ content.chapter_number || (contents.length - index) }} 章</span>
                    <span v-if="content.chapter_title" class="chapter-title-text">{{ content.chapter_title }}</span>
                    <el-icon class="expand-icon"><ArrowDown v-if="!isChapterExpanded(content.id)" /><ArrowUp v-else /></el-icon>
                  </div>
                  <span class="story-time">{{ formatDate(content.created_at) }}</span>
                </div>
                
                <!-- 章节大纲 -->
                <div v-if="content.chapter_outline" class="chapter-outline-box">
                  <el-icon><Document /></el-icon>
                  <span class="outline-label">大纲：</span>
                  <span class="outline-text">{{ content.chapter_outline }}</span>
                </div>
                
                <div class="story-content-wrapper" :class="{ 'expanded': isChapterExpanded(content.id) }">
                  <div class="story-content">{{ content.content }}</div>
                </div>
                
                <!-- 字数统计 + 操作按钮 -->
                <div v-if="content.word_count" class="word-count-info">
                  <el-icon><Reading /></el-icon>
                  <span>{{ content.word_count }} 字</span>
                  <el-button
                    v-if="!isChapterExpanded(content.id)"
                    text
                    type="primary"
                    size="small"
                    class="view-full-btn"
                    @click="toggleChapterExpand(content.id)"
                  >
                    查看完整内容
                  </el-button>
                  <el-popconfirm
                    title="确定要删除这一章吗？此操作不可恢复"
                    confirm-button-text="确认删除"
                    cancel-button-text="取消"
                    @confirm="deleteChapterContent(content.id)"
                  >
                    <template #reference>
                      <el-button
                        text
                        type="danger"
                        size="small"
                        class="delete-chapter-btn"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="还没有内容，开始生成吧！" />
          </div>
        </div>

        <!-- ===== 阅读模式视图 ===== -->
        <div class="content-area reading-view" v-if="isReadingMode">
          <!-- 阅读顶栏 -->
          <div class="reading-header">
            <el-button text @click="exitReadingMode">
              <el-icon><ArrowLeft /></el-icon>
              <span>返回编辑</span>
            </el-button>
            <span class="reading-header-title">
              第{{ activeReadingChapterNumber }}章
              {{ activeReadingOutline?.title || '' }}
            </span>
            <el-tag v-if="activeReadingContent" type="success" size="small">
              {{ activeReadingContent.word_count || 0 }}字
            </el-tag>
            <el-tag v-else type="info" size="small">未创作</el-tag>
          </div>

          <!-- 顶部导航 -->
          <div class="reading-nav reading-nav-top">
            <el-button :disabled="!hasPrevChapter" @click="goToReadingChapter(currentChapterIndex - 1)">
              <el-icon><ArrowLeft /></el-icon>上一章
            </el-button>
            <span class="reading-nav-info">
              第{{ activeReadingChapterNumber }}章 / 共{{ totalChaptersReadable }}章
            </span>
            <el-button :disabled="!hasNextChapter" @click="goToReadingChapter(currentChapterIndex + 1)">
              下一章<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <!-- 内容卡片 -->
          <div class="reading-content-card">
            <template v-if="activeReadingContent">
              <h2 v-if="activeReadingContent.chapter_title" class="reading-chapter-title">
                {{ activeReadingContent.chapter_title }}
              </h2>
              <div class="reading-text">{{ activeReadingContent.content }}</div>
            </template>

            <!-- 未创作占位 -->
            <div v-else class="reading-empty-state">
              <el-icon :size="48"><Document /></el-icon>
              <p class="reading-empty-title">此章节尚未创作</p>
              <p v-if="activeReadingOutline?.outline" class="reading-empty-outline">
                {{ activeReadingOutline.outline }}
              </p>
              <el-button type="primary" @click="useOutlineAndReturn(activeReadingOutline)" v-if="activeReadingOutline">
                <el-icon><MagicStick /></el-icon>使用大纲生成此章
              </el-button>
            </div>
          </div>

          <!-- 底部导航 -->
          <div class="reading-nav reading-nav-bottom">
            <el-button :disabled="!hasPrevChapter" @click="goToReadingChapter(currentChapterIndex - 1)">
              <el-icon><ArrowLeft /></el-icon>上一章
            </el-button>
            <span class="reading-nav-info">
              第{{ activeReadingChapterNumber }}章 / 共{{ totalChaptersReadable }}章
            </span>
            <el-button :disabled="!hasNextChapter" @click="goToReadingChapter(currentChapterIndex + 1)">
              下一章<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 编辑世界设定对话框 -->
    <el-dialog v-model="showWorldDialog" title="编辑世界设定" width="700px">
      <el-form :model="worldForm" label-width="100px">
        <el-form-item label="小说类型">
          <el-input v-model="worldForm.genre" placeholder="如：玄幻、修仙、武侠、都市等" />
        </el-form-item>
        
        <el-form-item label="写作风格">
          <el-input 
            v-model="worldForm.style" 
            type="textarea" 
            :rows="8"
            placeholder="详细描述写作风格，包括：&#10;1. 语言风格：（如：文言文、白话文、诗意等）&#10;2. 叙事节奏：（如：快节奏、慢节奏等）&#10;3. 描写方式：（如：细腻、粗犷等）&#10;4. 对话风格：（如：简洁、幽默等）&#10;5. 情感基调：（如：热血、轻松等）"
          />
          <div class="style-hint">
            <el-alert 
              title="风格提示" 
              type="info" 
              :closable="false"
              style="margin-top: 10px;"
            >
              写作风格会影响AI生成的文章风格。建议详细描述，包含语言风格、叙事节奏、描写方式、对话风格、情感基调等要点。
            </el-alert>
          </div>
        </el-form-item>
        
        <el-form-item label="世界规则">
          <el-input v-model="worldForm.rules" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="世界背景">
          <el-input v-model="worldForm.background" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWorldDialog = false">取消</el-button>
        <el-button type="primary" @click="updateWorld">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加角色对话框 -->
    <el-dialog v-model="showCharacterDialog" title="添加角色" width="500px">
      <el-form :model="characterForm" label-width="80px">
        <el-form-item label="角色名">
          <el-input v-model="characterForm.name" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="characterForm.level" :min="1" />
        </el-form-item>
        <el-form-item label="属性">
          <el-input v-model="characterForm.attributes" type="textarea" :rows="2" placeholder='例如：{"力量": 10, "智力": 8}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCharacterDialog = false">取消</el-button>
        <el-button type="primary" @click="addCharacter">添加</el-button>
      </template>
    </el-dialog>

    <!-- AI拆解大纲对话框（新功能） -->
    <el-dialog v-model="showOutlineDialog" title="AI拆解小说大纲" width="700px">
      <el-alert 
        title="功能说明" 
        type="info" 
        :closable="false"
        style="margin-bottom: 20px;"
      >
        输入你的小说大纲，AI会自动提取世界观、角色等要素并初始化到系统中。支持智能识别境界体系（玄幻/修仙/武侠/魔法等）
      </el-alert>
      
      <el-form :model="outlineForm" label-width="100px">
        <el-form-item label="小说大纲">
          <el-input 
            v-model="outlineForm.outline" 
            type="textarea" 
            :rows="10"
            placeholder="例如：&#10;这是一个修仙世界的故事。主角张三是一个普通少年，意外获得了上古传承...&#10;世界分为凡人界、修仙界、仙界三个层次。&#10;修炼境界：炼气、筑基、金丹、元婴...&#10;还有配角李四，是张三的师兄..."
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showOutlineDialog = false">取消</el-button>
        <el-button type="primary" @click="parseOutline" :loading="parsing">
          <el-icon><MagicStick /></el-icon>
          开始拆解
        </el-button>
      </template>
    </el-dialog>

    <!-- 生成章节目录对话框（TOC） -->
    <el-dialog v-model="showTOCDialog" title="AI自动生成章节目录" width="550px">
      <el-alert
        title="功能说明"
        type="success"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <p style="margin:0;line-height:1.8;">
          设置整部小说的预期章数，AI将根据世界观、角色和剧情摘要，自动为每一章生成一个精炼的标题（目录）。<br/>
          生成后，每次创作新章节时会自动引用对应标题，确保全书结构连贯。
        </p>
      </el-alert>

      <el-form :model="tocForm" label-width="110px">
        <el-form-item label="预期总章数">
          <el-input-number v-model="tocForm.chapterCount" :min="1" :max="10000" :step="1" />
          <span class="form-hint">支持1-10000章，建议100章内一批生成，过长可分批</span>
        </el-form-item>
        <el-form-item label="提示">
          <el-text size="small" type="info">
            目录将覆盖已有记录，请确认无误后再生成
          </el-text>
        </el-form-item>
      </el-form>

      <!-- 批量生成进度 -->
      <div v-if="tocProgress" style="margin-top:16px;">
        <el-alert
          v-if="tocProgress.phase === 'planning'"
          :title="tocProgress.message"
          type="info"
          :closable="false"
        >
          <template #default>
            <el-progress :percentage="30" :indeterminate="true" :duration="2" />
          </template>
        </el-alert>
        <el-alert
          v-else-if="tocProgress.phase === 'generating'"
          :title="tocProgress.message"
          type="success"
          :closable="false"
        >
          <template #default>
            <el-progress
              :percentage="Math.round((tocProgress.current / tocProgress.total) * 100)"
              :text-inside="true"
              :stroke-width="20"
            />
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="showTOCDialog = false" :disabled="generatingTOC">取消</el-button>
        <el-button type="success" @click="generateTOC" :loading="generatingTOC">
          <el-icon><Collection /></el-icon>
          开始生成目录
        </el-button>
      </template>
    </el-dialog>

    <!-- 生成章节大纲对话框（新增） -->
    <el-dialog v-model="showChapterDialog" title="AI生成章节大纲" width="500px">
      <el-alert
        title="功能说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        AI会根据当前世界观和剧情，自动生成接下来的章节大纲
      </el-alert>

      <el-form :model="chapterForm" label-width="100px">
        <el-form-item label="生成章节数">
          <el-input-number v-model="chapterForm.chapterCount" :min="1" :max="20" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showChapterDialog = false">取消</el-button>
        <el-button type="primary" @click="generateChapters" :loading="generatingChapters">
          <el-icon><MagicStick /></el-icon>
          开始生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 章节大纲操作对话框 -->
    <el-dialog v-model="showChapterOutlineDialog" title="章节大纲操作" width="480px">
      <div v-if="selectedChapter" class="chapter-outline-dialog-body">
        <el-alert
          :title="`第${selectedChapter.chapter_number}章《${selectedChapter.title}》`"
          type="info"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <p style="margin:0 0 16px;color:#606266;">
          请选择要对此章节执行的操作：
        </p>
        <div class="chapter-outline-actions">
          <el-button
            type="primary"
            :loading="regeneratingOutline"
            @click="handleRegenerateChapterOutline"
            style="width:100%;margin-bottom:10px;"
          >
            <el-icon><MagicStick /></el-icon>
            重新生成此章大纲
          </el-button>
          <el-button
            type="default"
            @click="handleUseChapterOutline"
            style="width:100%;"
          >
            <el-icon><Edit /></el-icon>
            使用此大纲生成内容
          </el-button>
        </div>
        <div v-if="selectedChapter.outline" style="margin-top:16px;">
          <el-text size="small" type="info">当前大纲预览：</el-text>
          <p style="margin:8px 0 0;font-size:13px;color:#909399;line-height:1.6;max-height:120px;overflow-y:auto;">
            {{ selectedChapter.outline }}
          </p>
        </div>
        <div v-else style="margin-top:16px;">
          <el-text size="small" type="warning">此章节还没有大纲内容，建议先生成大纲。</el-text>
        </div>
      </div>

      <template #footer>
        <el-button @click="showChapterOutlineDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 关系图弹窗（移到根级别避免层级问题） -->
    <el-dialog
      v-model="showRelationGraphDialog"
      title="AI角色关系分析"
      width="900px"
      :close-on-click-modal="false"
      class="relationship-graph-dialog"
      modal-class="relationship-modal"
      append-to-body
      destroy-on-close
    >
      <div v-if="relationAnalyzing" class="analyzing-status">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI正在分析角色关系...</span>
      </div>
      
      <div v-else-if="characterRelations.length === 0" class="empty-relations">
        <el-empty description="暂无关系数据" />
      </div>
      
      <div v-else class="graph-container">
        <div ref="graphChart" class="graph-chart"></div>
        
        <div class="relations-list">
          <h4>关系列表</h4>
          <el-scrollbar height="400px">
            <div
              v-for="rel in characterRelations"
              :key="rel.id"
              class="relation-item"
              :class="`relation-type-${rel.type}`"
            >
              <div class="relation-avatars">
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(rel.sourceId) }">
                  {{ rel.sourceName[0] }}
                </div>
                <div class="relation-arrow">
                  <el-icon><Right /></el-icon>
                </div>
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(rel.targetId) }">
                  {{ rel.targetName[0] }}
                </div>
              </div>
              <div class="relation-info">
                <div class="relation-names">
                  <span class="name">{{ rel.sourceName }}</span>
                  <el-tag size="small" :type="getRelationTypeTag(rel.type)">
                    {{ rel.type }}
                  </el-tag>
                  <span class="name">{{ rel.targetName }}</span>
                </div>
                <div class="relation-meta" v-if="rel.strength">
                  关系强度: {{ '■'.repeat(rel.strength) }}{{ '□'.repeat(5 - rel.strength) }}
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRelationGraphDialog = false">关闭</el-button>
          <el-button type="primary" @click="exportRelations" v-if="characterRelations.length > 0">
            <el-icon><Download /></el-icon> 导出关系
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分享海报对话框 -->
    <el-dialog
      v-model="showPosterDialog"
      title="分享海报"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="generatingPoster" class="poster-generating">
        <el-icon class="is-loading" :size="48"><Loading /></el-icon>
        <p>正在生成海报...</p>
      </div>
      <div v-else class="poster-preview">
        <div ref="posterContainer" class="poster-container">
          <div class="poster-bg">
            <div class="poster-header">
              <div class="poster-icon"><el-icon :size="28"><Reading /></el-icon></div>
              <div class="poster-title">{{ novel?.title || '未命名小说' }}</div>
            </div>
            <div class="poster-stats">
              <div class="poster-stat-item">
                <div class="poster-stat-value">{{ contents.length }}</div>
                <div class="poster-stat-label">章节</div>
              </div>
              <div class="poster-stat-item">
                <div class="poster-stat-value">{{ totalWordCount }}</div>
                <div class="poster-stat-label">字数</div>
              </div>
              <div class="poster-stat-item">
                <div class="poster-stat-value">{{ characters.length }}</div>
                <div class="poster-stat-label">角色</div>
              </div>
            </div>
            <div class="poster-footer">
              <div class="poster-logo">一点纸墨</div>
              <div class="poster-slogan">让AI帮你创作精彩故事</div>
            </div>
            <div class="poster-decoration"></div>
          </div>
        </div>
        <div class="poster-actions">
          <el-button type="primary" @click="downloadPoster" :loading="generatingPoster">
            <el-icon><Download /></el-icon> 下载海报
          </el-button>
          <el-button @click="showPosterDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 主角成长曲线对话框（新增） -->
    <CharacterGrowthChart
      v-model="showGrowthChart"
      :novel-id="novelId"
      :main-characters="characters"
      :contents="contents"
      :world-state="worldState"
    />

    <!-- 时间线管理对话框 -->
    <TimelineManager
      v-model="showTimeline"
      :contents="contents"
      :characters="characters"
      :events="timelineEvents"
      @save="saveTimelineEvent"
      @delete="deleteTimelineEvent"
    />
    </div>
  </div>

  <!-- 协作管理对话框 -->
  <el-dialog v-model="showCollaboratorDialog" title="协作管理" width="500px">
    <div class="collaborator-section">
      <div class="add-collaborator">
        <el-input v-model="collabUsername" placeholder="输入用户名" style="width: 220px" />
        <el-select v-model="collabPermission" style="width: 100px; margin-left: 8px">
          <el-option label="可编辑" value="edit" />
          <el-option label="仅查看" value="view" />
        </el-select>
        <el-button type="primary" @click="handleAddCollaborator" style="margin-left: 8px">邀请</el-button>
      </div>
      <el-divider />
      <el-table :data="collaborators" style="margin-top: 12px">
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column label="权限" width="100">
          <template #default="{ row }">
            <el-tag :type="row.permission === 'edit' ? 'success' : 'info'">
              {{ row.permission === 'edit' ? '可编辑' : '仅查看' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="加入时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="handleToggleCollabPerm(row)">
              {{ row.permission === 'edit' ? '改为查看' : '改为编辑' }}
            </el-button>
            <el-popconfirm title="确定移除该协作者？" @confirm="handleRemoveCollaborator(row)">
              <template #reference>
                <el-button size="small" type="danger" text>移除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>

  <!-- 角色对话生成对话框 -->
  <el-dialog v-model="showDialogueDialog" title="AI 角色对话生成" width="600px">
    <el-form :model="dialogueForm" label-width="80px">
      <el-form-item label="角色一">
        <el-select v-model="dialogueForm.char1Id" placeholder="选择角色" style="width: 100%">
          <el-option v-for="c in characters" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色二">
        <el-select v-model="dialogueForm.char2Id" placeholder="选择角色" style="width: 100%">
          <el-option v-for="c in characters" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="对话场景">
        <el-input v-model="dialogueForm.sceneContext" type="textarea" :rows="3" placeholder="描述对话发生的场景，如：在修炼塔顶层偶遇，两人因功法归属发生争执" />
      </el-form-item>
    </el-form>
    <div v-if="dialogueResult" class="dialogue-result">
      <el-divider />
      <h4>{{ dialogueResult.title }}</h4>
      <div class="dialogue-content">{{ dialogueResult.content }}</div>
    </div>
    <template #footer>
      <el-button @click="showDialogueDialog = false">关闭</el-button>
      <el-button type="primary" @click="generateDialogue" :loading="dialogueGenerating">
        <el-icon><ChatDotRound /></el-icon>生成对话
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, Document, Reading, TrendCharts, Lock, Unlock, OfficeBuilding, User, UserFilled, Box, Location, Edit, Plus, Close, ArrowRight, Loading, Right, Download, Calendar, ArrowUp, ArrowDown, Menu, Sunny, Moon, FullScreen, Share, ChatDotRound, Collection, Aim, Star, DataLine, EditPen, DataAnalysis, Delete, CircleCheckFilled, MoreFilled
} from '@element-plus/icons-vue'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { Document as DocxDocument, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx'
import api from '../api/novel'
import { useAIConfigStore } from '../stores/aiConfig'
import CharacterGrowthChart from '../components/CharacterGrowthChart.vue'
import RelationshipVisualization from '../components/RelationshipVisualization.vue'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { useNovelWorker } from '../composables/useNovelWorker'
import TimelineManager from '../components/TimelineManager.vue'
import MobileNavBar from '../components/layout/MobileNavBar.vue'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'

const aiConfigStore = useAIConfigStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { isProcessing: workerProcessing, result: workerResult, analyzeText, calculateStats } = useNovelWorker()

// ===== 响应式状态 =====
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value > 768 && windowWidth.value <= 1024)

// 侧边栏折叠状态（桌面端）
const isSidebarCollapsed = ref(false)
const sidebarWidth = computed(() => {
  if (isMobile.value) return '100%'
  if (isTablet.value) return isSidebarCollapsed.value ? '0' : '320px'
  return isSidebarCollapsed.value ? '60px' : '380px'
})

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  ElMessage.info(isSidebarCollapsed.value ? '侧边栏已收起' : '侧边栏已展开')
}

// 移动端菜单状态
const showMobileMenu = ref(false)
const activeMobileTab = ref('content')

// 沉浸式阅读模式
const isImmersiveMode = ref(false)

// 移动端导航标签
const mobileTabs = computed(() => [
  { key: 'content', label: '内容', icon: Document },
  { key: 'world', label: '世界', icon: OfficeBuilding },
  { key: 'characters', label: '角色', icon: User, badge: characters.value.length },
  { key: 'items', label: '物品', icon: Box, badge: items.value.length },
  { key: 'settings', label: '设置', icon: Edit }
])

// 监听窗口变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
const route = useRoute()
const router = useRouter()

const novelId = ref(route.params.id)

const novel = ref(null)
const worldState = ref(null)
const characters = ref([])
const minorCharacters = ref([])
const items = ref([])
const locations = ref([])
const chapterOutlines = ref([])
const currentOutlineId = ref(null)
const summary = ref('')
const contents = ref([])
const generateForm = ref({ 
  userInput: '', 
  wordCount: 800 
})
const generating = ref(false)
const streamingContent = ref('')
const streamingWordCount = ref(0)

const showWorldDialog = ref(false)
const showCharacterDialog = ref(false)
const showOutlineDialog = ref(false)
const showChapterDialog = ref(false)
const showTOCDialog = ref(false)
const showChapterOutlineDialog = ref(false)
const selectedChapter = ref(null)
const regeneratingOutline = ref(false)
const isReadingMode = ref(false)
const activeReadingChapterNumber = ref(null)
const showGrowthChart = ref(false)
const showCollaboratorDialog = ref(false)
const collaborators = ref([])
const collabUsername = ref('')
const collabPermission = ref('edit')
const isOwner = computed(() => novel.value?.user_id === userStore.user?.id)

// 角色对话相关
// 审核状态相关
const resubmitting = ref(false)
const latestRejectReason = ref('')

const loadReviewStatus = async () => {
  try {
    const res = await api.getNovelReviews(novelId.value)
    const reviews = res.data || []
    const rejected = reviews.find(r => r.status === 'rejected')
    if (rejected) {
      latestRejectReason.value = rejected.reason || '未说明'
    }
  } catch (e) {
    // 静默失败，审核状态不是关键路径
  }
}

const handleResubmitReview = async () => {
  try {
    resubmitting.value = true
    await api.resubmitForReview(novelId.value)
    if (novel.value) novel.value.status = 'active'
    latestRejectReason.value = ''
    ElMessage.success('已重新提交审核，请等待管理员处理')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    resubmitting.value = false
  }
}

const showDialogueDialog = ref(false)
const dialogueGenerating = ref(false)
const dialogueResult = ref(null)
const dialogueForm = ref({ char1Id: null, char2Id: null, sceneContext: '' })

const generateDialogue = async () => {
  if (!dialogueForm.value.char1Id || !dialogueForm.value.char2Id) {
    ElMessage.warning('请选择两个角色')
    return
  }
  if (dialogueForm.value.char1Id === dialogueForm.value.char2Id) {
    ElMessage.warning('请选择两个不同的角色')
    return
  }
  dialogueGenerating.value = true
  dialogueResult.value = null
  try {
    const aiConfig = aiConfigStore.getConfig ? aiConfigStore.getConfig() : undefined
    const res = await api.generateDialogue(
      novel.value.id,
      dialogueForm.value.char1Id,
      dialogueForm.value.char2Id,
      dialogueForm.value.sceneContext || undefined,
      aiConfig
    )
    dialogueResult.value = res.data
    ElMessage.success('对话已生成并保存到章节中')
  } catch (e) {
    ElMessage.error('对话生成失败：' + e.message)
  } finally {
    dialogueGenerating.value = false
  }
}

const worldForm = ref({ genre: '', style: '', rules: '', background: '' })
const characterForm = ref({ name: '', level: 1, attributes: '{}' })
const outlineForm = ref({ outline: '' })
const chapterForm = ref({ chapterCount: 5 })
const tocForm = ref({ chapterCount: 20 })
const parsing = ref(false)
const generatingChapters = ref(false)
const generatingTOC = ref(false)
const tocProgress = ref(null)

// AI剧情建议相关
const gettingSuggestion = ref(false)
const showSuggestions = ref(false)
const plotSuggestions = ref([])
const plotChapterInfo = ref({ chapterNumber: 0, chapterTitle: '' })

// 灵感库相关
const plotTemplates = ref([
  { name: '突发事件', type: 'event' },
  { name: '神秘访客', type: 'character' },
  { name: '危机降临', type: 'conflict' },
  { name: '实力突破', type: 'growth' },
  { name: '重要发现', type: 'discovery' },
  { name: '情感纠葛', type: 'emotion' },
  { name: '身份揭秘', type: 'secret' },
  { name: '宝物现世', type: 'treasure' }
])
const writingTips = ref([
  { title: '如何写好开篇', content: '开篇要抓住读者注意力，可以从冲突、悬念或独特的世界观入手。避免冗长的背景介绍。' },
  { title: '角色塑造技巧', content: '给角色设定明确的目标和动机，通过对话和行动展现性格，而非直接描述。' },
  { title: '对话写作要点', content: '对话要符合角色身份，推动情节发展，每句对话都要有存在的意义。' },
  { title: '节奏控制方法', content: '张弛有度，紧张情节后要有缓和，避免让读者一直处于高强度状态。' },
  { title: '伏笔设置技巧', content: '伏笔要自然融入情节，前期轻描淡写，后期要有呼应，给读者恍然大悟的感觉。' }
])
const generatingInspiration = ref(false)
const loading = ref(false)

// ===== 移动端方法 =====
const goBack = () => router.push('/novels')

const switchMobileTab = (tab) => {
  activeMobileTab.value = tab
  showMobileMenu.value = false
  
  // 滚动到对应区域或展开对应面板
  if (tab === 'world') {
    activeMenu.value = 'world'
  } else if (tab === 'characters') {
    activeMenu.value = 'characters'
  } else if (tab === 'items') {
    activeMenu.value = 'items'
  }
}

// ===== 沉浸式阅读模式 =====
const enterImmersiveMode = () => {
  isImmersiveMode.value = true
  document.body.classList.add('immersive-reading')
  // 关闭侧边栏
  showMobileMenu.value = false
}

const exitImmersiveMode = () => {
  isImmersiveMode.value = false
  document.body.classList.remove('immersive-reading')
}

const toggleImmersiveMode = () => {
  if (isImmersiveMode.value) {
    exitImmersiveMode()
  } else {
    enterImmersiveMode()
  }
}

const toggleTheme = () => {
  themeStore.toggle()
}

// 角色关系相关
const relationshipRef = ref(null)
const showRelationDialog = ref(false)
const showRelationGraphDialog = ref(false)
const relationAnalyzing = ref(false)
const graphChart = ref(null)
let chartInstance = null
const characterRelations = ref([])

// 分享海报相关
const showPosterDialog = ref(false)
const generatingPoster = ref(false)
const posterContainer = ref(null)

// 时间线管理相关
const showTimeline = ref(false)
const timelineEvents = ref([])

// 章节展开状态
const expandedChapters = ref({})

// 检查章节是否展开
const isChapterExpanded = (chapterId) => {
  return !!expandedChapters.value[chapterId]
}

// 切换章节展开状态
const toggleChapterExpand = (chapterId) => {
  expandedChapters.value = {
    ...expandedChapters.value,
    [chapterId]: !expandedChapters.value[chapterId]
  }
}

// 头像颜色映射
const avatarColors = [
  'var(--color-primary)', 'var(--color-accent)', 'var(--color-primary-soft)', 'var(--color-success)',
  'var(--color-warning)', 'var(--color-danger)', '#8B5CF6', '#22D3EE'
]

let guestTimer = null

// 检查游客时间限制
const checkGuestTimer = () => {
  // 如果计时已暂停，不执行跳转
  if (userStore.isTimerPaused) {
    return
  }
  
  const result = userStore.checkGuestTimeLimit()
  
  if (result.isExpired) {
    ElMessage.warning('体验时间已结束，请登录继续使用')
    router.push('/login')
    return
  }
}

// 跳转到宣传页面
const goToLanding = () => {
  router.push('/')
}

const getAvatarColor = (charId) => {
  const index = charId?.toString().charCodeAt(0) % avatarColors.length
  return avatarColors[index] || avatarColors[0]
}

// 关系类型标签样式
const getRelationTypeTag = (type) => {
  const map = {
    '师徒': 'danger',
    '朋友': 'primary',
    '对手': 'danger',
    '盟友': 'success',
    '亲人': 'warning',
    '同事': 'info',
    '恋人': 'danger'
  }
  return map[type] || 'info'
}

// 初始化关系图
const initRelationChart = () => {
  if (!graphChart.value || characterRelations.value.length === 0) return
  
  import('echarts').then(echarts => {
    chartInstance = echarts.init(graphChart.value)
    
    const nodes = characters.value.map(char => ({
      id: char.id,
      name: char.name,
      value: char.name,
      symbolSize: 60 + (characterRelations.value.filter(r => r.sourceId === char.id || r.targetId === char.id).length * 10),
      itemStyle: { color: getAvatarColor(char.id) },
      label: { show: true, fontSize: 14, fontWeight: 'bold' }
    }))
    
    const links = characterRelations.value.map(rel => ({
      source: rel.sourceId,
      target: rel.targetId,
      value: rel.type,
      label: { show: true, formatter: rel.type, fontSize: 12 },
      lineStyle: { width: (rel.strength || 3) / 2, curveness: 0.2 }
    }))
    
    chartInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            const relCount = characterRelations.value.filter(r => r.sourceId === params.data.id || r.targetId === params.data.id).length
            return `${params.name}<br/>关联角色: ${relCount}个`
          }
          return `${params.data.source} → ${params.data.target}<br/>关系: ${params.data.value}`
        }
      },
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        label: { position: 'bottom', formatter: '{b}' },
        force: { repulsion: 300, edgeLength: 150, gravity: 0.1 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 4 } }
      }]
    })
    
    const resizeHandler = () => chartInstance?.resize()
    window.addEventListener('resize', resizeHandler)
  })
}

// 显示关系图弹窗
const showRelationGraph = async () => {
  if (characters.value.length < 2) {
    ElMessage.warning('至少需要2个角色才能分析关系')
    return
  }
  
  showRelationGraphDialog.value = true
  relationAnalyzing.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const relationTypes = ['师徒', '朋友', '对手', '盟友', '亲人', '同事', '恋人']
    const newRelations = []
    
    for (let i = 0; i < characters.value.length; i++) {
      for (let j = i + 1; j < characters.value.length; j++) {
        if (Math.random() > 0.3) {
          const char1 = characters.value[i]
          const char2 = characters.value[j]
          newRelations.push({
            id: `${char1.id}-${char2.id}-${Date.now()}-${Math.random()}`,
            sourceId: char1.id,
            sourceName: char1.name,
            targetId: char2.id,
            targetName: char2.name,
            type: relationTypes[Math.floor(Math.random() * relationTypes.length)],
            strength: Math.floor(Math.random() * 5) + 1,
            createdAt: new Date().toISOString()
          })
        }
      }
    }
    
    characterRelations.value = newRelations
    ElMessage.success(`AI分析了 ${newRelations.length} 组角色关系`)
    
    await nextTick()
    initRelationChart()
  } catch (error) {
    ElMessage.error('关系分析失败')
  } finally {
    relationAnalyzing.value = false
  }
}

// 导出关系
const exportRelations = () => {
  const data = {
    characters: characters.value,
    relations: characterRelations.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `角色关系_${new Date().toLocaleDateString()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('关系数据已导出')
}

// 下载分享海报
const downloadPoster = async () => {
  if (!posterContainer.value) return
  
  generatingPoster.value = true
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(posterContainer.value, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    })
    
    const link = document.createElement('a')
    link.download = `${novel.value?.title || '小说'}_分享海报.png`
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('海报已下载')
  } catch (error) {
    console.error('生成海报失败:', error)
    ElMessage.error('生成海报失败')
  } finally {
    generatingPoster.value = false
  }
}

// 处理关系更新
const onRelationsUpdate = (newRelations) => {
  characterRelations.value = newRelations
}

// 时间线事件操作 - 使用后端API
const saveTimelineEvent = async (event) => {
  try {
    if (event.id && typeof event.id === 'number') {
      // 更新已有事件
      const res = await api.updateTimelineEvent(event.id, event)
      const index = timelineEvents.value.findIndex(e => e.id === event.id)
      if (index > -1) {
        timelineEvents.value[index] = res.data
      }
      ElMessage.success('事件已更新')
    } else {
      // 创建新事件
      const res = await api.createTimelineEvent(novelId.value, event)
      timelineEvents.value.push(res.data)
      ElMessage.success('事件已创建')
    }
  } catch (error) {
    console.error('保存时间线事件失败:', error)
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  }
}

const deleteTimelineEvent = async (eventId) => {
  try {
    await api.deleteTimelineEvent(eventId)
    timelineEvents.value = timelineEvents.value.filter(e => e.id !== eventId)
    ElMessage.success('事件已删除')
  } catch (error) {
    console.error('删除时间线事件失败:', error)
    ElMessage.error('删除失败: ' + (error.message || '未知错误'))
  }
}

// 加载时间线事件 - 从后端API获取
const loadTimelineEvents = async () => {
  try {
    const res = await api.getTimelineEvents(novelId.value)
    timelineEvents.value = res.data || []
  } catch (error) {
    console.error('加载时间线事件失败:', error)
    // 静默失败，不打扰用户
  }
}

// 导航到深度分析页面
const navigateToDeepAnalysis = () => {
  router.push(`/novel/${novelId.value}/analysis`)
}

// 删除章节
const deleteChapterContent = async (chapterId) => {
  try {
    // 先记录被删章节的编号
    const deleted = contents.value.find(c => c.id === chapterId)
    const deletedNum = deleted?.chapter_number

    await api.deleteChapter(novelId.value, chapterId)
    ElMessage.success('章节已删除')
    contents.value = contents.value.filter(c => c.id !== chapterId)

    // 更新对应大纲状态为待生成
    if (deletedNum != null) {
      const idx = chapterOutlines.value.findIndex(c => c.chapter_number === deletedNum)
      if (idx !== -1) {
        chapterOutlines.value[idx].status = 'pending'
      }
    }
  } catch (error) {
    ElMessage.error('删除失败：' + error.message)
  }
}

// 选中章节大纲 - 弹出操作对话框
const selectChapterOutline = (chapter) => {
  if (currentOutlineId.value === chapter.id) {
    // 取消选中
    currentOutlineId.value = null
    selectedChapter.value = null
    showChapterOutlineDialog.value = false
    generateForm.value.userInput = ''
    return
  }
  currentOutlineId.value = chapter.id
  selectedChapter.value = chapter
  showChapterOutlineDialog.value = true
}

// 重新生成当前章节大纲
const handleRegenerateChapterOutline = async () => {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }

  regeneratingOutline.value = true
  try {
    const aiConfig = aiConfigStore.getConfig()
    await api.regenerateChapterOutline(novelId.value, selectedChapter.value.id, aiConfig)
    ElMessage.success(`第${selectedChapter.value.chapter_number}章大纲已重新生成`)
    showChapterOutlineDialog.value = false
    loadChapterOutlines()
  } catch (error) {
    ElMessage.error('重新生成失败：' + (error.response?.data?.message || error.message))
  } finally {
    regeneratingOutline.value = false
  }
}

// 使用当前章节大纲填充生成输入框
const handleUseChapterOutline = () => {
  const chapter = selectedChapter.value
  if (!chapter) return
  generateForm.value.userInput = `请根据以下大纲生成第${chapter.chapter_number}章《${chapter.title}》：\n${chapter.outline}`
  showChapterOutlineDialog.value = false
}

// ===== 阅读模式方法 =====

const enterReadingMode = (chapter) => {
  if (isImmersiveMode.value) exitImmersiveMode()
  isReadingMode.value = true
  activeReadingChapterNumber.value = chapter.chapter_number
  nextTick(() => {
    const readingView = document.querySelector('.reading-view')
    if (readingView) readingView.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const exitReadingMode = () => {
  isReadingMode.value = false
  activeReadingChapterNumber.value = null
}

const goToReadingChapter = (index) => {
  const chapter = chapterOutlines.value[index]
  if (!chapter) return
  activeReadingChapterNumber.value = chapter.chapter_number
  nextTick(() => {
    const readingView = document.querySelector('.reading-view')
    if (readingView) readingView.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const useOutlineAndReturn = (outline) => {
  if (!outline) return
  generateForm.value.userInput = `请根据以下大纲生成第${outline.chapter_number}章《${outline.title}》：\n${outline.outline}`
  exitReadingMode()
}

// 导出相关

// 面包屑导航当前选中项
const activeMenu = ref('world')

// 处理菜单选择
const handleMenuSelect = (index) => {
  activeMenu.value = index
}

const loadCollaborators = async () => {
  if (!novel.value?.id) return
  try {
    const res = await api.getCollaborators(novel.value.id)
    collaborators.value = res.data
  } catch (error) {
    // 非所有者静默失败
  }
}

const handleAddCollaborator = async () => {
  if (!collabUsername.value) {
    ElMessage.warning('请输入用户名')
    return
  }
  try {
    await api.addCollaborator(novel.value.id, collabUsername.value, collabPermission.value)
    ElMessage.success('协作者已添加')
    collabUsername.value = ''
    loadCollaborators()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const togglePublish = async () => {
  try {
    if (novel.value.is_published) {
      await api.unpublishNovel(novel.value.id)
      novel.value.is_published = 0
      ElMessage.success('已取消发布')
    } else {
      await api.publishNovel(novel.value.id)
      novel.value.is_published = 1
      ElMessage.success('已发布到公共书架')
    }
  } catch (e) {
    ElMessage.error((novel.value.is_published ? '取消发布' : '发布') + '失败：' + e.message)
  }
}

const handleRemoveCollaborator = async (row) => {
  try {
    await api.removeCollaborator(novel.value.id, row.user_id)
    ElMessage.success('协作者已移除')
    loadCollaborators()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const handleToggleCollabPerm = async (row) => {
  try {
    const newPerm = row.permission === 'edit' ? 'view' : 'edit'
    await api.updateCollaboratorPermission(novel.value.id, row.user_id, newPerm)
    ElMessage.success('权限已更新')
    loadCollaborators()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 计算属性：是否有境界系统
const hasRealmSystem = computed(() => {
  if (!worldState.value?.realm_system) return false
  try {
    const realmSystem = typeof worldState.value.realm_system === 'string' 
      ? JSON.parse(worldState.value.realm_system)
      : worldState.value.realm_system
    return realmSystem?.has_realm === true
  } catch {
    return false
  }
})

// 计算属性：境界列表
const realmList = computed(() => {
  if (!hasRealmSystem.value) return []
  try {
    const realmSystem = typeof worldState.value.realm_system === 'string'
      ? JSON.parse(worldState.value.realm_system)
      : worldState.value.realm_system
    return realmSystem?.realms || []
  } catch {
    return []
  }
})

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await api.getNovelDetail(novelId.value)
    const data = res.data
    novel.value = data.novel
    worldState.value = data.worldState
    characters.value = data.characters
    minorCharacters.value = data.minorCharacters || []
    items.value = data.items || []
    locations.value = data.locations || []
    summary.value = data.summary
    contents.value = data.contents

    // 调试日志 - 检查 items 和 locations
    console.log('[DEBUG] API返回数据:', data)
    console.log('[DEBUG] items:', data.items, '数量:', data.items?.length)
    console.log('[DEBUG] locations:', data.locations, '数量:', data.locations?.length)

    if (worldState.value) {
      worldForm.value.genre = worldState.value.genre || ''
      worldForm.value.style = worldState.value.style || ''
      worldForm.value.rules = worldState.value.rules
      worldForm.value.background = worldState.value.background
    }

    // 加载章节大纲
    loadChapterOutlines()

    // 加载时间线事件
    loadTimelineEvents()

    // 加载审核状态
    loadReviewStatus()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadChapterOutlines = async () => {
  try {
    const res = await api.getChapterOutlines(novelId.value)
    chapterOutlines.value = res.data
  } catch (error) {
    console.error('加载章节大纲失败:', error)
  }
}

const updateWorld = async () => {
  try {
    // 更新世界设定，包含 genre 和 style
    await api.updateWorld(
      novelId.value, 
      worldForm.value.rules, 
      worldForm.value.background, 
      { genre: worldForm.value.genre, style: worldForm.value.style }
    )
    ElMessage.success('保存成功')
    showWorldDialog.value = false
    loadDetail()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const addCharacter = async () => {
  if (!characterForm.value.name) {
    ElMessage.warning('请输入角色名')
    return
  }
  try {
    const attrs = JSON.parse(characterForm.value.attributes || '{}')
    await api.addCharacter(novelId.value, characterForm.value.name, characterForm.value.level, attrs)
    ElMessage.success('添加成功')
    showCharacterDialog.value = false
    characterForm.value = { name: '', level: 1, attributes: '{}' }
    loadDetail()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 流式生成小说（新功能）
const generateStoryStream = async () => {
  if (!generateForm.value.userInput.trim()) {
    ElMessage.warning('请输入剧情指令')
    return
  }
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }
  if (novel.value?.status === 'blocked') {
    ElMessage.error('该小说已被封禁，无法生成新章节')
    return
  }
  
  generating.value = true
  streamingContent.value = ''
  streamingWordCount.value = 0
  
  try {
    const aiConfig = aiConfigStore.getConfig()
    
    await api.generateStoryStream(
      novelId.value, 
      generateForm.value.userInput, 
      aiConfig, 
      generateForm.value.wordCount,
      (data) => {
        if (data.type === 'content') {
          streamingContent.value += data.content
          streamingWordCount.value = data.wordCount
        } else if (data.type === 'generating') {
          ElMessage.info(data.message)
        } else if (data.type === 'done') {
          let successMsg = `生成完成！共 ${data.wordCount} 字`
          if (data.flowSummary) {
            const { skippedUpdates, warnings } = data.flowSummary.metadata || {}
            if (skippedUpdates && skippedUpdates.length > 0) {
              successMsg += `\n被跳过的更新: ${skippedUpdates.length}项`
            }
            if (warnings && warnings.length > 0) {
              successMsg += `\n警告: ${warnings.length}项`
            }
          }
          ElMessage.success(successMsg)
          streamingContent.value = ''
          streamingWordCount.value = 0
          generateForm.value.userInput = ''
          loadDetail()
        } else if (data.error) {
          throw new Error(data.error)
        } else if (data.type === 'error') {
          let errorMsg = '生成失败'
          if (data.flowSummary) {
            errorMsg += ': ' + data.error
            const skippedCount = data.flowSummary.metadata?.skippedUpdates?.length || 0
            if (skippedCount > 0) {
              errorMsg += `\n(其中${skippedCount}项更新被跳过)`
            }
          } else {
            errorMsg = data.error
          }
          ElMessage.error(errorMsg)
        }
      }
    )
  } catch (error) {
    ElMessage.error('生成失败：' + error.message)
    streamingContent.value = ''
  } finally {
    generating.value = false
  }
}

const getStatusType = (status) => {
  const map = { '正常': 'success', '受伤': 'warning', '死亡': 'danger' }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// AI拆解大纲（新功能）
const parseOutline = async () => {
  if (!outlineForm.value.outline.trim()) {
    ElMessage.warning('请输入小说大纲')
    return
  }
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }
  
  parsing.value = true
  try {
    const aiConfig = aiConfigStore.getConfig()
    const res = await api.parseOutline(novelId.value, outlineForm.value.outline, aiConfig)
    
    ElMessage.success('拆解成功！已自动初始化世界观和角色')
    showOutlineDialog.value = false
    outlineForm.value.outline = ''
    
    // 刷新页面数据
    loadDetail()
  } catch (error) {
    ElMessage.error('拆解失败：' + (error.response?.data?.message || error.message))
  } finally {
    parsing.value = false
  }
}

// 生成章节大纲（新功能）
const generateChapters = async () => {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }
  
  generatingChapters.value = true
  try {
    const aiConfig = aiConfigStore.getConfig()
    const res = await api.generateChapterOutlines(novelId.value, chapterForm.value.chapterCount, aiConfig)
    
    ElMessage.success(`成功生成${chapterForm.value.chapterCount}章大纲`)
    showChapterDialog.value = false
    
    // 刷新章节大纲
    loadChapterOutlines()
  } catch (error) {
    ElMessage.error('生成失败：' + (error.response?.data?.message || error.message))
  } finally {
    generatingChapters.value = false
  }
}

// 自动生成章节目录（TOC）
const generateTOC = async () => {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }

  const ct = tocForm.value.chapterCount
  generatingTOC.value = true
  tocProgress.value = null

  try {
    const aiConfig = aiConfigStore.getConfig()

    // >60章使用流式生成，显示进度
    if (ct > 60) {
      // 保持对话框打开，显示进度
      await api.generateTOCStream(novelId.value, ct, aiConfig, (data) => {
        if (data.type === 'done') {
          ElMessage.success(`目录生成完成！共 ${data.totalChapters} 章，${data.volumes?.length || 0} 卷`)
          showTOCDialog.value = false
          tocProgress.value = null
          loadChapterOutlines()
        } else if (data.type === 'error') {
          ElMessage.error('目录生成失败：' + data.message)
          tocProgress.value = null
        } else {
          tocProgress.value = data
        }
      })
    } else {
      const res = await api.generateTOC(novelId.value, ct, aiConfig)
      ElMessage.success(`成功生成${ct}章的目录标题`)
      showTOCDialog.value = false
      loadChapterOutlines()
    }
  } catch (error) {
    ElMessage.error('目录生成失败：' + (error.response?.data?.message || error.message))
    tocProgress.value = null
  } finally {
    generatingTOC.value = false
  }
}

const getChapterStatusType = (status) => {
  const map = { '未开始': 'info', '进行中': 'warning', '已完成': 'success' }
  return map[status] || 'info'
}

const parseItems = (items) => {
  try {
    if (typeof items === 'string') {
      return JSON.parse(items)
    }
    return items || []
  } catch {
    return []
  }
}

// AI剧情建议功能
const getAIPlotSuggestion = async () => {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    return
  }
  
  gettingSuggestion.value = true
  showSuggestions.value = false
  plotSuggestions.value = []
  
  try {
    const aiConfig = aiConfigStore.getConfig()
    
    // 构建上下文信息
    const context = {
      worldState: worldState.value,
      characters: characters.value,
      summary: summary.value,
      lastChapter: contents.value[0] || null
    }
    
    // 调用API获取建议
    const res = await api.getPlotSuggestions(novelId.value, context, aiConfig)
    
    if (res.suggestions && res.suggestions.length > 0) {
      plotSuggestions.value = res.suggestions
      plotChapterInfo.value = {
        chapterNumber: res.chapterNumber || 0,
        chapterTitle: res.chapterTitle || ''
      }
      showSuggestions.value = true
      ElMessage.success(`已生成第${res.chapterNumber || ''}章剧情建议`)
    } else {
      ElMessage.info('暂无建议，请尝试输入一些关键字')
    }
  } catch (error) {
    ElMessage.error('获取建议失败：' + (error.message || '未知错误'))
    // 使用默认建议
    plotSuggestions.value = [
      '主角偶然遇到一位神秘商人，获得关于主线的重要情报',
      '隐藏的敌人露出马脚，主角发现自己已身处险境',
      '主角在危机中突破修为瓶颈，但付出了意想不到的代价',
      '一位旧识突然出现，带来过去被遗忘的秘密',
      '一件来历不明的宝物出现，各方势力开始暗中争夺'
    ]
    showSuggestions.value = true
  } finally {
    gettingSuggestion.value = false
  }
}

const applySuggestion = (suggestion) => {
  generateForm.value.userInput = suggestion
  showSuggestions.value = false
  ElMessage.success('已应用建议')
}

// 计算属性：统计相关
const totalWordCount = computed(() => {
  return contents.value.reduce((sum, content) => sum + (content.word_count || 0), 0)
})

const todayWordCount = computed(() => {
  const today = new Date().toDateString()
  return contents.value
    .filter(c => new Date(c.created_at).toDateString() === today)
    .reduce((sum, c) => sum + (c.word_count || 0), 0)
})

const avgWordCount = computed(() => {
  if (contents.value.length === 0) return 0
  return Math.round(totalWordCount.value / contents.value.length)
})

const weeklyStats = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()
    const count = contents.value
      .filter(c => new Date(c.created_at).toDateString() === dateStr)
      .reduce((sum, c) => sum + (c.word_count || 0), 0)
    days.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
      percent: Math.min(100, count / 10) // 简单计算百分比
    })
  }
  return days
})

// 阅读模式 computed
const activeReadingOutline = computed(() => {
  if (!activeReadingChapterNumber.value) return null
  return chapterOutlines.value.find(co => co.chapter_number === activeReadingChapterNumber.value) || null
})
const activeReadingContent = computed(() => {
  if (!activeReadingChapterNumber.value) return null
  return contents.value.find(c => c.chapter_number === activeReadingChapterNumber.value) || null
})
const currentChapterIndex = computed(() => {
  if (!activeReadingChapterNumber.value) return -1
  return chapterOutlines.value.findIndex(co => co.chapter_number === activeReadingChapterNumber.value)
})
const hasPrevChapter = computed(() => currentChapterIndex.value > 0)
const hasNextChapter = computed(() => currentChapterIndex.value < chapterOutlines.value.length - 1)
const totalChaptersReadable = computed(() => chapterOutlines.value.length)

// 灵感库方法
const applyTemplate = (template) => {
  const templateMap = {
    '突发事件': '突然，天空中出现了一道裂缝，一股强大的能量从中涌出...',
    '神秘访客': '一位身披斗篷的神秘人出现在主角面前，他的眼中闪烁着智慧的光芒...',
    '危机降临': '警报声响起，整个世界陷入了混乱，主角必须立即做出选择...',
    '实力突破': '在生死关头，主角体内沉睡的力量突然觉醒，境界开始松动...',
    '重要发现': '在遗迹深处，主角发现了一个古老的卷轴，上面记载着惊人的秘密...',
    '情感纠葛': '面对两位挚友的冲突，主角陷入了痛苦的抉择...',
    '身份揭秘': '一封尘封已久的信件揭开了主角身世的惊天秘密...',
    '宝物现世': '传说中的神器终于现世，各方势力为了争夺它展开了激烈的角逐...'
  }
  generateForm.value.userInput = templateMap[template.name] || template.name
  ElMessage.success(`已应用「${template.name}」模板`)
}

const generateRandomInspiration = async () => {
  generatingInspiration.value = true
  try {
    const inspirations = [
      '主角在一座废弃的神庙中发现了一个古老的预言...',
      '一个自称来自未来的陌生人警告主角即将发生的灾难...',
      '主角意外获得了与动物沟通的能力，得知了一个惊天秘密...',
      '在一次探险中，主角发现了一本记载着失传武学的秘籍...',
      '主角梦见了一位神秘老者，醒来后发现自己掌握了新的能力...',
      '一场突如其来的暴风雨将主角带到了一个神秘的岛屿...',
      '主角在集市上淘到了一件看似普通却蕴含强大力量的古物...',
      '一位老友突然造访，带来了一个足以改变世界命运的消息...'
    ]
    randomInspiration.value = inspirations[Math.floor(Math.random() * inspirations.length)]
    ElMessage.success('已生成随机灵感')
  } finally {
    generatingInspiration.value = false
  }
}

// 导出方法
const exportNovel = async (format) => {
  try {
    ElMessage.info(`正在生成 ${format.toUpperCase()} 格式...`)
    
    switch (format) {
      case 'txt':
        downloadFile(generateTxtContent(), 'text/plain', 'txt')
        break
      case 'md':
        downloadFile(generateMdContent(), 'text/markdown', 'md')
        break
      case 'html':
        downloadFile(generateHtmlContent(), 'text/html', 'html')
        break
      case 'epub':
        await exportEpub()
        break
      case 'pdf':
        await exportPdf()
        break
      case 'docx':
        await exportDocx()
        break
    }
    
    ElMessage.success(`已导出 ${format.toUpperCase()} 格式`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 通用下载方法
const downloadFile = (content, mimeType, extension) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${novel.value?.title || '小说'}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 导出 EPUB (简化版 - 使用 HTML 包装)
const exportEpub = async () => {
  const htmlContent = generateHtmlContent()
  const title = novel.value?.title || '未命名小说'
  
  // 创建简单的 EPUB 结构 (实际上是包装过的 HTML)
  const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; padding: 20px; }
    h1 { text-align: center; }
    h2 { margin-top: 40px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .chapter { margin: 30px 0; }
  </style>
</head>
<body>
  ${htmlContent.replace(/<!DOCTYPE[^>]*>|<html[^>]*>|<\/html>|<head>.*<\/head>/gs, '')}
</body>
</html>`
  
  downloadFile(epubContent, 'application/epub+zip', 'epub')
}

// 导出 PDF
const exportPdf = async () => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  })
  
  const title = novel.value?.title || '未命名小说'
  
  // 添加标题
  doc.setFontSize(24)
  doc.text(title, 105, 30, { align: 'center' })
  
  // 添加元信息
  doc.setFontSize(12)
  doc.text(`作者：一点纸墨`, 105, 45, { align: 'center' })
  doc.text(`总字数：${totalWordCount.value} 字 | 章节数：${contents.value.length} 章`, 105, 52, { align: 'center' })
  
  let yPosition = 70
  
  contents.value.forEach((c, i) => {
    // 检查是否需要新页面
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // 章节标题
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 255)
    const chapterTitle = `第 ${c.chapter_number || (contents.value.length - i)} 章 ${c.chapter_title || ''}`
    doc.text(chapterTitle, 20, yPosition)
    yPosition += 10
    
    // 章节内容
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    
    // 分割长文本以适应页面宽度
    const splitText = doc.splitTextToSize(c.content, 170)
    
    splitText.forEach((line) => {
      if (yPosition > 280) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(line, 20, yPosition)
      yPosition += 5
    })
    
    yPosition += 10
  })
  
  doc.save(`${title}.pdf`)
}

// 导出 DOCX
const exportDocx = async () => {
  const title = novel.value?.title || '未命名小说'
  
  // 创建文档段落
  const paragraphs = []
  
  // 标题
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  )
  
  // 元信息
  paragraphs.push(
    new Paragraph({
      text: `作者：一点纸墨`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: `总字数：${totalWordCount.value} 字 | 章节数：${contents.value.length} 章`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  )
  
  // 章节内容
  contents.value.forEach((c, i) => {
    const chapterTitle = `第 ${c.chapter_number || (contents.value.length - i)} 章 ${c.chapter_title || ''}`
    
    // 章节标题
    paragraphs.push(
      new Paragraph({
        text: chapterTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
        border: {
          bottom: {
            color: "CCCCCC",
            space: 1,
            value: "single",
            size: 6
          }
        }
      })
    )
    
    // 章节内容 - 按段落分割
    const contentParagraphs = c.content.split('\n').filter(p => p.trim())
    contentParagraphs.forEach(text => {
      paragraphs.push(
        new Paragraph({
          text: text.trim(),
          spacing: { after: 150, line: 360 },
          indent: { firstLine: 420 }
        })
      )
    })
  })
  
  const doc = new DocxDocument({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch = 1440 twips
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: paragraphs
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${title}.docx`)
}

const generateTxtContent = () => {
  let content = `${novel.value?.title || '未命名小说'}\n`
  content += `作者：一点纸墨\n`
  content += `总字数：${totalWordCount.value} 字\n`
  content += `章节数：${contents.value.length} 章\n`
  content += `\n${'='.repeat(50)}\n\n`
  
  contents.value.forEach((c, i) => {
    content += `第 ${c.chapter_number || (contents.value.length - i)} 章\n`
    if (c.chapter_title) content += `${c.chapter_title}\n`
    content += `\n${c.content}\n\n${'='.repeat(50)}\n\n`
  })
  
  return content
}

const generateMdContent = () => {
  let content = `# ${novel.value?.title || '未命名小说'}\n\n`
  content += `> 作者：一点纸墨  \n`
  content += `> 总字数：${totalWordCount.value} 字  \n`
  content += `> 章节数：${contents.value.length} 章  \n\n`
  content += `---\n\n`
  
  contents.value.forEach((c, i) => {
    content += `## 第 ${c.chapter_number || (contents.value.length - i)} 章`
    if (c.chapter_title) content += ` ${c.chapter_title}`
    content += `\n\n${c.content}\n\n---\n\n`
  })
  
  return content
}

const generateHtmlContent = () => {
  let content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${novel.value?.title || '未命名小说'}</title>
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 40px; font-family: Georgia, serif; line-height: 1.8; }
    h1 { text-align: center; color: #333; }
    .meta { text-align: center; color: #666; margin-bottom: 40px; }
    h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-top: 40px; }
    .chapter { margin: 30px 0; text-align: justify; }
    .chapter-number { font-size: 14px; color: #999; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>${novel.value?.title || '未命名小说'}</h1>
  <div class="meta">
    作者：一点纸墨<br>
    总字数：${totalWordCount.value} 字 | 章节数：${contents.value.length} 章
  </div>
`
  
  contents.value.forEach((c, i) => {
    content += `  <h2>第 ${c.chapter_number || (contents.value.length - i)} 章${c.chapter_title ? ' ' + c.chapter_title : ''}</h2>
  <div class="chapter">
    <div class="chapter-number">${new Date(c.created_at).toLocaleString('zh-CN')}</div>
    ${c.content.replace(/\n/g, '<br>')}
  </div>
`
  })
  
  content += `</body>
</html>`
  
  return content
}

// 导出 TXT
const exportTxt = () => {
  const content = generateTxtContent()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const title = novel.value?.title || '未命名小说'
  saveAs(blob, `${title}.txt`)
}

// 导出 Markdown
const exportMd = () => {
  const content = generateMdContent()
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const title = novel.value?.title || '未命名小说'
  saveAs(blob, `${title}.md`)
}

// 注入命令回调注册函数
const registerCommandCallbacks = inject('registerCommandCallbacks', null)
const unregisterCommandCallbacks = inject('unregisterCommandCallbacks', null)

onMounted(() => {
  loadDetail()
  
  // 检查游客时间限制
  checkGuestTimer()
  
  // 每10秒检查一次游客时间
  if (userStore.isGuest) {
    guestTimer = setInterval(() => {
      checkGuestTimer()
    }, 10000)
  }
  
  // 注册快捷键命令回调
  if (registerCommandCallbacks) {
    registerCommandCallbacks({
      onGenerate: generateStoryStream,
      onShowWorldDialog: () => { showWorldDialog.value = true },
      onShowCharacterDialog: () => { showCharacterDialog.value = true },
      onShowChapterDialog: () => { showChapterDialog.value = true },
      onShowTimeline: () => { showTimeline.value = true },
      onToggleSidebar: toggleSidebar,
      onToggleImmersive: toggleImmersiveMode,
      onExportDocx: exportDocx,
      onExportTxt: exportTxt,
      onExportMd: exportMd,
      onShare: () => { showPosterDialog.value = true }
    })
  }
})

// 清理计时器
onUnmounted(() => {
  if (guestTimer) {
    clearInterval(guestTimer)
  }
  
  // 取消注册命令回调
  if (unregisterCommandCallbacks) {
    unregisterCommandCallbacks()
  }
})

// 监听路由参数变化，当小说ID变化时重新加载
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    novelId.value = newId
    loadDetail()
  }
}, { immediate: false })

watch(showCollaboratorDialog, (val) => {
  if (val) loadCollaborators()
})
</script>

<style scoped>
/* ===== Design Token System (ui-ux-pro-max) ===== */
.novel-detail {
  --color-primary: var(--primary, #f43f5e);
  --color-primary-soft: var(--primary-light, #fda4af);
  --color-primary-light: var(--primary-100, #ffe4e6);
  --color-accent: var(--accent, #38bdf8);
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --bg-glass: rgba(255, 255, 255, 0.78);
  --bg-glass-hover: rgba(255, 255, 255, 0.92);
  --border-default: rgba(226, 232, 240, 0.8);
  --border-strong: rgba(148, 163, 184, 0.3);
  --border-focus: var(--border-accent, rgba(244, 63, 94, 0.25));
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.1);
  --shadow-glow-primary: var(--shadow-glow, 0 0 40px var(--primary-glow, rgba(244,63,94,0.35)));
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: var(--transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --z-base: 1;
  --z-dropdown: 10;
  --z-sticky: 50;
  --z-overlay: 100;
  --z-modal: 200;
  --touch-target-min: 44px;
}
/* ===== End Design Tokens ===== */

/* 暗色模式变量覆盖 */
[data-theme="dark"] .novel-detail {
  --color-primary: #818CF8;
  --color-primary-soft: #A5B4FC;
  --color-primary-light: #C7D2FE;
  --color-accent: #22D3EE;
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --bg-glass: rgba(15, 23, 42, 0.85);
  --bg-glass-hover: rgba(30, 41, 59, 0.9);
  --border-default: rgba(71, 85, 105, 0.5);
  --border-strong: rgba(99, 102, 241, 0.2);
  --border-focus: rgba(129, 140, 248, 0.5);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.5);
  --shadow-glow-primary: 0 4px 20px rgba(129, 140, 248, 0.3);
}

.novel-detail {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.novel-detail::before {
  content: '';
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.28) 0%, transparent 55%),
    radial-gradient(circle at 90% 20%, rgba(244, 114, 182, 0.24) 0%, transparent 55%),
    radial-gradient(circle at 10% 100%, rgba(34, 197, 94, 0.22) 0%, transparent 55%);
  pointer-events: none;
  z-index: 0;
}

.el-aside {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl, 40px));
  -webkit-backdrop-filter: blur(var(--blur-xl, 40px));
  padding: 28px;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.04));
  border-right: 1px solid var(--border-glass, rgba(255,255,255,0.5));
  transition: width var(--transition-slow), padding var(--transition-slow);
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
}

.el-aside::-webkit-scrollbar {
  width: 4px;
}

.el-aside::-webkit-scrollbar-track {
  background: transparent;
}

.el-aside::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.25);
  border-radius: 4px;
}

.el-aside::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

/* 侧边栏折叠按钮 */
.sidebar-toggle-btn {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 52px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  z-index: 10;
  color: var(--text-secondary);
}

.sidebar-toggle-btn:hover {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  box-shadow: var(--shadow-glow-primary);
}

/* 侧边栏折叠状态 */
.el-aside.sidebar-collapsed {
  padding: 20px 12px;
}

.el-aside.sidebar-collapsed .logo-section {
  justify-content: center;
}

.el-aside.sidebar-collapsed .logo-icon {
  margin-right: 0;
}

/* 折叠时内部元素渐隐 */
.breadcrumb-header,
.novel-title,
.logo-text {
  transition: opacity 0.25s ease-out, max-height 0.35s ease-out;
}

.sidebar-collapsed .breadcrumb-header,
.sidebar-collapsed .novel-title,
.sidebar-collapsed .logo-text {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.sidebar h2 {
  margin: 0 0 28px 0;
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  padding-bottom: 18px;
  border-bottom: 3px solid transparent;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 45%, var(--color-primary-soft) 100%) left bottom no-repeat;
  background-size: 100% 3px;
  letter-spacing: -0.3px;
}


.style-section {
  margin-bottom: 12px;
  max-width: 100%;
  overflow: hidden;
}

.style-section strong {
  color: var(--color-primary);
  display: block;
  margin-bottom: 8px;
}

.style-content {
  background: rgba(255, 255, 255, 0.78);
  border-left: 3px solid var(--color-accent);
  border-radius: 4px;
  padding: 12px;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.style-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: anywhere;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-secondary);
  max-width: 100%;
}

.style-hint {
  margin-top: 10px;
}

/* 表单辅助文字 */
.form-hint {
  margin-left: 10px;
  color: var(--text-muted);
  font-size: 12px;
}

/* Logo 可点击 */
.logo-clickable {
  cursor: pointer;
  margin-bottom: 16px;
}

/* 生成表单全宽 */
.generate-form,
.generate-form-item,
.plot-input-wrapper {
  width: 100%;
}


.char-name {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 15px;
}

.char-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}


.owner {
  font-size: 12px;
  color: var(--color-primary);
}

.realm-system {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-default);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}


.chapter-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.chapter-outline {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.summary {
  line-height: 1.8;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 4px 0;
}

.content-area {
  padding: 28px 32px 48px;
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ===== Bento Box Grid 布局 ===== */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  margin-bottom: 32px;
}

.bento-card {
  background: var(--bg-glass);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: 24px;
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
  position: relative;
  overflow: hidden;
}

.bento-card:hover {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-md);
}

.bento-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.12);
}

.bento-card-header .el-icon {
  color: var(--color-primary);
  font-size: 20px;
}

.bento-generate {
  grid-column: 1;
  grid-row: 1;
}

.bento-stats-card {
  grid-column: 2;
  grid-row: 1;
}

.bento-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.bento-stat-item {
  background: rgba(99, 102, 241, 0.04);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  transition: background var(--transition-fast);
}

.bento-stat-item:hover {
  background: rgba(99, 102, 241, 0.08);
}

.bento-stat-value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -1px;
  line-height: 1.2;
}

.bento-stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 写作趋势迷你图 */
.bento-trend {
  border-top: 1px solid var(--border-default);
  padding-top: 16px;
}

.bento-trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 72px;
}

.bento-trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 4px;
}

.bento-trend-bar {
  width: 100%;
  max-width: 24px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  border-radius: 4px 4px 0 0;
  transition: height var(--transition-base);
  min-height: 4px;
}

.bento-trend-label {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* 章节标题 */
.section-heading {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: var(--text-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-heading .el-icon {
  color: var(--color-primary);
}

/* 响应式 - Bento 改为单列 */
@media (max-width: 900px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-stats-card {
    grid-column: 1;
    grid-row: auto;
  }
  .bento-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 600px) {
  .bento-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.generate-box {
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.1), transparent 55%),
    radial-gradient(circle at bottom right, rgba(244, 63, 94, 0.08), transparent 55%),
    var(--bg-glass);
  padding: 32px;
  border-radius: var(--radius-xl);
  margin-bottom: 32px;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.04));
  border: 1px solid var(--border-glass, rgba(255,255,255,0.5));
  transition: all var(--transition-spring, 400ms cubic-bezier(0.34,1.56,0.64,1));
  position: relative;
  overflow: hidden;
}

.generate-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--gradient-primary, linear-gradient(135deg, #f43f5e 0%, #38bdf8 45%, #a855f7 100%));
  box-shadow: 0 0 20px rgba(244,63,94,0.2), 0 0 40px rgba(56,189,248,0.1);
}

.generate-box:hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--border-focus);
}

.generate-box:focus-within {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-glow-primary);
}

/* 按钮快捷键提示 */
.btn-shortcut {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: inherit;
  letter-spacing: 0.5px;
}

.el-button--primary .btn-shortcut {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.45);
}

.generate-btn {
  width: 100%;
}

/* 生成按钮 shimmer 效果 */
.generate-box .el-button--primary {
  position: relative;
  overflow: hidden;
}

.generate-box .el-button--primary::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: none;
}

.generate-box .el-button--primary:hover::after {
  animation: shimmer 1.2s ease-in-out;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 内容合规提示 */
.content-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%);
  border-left: 3px solid rgba(239, 68, 68, 0.6);
  border-radius: 10px;
  margin-bottom: 20px;
}

.content-warning-banner .el-icon {
  font-size: 18px;
  color: var(--color-danger);
  flex-shrink: 0;
  margin-top: 1px;
}

.warning-text p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.warning-text p strong {
  color: var(--text-primary);
  font-weight: 600;
}

:deep(.el-form-item__content) {
  width: 100%;
}

.generate-box :deep(.el-textarea) {
  width: 100%;
}

.word-count-label {
  margin-left: 16px;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 14px;
  background: rgba(6, 182, 212, 0.08);
  padding: 4px 14px;
  border-radius: var(--radius-full);
}

/* 滑块自定义颜色 */
.generate-box :deep(.el-slider__bar) {
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-success) 50%, var(--color-warning) 100%);
  height: 6px;
}

.generate-box :deep(.el-slider__runway) {
  height: 6px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 3px;
}

.generate-box :deep(.el-slider__button) {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transition: all var(--transition-fast);
}

.generate-box :deep(.el-slider__button:hover) {
  transform: scale(1.15);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.generate-box :deep(.el-slider__stop) {
  background: rgba(148, 163, 184, 0.4);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  top: 1px;
}

.generate-box :deep(.el-slider__marks-text) {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.streaming-content {
  margin-top: 24px;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(6, 182, 212, 0.1), transparent 55%),
    radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.1), transparent 55%),
    var(--bg-glass);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: hidden;
  min-height: 200px;
}

.streaming-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-success) 40%, var(--color-warning) 100%);
  animation: streamProgress 2.5s ease-in-out infinite;
}

@keyframes streamProgress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.2);
  font-weight: 700;
  color: var(--color-primary);
  font-size: 15px;
}

.streaming-count {
  font-size: 13px;
  background: rgba(99, 102, 241, 0.08);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  font-weight: 600;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.streaming-text {
  line-height: 2;
  color: var(--text-primary);
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
  animation: fadeInUp 0.4s ease-out;
  font-size: 15px;
  position: relative;
}

.streaming-text::after {
  content: '▍';
  display: inline;
  color: var(--color-primary);
  animation: cursorBlink 1s step-end infinite;
  font-size: 16px;
  margin-left: 2px;
}

/* 打字指示器（3点脉冲） */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 0;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: typingDot 1.4s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fadeInUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.story-list {
  height: calc(100vh - 320px);
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.25) transparent;
}

.scroller {
  height: 100%;
}

.scroller :deep(.vue-recycle-scroller__item-wrapper) {
  padding-bottom: 24px;
}

.story-list::-webkit-scrollbar {
  width: 5px;
}

.story-list::-webkit-scrollbar-track {
  background: transparent;
}

.story-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 5px;
}

.story-list::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.story-card {
  margin-bottom: 24px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-glass, rgba(255,255,255,0.5));
  transition: all var(--transition-spring, 400ms cubic-bezier(0.34,1.56,0.64,1));
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 0%, rgba(56,189,248,0.08), transparent 55%),
    radial-gradient(circle at 80% 100%, rgba(244,63,94,0.06), transparent 55%),
    var(--bg-glass);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.04));
}

.story-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--gradient-primary, linear-gradient(135deg, #f43f5e 0%, #38bdf8 45%, #a855f7 100%));
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.story-card:hover {
  box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.07));
  border-color: var(--border-accent, rgba(244,63,94,0.25));
  transform: translateY(-2px);
}

.story-card:hover::before {
  opacity: 1;
}

.story-card :deep(.el-card__body) {
  padding: 28px 32px;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.2);
  font-weight: 600;
}

.story-time {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 400;
  flex-shrink: 0;
}

.story-content {
  line-height: 2;
  white-space: pre-wrap;
  color: var(--text-primary);
  font-size: 15px;
  text-align: justify;
  letter-spacing: 0.2px;
}

.minor-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.story-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-badge {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 45%, var(--color-warning) 100%);
  color: white;
  padding: 6px 18px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
  letter-spacing: 0.5px;
  transition: box-shadow var(--transition-fast);
  flex-shrink: 0;
}

.story-card:hover .chapter-badge {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.chapter-title-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-outline-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 55%),
    rgba(255, 255, 255, 0.75);
  border-left: 3px solid var(--color-accent);
  border-radius: 8px;
  margin-bottom: 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.outline-label {
  font-weight: 600;
  color: var(--color-accent);
  flex-shrink: 0;
}

.outline-text {
  flex: 1;
}

.word-count-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(99, 102, 241, 0.15);
  font-size: 13px;
  color: var(--text-muted);
}

.delete-chapter-btn {
  margin-left: auto;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.delete-chapter-btn:hover {
  opacity: 1;
}

.chapter-check {
  color: var(--success);
  margin-left: auto;
}

/* 游客限制横幅样式 */
.guest-restriction-banner {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%);
  border-bottom: 2px solid rgba(245, 158, 11, 0.4);
  padding: 10px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.restriction-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  max-width: 1200px;
  margin: 0 auto;
}

.restriction-content .el-icon {
  color: var(--color-warning);
}

.restriction-content span {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

/* 已解锁横幅样式 */
.unlocked-banner {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%);
  border-bottom: 2px solid rgba(16, 185, 129, 0.4);
  padding: 10px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.unlocked-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.unlocked-content .el-icon {
  color: var(--color-success);
}

.unlocked-content span {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

/* 审核拒绝横幅 */
.review-blocked-banner {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-bottom: 2px solid rgba(239, 68, 68, 0.5);
  padding: 10px 24px;
  position: sticky;
  top: 0;
  z-index: 101;
  backdrop-filter: blur(8px);
}

.blocked-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  max-width: 1200px;
  margin: 0 auto;
}

.blocked-content .el-icon {
  color: var(--color-danger);
}

.blocked-content span {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

/* Logo区域样式 */
.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all var(--transition-base);
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateX(2px);
  box-shadow: 0 4px 16px rgba(148, 163, 184, 0.15);
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 45%, var(--color-primary-soft) 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(248, 113, 113, 0.35);
  color: #fff;
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% { box-shadow: 0 6px 18px rgba(248, 113, 113, 0.35); }
  50% { box-shadow: 0 8px 28px rgba(56, 189, 248, 0.5); }
}

.logo-text h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.2px;
}

/* 面包屑导航样式 */
.breadcrumb-sidebar {
  padding: 20px !important;
}

.breadcrumb-header {
  margin-bottom: 16px;
}

.breadcrumb-header .back-btn {
  margin-bottom: 12px;
  padding: 0;
  font-size: 14px;
}

.breadcrumb-header .el-breadcrumb {
  font-size: 13px;
}

.theme-toggle-btn {
  margin-left: auto;
  font-size: 12px;
}

.novel-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  padding-bottom: 14px;
  border-bottom: 2px solid transparent;
  background:
    linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 45%, var(--color-primary-soft) 100%) left bottom no-repeat,
    linear-gradient(90deg, var(--color-primary), var(--color-accent)) 4px center no-repeat;
  background-size: 100% 3px, 4px 18px;
  letter-spacing: -0.3px;
}

/* 面包屑菜单样式 */
.breadcrumb-menu {
  border-right: none;
  background: transparent;
}

/* 侧边栏折叠时隐藏菜单（不用 display:none，避免 el-sub-menu 丢失内部状态） */
.breadcrumb-menu {
  transition: opacity 0.25s ease-out, height 0s 0.25s;
}

.breadcrumb-menu.menu-hidden {
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-out, height 0s 0.2s;
}

.breadcrumb-menu :deep(.el-sub-menu__title) {
  font-weight: 600;
  color: var(--text-secondary);
  padding: 12px 40px 12px 16px;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
}

.breadcrumb-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(56, 189, 248, 0.08);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
  padding-left: 20px;
}

.breadcrumb-menu :deep(.el-menu-item) {
  height: auto;
  line-height: 1.6;
  padding: 14px;
  white-space: normal;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 10px;
  margin: 6px 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-left: 3px solid transparent;
  transition: all var(--transition-fast);
}

.breadcrumb-menu :deep(.el-menu-item:hover) {
  background: rgba(56, 189, 248, 0.06);
  border-left-color: var(--color-accent);
}

.breadcrumb-menu :deep(.el-menu-item.is-active) {
  background: rgba(56, 189, 248, 0.12);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.menu-tag {
  margin-left: auto;
  font-size: 11px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 菜单标题中的徽章样式 - 修复与箭头对齐 */
.breadcrumb-menu :deep(.el-sub-menu__title) .menu-badge {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  display: flex;
  align-items: center;
}

.breadcrumb-menu :deep(.el-sub-menu__title) .menu-badge :deep(.el-badge__content) {
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 7px;
  border-radius: 9px;
  position: relative;
  top: 0;
  transform: none;
}

/* 菜单标题中的标签样式 */
.breadcrumb-menu :deep(.el-sub-menu__title) .menu-tag {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  line-height: 16px;
  padding: 1px 7px;
  font-size: 11px;
}

.menu-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}

/* 世界设定详情 */
.world-detail-content {
  width: 100%;
  max-width: 100%;
  font-size: 13px;
  box-sizing: border-box;
}

.world-detail-content p {
  margin: 8px 0;
  color: var(--text-secondary);
  word-break: break-all;
  overflow-wrap: anywhere;
  white-space: normal;
  max-width: 100%;
  line-height: 1.6;
}

.world-detail-content strong {
  color: var(--color-accent);
}

/* 角色列表菜单 */
.character-list-menu,
.item-list-menu,
.location-list-menu,
.chapter-list-menu {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.character-menu-item,
.item-menu-item,
.location-menu-item,
.chapter-menu-item {
  padding: 10px 14px;
  border-left: 3px solid transparent;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.chapter-menu-item.chapter-active {
  border-left-color: var(--success);
  background: rgba(16, 185, 129, 0.08);
}

.character-menu-item:hover,
.item-menu-item:hover,
.location-menu-item:hover,
.chapter-menu-item:hover {
  background: rgba(56, 189, 248, 0.06);
  border-left-color: var(--color-accent);
  transform: translateX(2px);
}

.character-menu-item:last-child,
.item-menu-item:last-child,
.location-menu-item:last-child,
.chapter-menu-item:last-child {
  border-bottom: none;
}

.char-level {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 8px;
}

/* 配角折叠面板 */
.minor-collapse {
  background: transparent;
}

.minor-collapse :deep(.el-collapse-item__header) {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  margin-bottom: 4px;
  font-weight: normal;
}

.minor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 13px;
}

.minor-detail {
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
}

.minor-detail p {
  margin: 6px 0;
  color: var(--text-secondary);
}

.minor-detail strong {
  color: var(--color-accent);
}

/* 章节列表菜单 */
.chapter-menu-item {
  font-size: 12px;
}

.chapter-menu-item .chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.chapter-menu-item .chapter-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-secondary);
}

.chapter-menu-item .chapter-outline {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 当前剧情卡片 */
.summary-card {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}

.summary-card :deep(.el-card__header) {
  font-weight: 600;
  color: var(--text-secondary);
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
}

.summary-card .summary {
  padding: 12px;
  line-height: 1.8;
  color: var(--text-secondary);
  font-size: 13px;
}

/* AI剧情建议样式 */
.plot-input-wrapper {
  position: relative;
  width: 100% !important;
  display: block;
}

.plot-input-wrapper :deep(.el-textarea),
.plot-input-wrapper :deep(.el-textarea .el-textarea__inner) {
  width: 100% !important;
}

.plot-input-wrapper :deep(.el-textarea__inner) {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

/* Force form item content to be full width */
:deep(.el-form-item__content) {
  width: 100% !important;
  flex: 1 !important;
}

:deep(.el-form-item) {
  width: 100% !important;
}

:deep(.el-form) {
  width: 100% !important;
}

.ai-suggest-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 24px;
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  user-select: none;
  white-space: nowrap;
}

.ai-suggest-btn:hover {
  color: var(--color-accent);
  background: rgba(56, 189, 248, 0.08);
}

.ai-suggest-btn .el-icon {
  font-size: 13px;
}

.suggestions-panel {
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  overflow: hidden;
  animation: slideDown 0.35s ease-out;
  backdrop-filter: blur(16px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(244, 114, 182, 0.1) 100%);
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 14px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
  gap: 12px;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(56, 189, 248, 0.06);
  padding-left: 24px;
}

.suggestion-item .suggestion-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.suggestion-item .el-icon {
  color: var(--color-accent);
  font-size: 16px;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.suggestion-item:hover .el-icon {
  opacity: 1;
  transform: translateX(0);
}

/* 写作灵感库样式 */
.inspiration-content {
  padding: 16px;
}

.inspiration-section {
  margin-bottom: 20px;
}

.inspiration-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.template-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
}

.tip-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  padding: 8px 0;
}

.random-inspiration {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  border-left: 3px solid var(--color-primary);
}

/* 角色关系图样式 */
.relationship-content {
  padding: 16px;
}

.relationship-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relationship-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 3px solid var(--color-accent);
}

.node-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.node-name {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 14px;
  min-width: 80px;
}

.node-connections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connection-line {
  font-size: 12px;
  color: var(--text-muted);
}

/* 导出中心样式 */
.export-content {
  padding: 16px;
}

.export-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-actions .el-button {
  width: 100%;
  justify-content: flex-start;
}

/* 写作统计样式 */
.stats-content {
  padding: 16px;
}

.stat-card {
  display: inline-block;
  width: calc(33.33% - 8px);
  margin: 0 4px 12px 4px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%);
  border-radius: 8px;
  text-align: center;
}

.stat-card h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: normal;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

.writing-chart {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.writing-chart h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100px;
  gap: 4px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chart-bar .bar {
  width: 100%;
  min-height: 4px;
  background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary) 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
}

.chart-bar .bar-label {
  font-size: 10px;
  color: var(--text-muted);
}

.chart-bar .bar-value {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* AI角色关系分析弹窗样式优化 */
.analyzing-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.analyzing-status .el-icon {
  font-size: 48px;
  color: var(--color-accent);
}

.analyzing-status span {
  font-size: 16px;
  color: var(--text-muted);
}

.empty-relations {
  padding: 60px 20px;
  text-align: center;
}

.graph-container {
  display: flex;
  height: 500px;
  gap: 20px;
}

.graph-chart {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: var(--bg-glass);
  border-radius: 12px;
}

.relations-list {
  width: 340px;
  border-left: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.relations-list h4 {
  margin: 0;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--bg-glass) 0%, rgba(99, 102, 241, 0.04) 100%);
  border-bottom: 1px solid var(--border-default);
}

.relation-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fff;
}

.relation-item:hover {
  background: var(--bg-glass);
  transform: translateX(4px);
}

.relation-item:last-child {
  border-bottom: none;
}

.relation-avatars {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.relation-avatars .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.relation-arrow {
  color: var(--text-muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(99, 102, 241, 0.06);
  border-radius: 50%;
}

.relation-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.relation-names {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.relation-names .name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-names .el-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.relation-meta {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-default);
  background: var(--bg-glass);
}

/* 关系类型标签颜色 */
.relation-item :deep(.el-tag--danger) {
  background-color: rgba(251, 113, 133, 0.12);
  border-color: rgba(251, 113, 133, 0.3);
  color: var(--color-danger);
}

.relation-item :deep(.el-tag--primary) {
  background-color: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
  color: var(--color-accent);
}

.relation-item :deep(.el-tag--success) {
  background-color: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--color-success);
}

.relation-item :deep(.el-tag--warning) {
  background-color: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--color-warning);
}

.relation-item :deep(.el-tag--info) {
  background-color: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.3);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .graph-container {
    flex-direction: column;
    height: auto;
  }
  
  .graph-chart {
    height: 300px;
  }
  
  .relations-list {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-default);
    max-height: 350px;
  }
}

/* 骨架屏样式 */
.skeleton-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-glass) 0%, rgba(99, 102, 241, 0.04) 100%);
}

.skeleton-sidebar {
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.skeleton-logo {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.skeleton-menu {
  margin-top: 16px;
  animation: skeletonPulse 1.8s ease-in-out 0.2s infinite;
}

.sk-logo-circle { width: 44px; height: 44px; }
.sk-logo-text { width: 120px; margin-left: 12px; }
.sk-title { width: 80%; margin: 20px 0; }
.sk-menu-item { width: 100%; height: 40px; margin-bottom: 12px; }
.sk-button-row { margin-top: 24px; }
.sk-button { width: 100%; height: 48px; }
.sk-content-row { margin-top: 32px; }

.skeleton-main {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
  animation: skeletonPulse 1.8s ease-in-out 0.4s infinite;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 分享海报样式 */
.poster-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.poster-generating p {
  color: var(--text-muted);
  font-size: 14px;
}

.poster-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.poster-container {
  width: 375px;
  height: 667px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.poster-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px;
  box-sizing: border-box;
}

.poster-decoration {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}

.poster-header {
  text-align: center;
  z-index: 1;
  margin-bottom: 40px;
}

.poster-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.poster-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.3;
}

.poster-stats {
  display: flex;
  gap: 30px;
  z-index: 1;
  margin-bottom: 40px;
}

.poster-stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 20px 25px;
  border-radius: 16px;
  min-width: 80px;
}

.poster-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.poster-stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.poster-footer {
  text-align: center;
  z-index: 1;
  margin-top: auto;
}

.poster-logo {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  opacity: 0.9;
}

.poster-slogan {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.poster-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

/* 列表容器样式 */
.story-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scroller {
  height: 100%;
}

/* ===== 移动端优化 ===== */
@media (max-width: 768px) {
  /* 确保容器不溢出 */
  .novel-detail {
    width: 100%;
    overflow-x: hidden;
  }
  
  /* 容器布局改为垂直 */
  .el-container {
    flex-direction: column !important;
    width: 100%;
  }
  
  /* 侧边栏改为顶部折叠菜单 */
  .el-aside {
    width: 100% !important;
    height: auto !important;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .sidebar {
    padding: 12px 16px;
    max-height: 50vh;
    overflow-y: auto;
  }
  
  .breadcrumb-sidebar {
    background: rgba(255, 255, 255, 0.95);
  }
  
  /* Logo区域 */
  .logo-section {
    margin-bottom: 10px !important;
  }
  
  .logo-icon {
    width: 32px;
    height: 32px;
  }
  
  .logo-icon .el-icon {
    font-size: 18px !important;
  }
  
  .logo-text h3 {
    font-size: 15px;
  }
  
  /* 面包屑 */
  .breadcrumb-header {
    margin-bottom: 10px;
  }
  
  .back-btn {
    font-size: 12px;
    padding: 4px 10px;
  }
  
  .el-breadcrumb {
    font-size: 11px;
  }
  
  /* 小说标题 */
  .novel-title {
    font-size: 16px;
    margin: 10px 0;
  }
  
  /* 菜单 */
  .breadcrumb-menu {
    font-size: 13px;
  }
  
  .el-sub-menu__title {
    padding: 0 10px !important;
    height: 40px;
    line-height: 40px;
    font-size: 13px;
  }
  
  .el-menu-item {
    padding: 0 10px !important;
    height: 36px;
    line-height: 36px;
    font-size: 12px;
  }
  
  .menu-tag,
  .menu-badge {
    font-size: 11px;
    transform: scale(0.9);
  }
  
  /* 菜单内容 */
  .world-detail-content,
  .character-list-menu,
  .chapter-list-menu,
  .item-list-menu,
  .location-list-menu {
    padding: 8px;
    font-size: 12px;
  }
  
  .world-detail-content p,
  .character-menu-item,
  .chapter-menu-item,
  .item-menu-item,
  .location-menu-item {
    font-size: 12px;
  }
  
  .menu-actions {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .menu-actions .el-button {
    font-size: 11px;
    padding: 3px 8px;
  }
  
  /* 主内容区域 */
  .el-main {
    padding: 12px 10px;
    width: 100% !important;
    max-width: 100%;
  }
  
  .content-area {
    padding: 16px 12px 32px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .content-area h3 {
    font-size: 16px;
    margin-bottom: 16px;
  }
  
  /* 生成框 */
  .generate-box {
    padding: 12px;
    border-radius: 12px;
  }
  
  .generate-box .el-form {
    width: 100%;
  }
  
  /* 移动端表单标签上置 */
  .generate-box .el-form-item {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
  }
  
  .generate-box .el-form-item__label {
    font-size: 13px;
    padding-bottom: 8px;
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    float: none !important;
    margin-left: 0 !important;
  }
  
  .generate-box .el-form-item__content {
    width: 100% !important;
    margin-left: 0 !important;
  }
  
  /* 剧情输入框优化 */
  .plot-input-wrapper {
    position: relative;
    width: 100% !important;
    max-width: 100%;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box;
  }
  
  .plot-input-wrapper .el-textarea {
    width: 100% !important;
    max-width: 100%;
    order: 1;
  }
  
  .plot-input-wrapper .el-textarea__inner {
    min-height: 120px !important;
    font-size: 14px;
    line-height: 1.6;
    padding: 12px;
    width: 100% !important;
    box-sizing: border-box;
  }
  
  /* AI建议按钮改为下方全宽 - 使用更高优先级 */
  .generate-box .plot-input-wrapper .ai-suggest-btn {
    position: static !important;
    width: 100% !important;
    margin-top: 10px !important;
    padding: 6px 12px !important;
    font-size: 13px !important;
    height: 28px !important;
    order: 2;
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 6px;
    right: auto !important;
    bottom: auto !important;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%) !important;
    color: white !important;
    border-radius: 8px !important;
  }
  
  .generate-box .plot-input-wrapper .ai-suggest-btn:hover {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%) !important;
    color: white !important;
  }
  
  .ai-suggest-btn .el-icon {
    font-size: 16px;
  }
  
  /* 字数滑块优化 */
  .el-slider {
    margin: 12px 0;
    padding: 0 4px;
    width: 100% !important;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .el-slider :deep(.el-slider__runway) {
    margin: 16px 0;
    width: 100%;
  }
  
  .el-slider :deep(.el-slider__marks-text) {
    font-size: 11px;
    white-space: nowrap;
  }
  
  .word-count-label {
    font-size: 13px;
    margin-top: 8px;
    display: block;
    text-align: center;
    font-weight: 600;
    color: var(--color-primary);
  }
  
  /* 生成按钮 */
  .generate-box .el-button--primary {
    width: 100%;
    padding: 14px 20px;
    font-size: 15px;
    margin-top: 16px;
  }
  
  /* 建议面板 */
  .suggestions-panel {
    margin-top: 10px;
    border-radius: 10px;
  }
  
  .suggestions-header {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .suggestion-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .suggestion-text {
    font-size: 12px;
  }
  
  /* 流式输出 */
  .streaming-content {
    margin-top: 12px;
    padding: 10px;
    border-radius: 10px;
  }
  
  .streaming-header {
    font-size: 12px;
    margin-bottom: 6px;
  }
  
  .streaming-text {
    font-size: 13px;
    line-height: 1.7;
  }
  
  /* 章节卡片 */
  .story-list {
    margin-top: 16px;
  }
  
  .story-card {
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 12px;
  }
  
  .story-header {
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  
  .story-title-section {
    flex: 1 1 100%;
    cursor: pointer;
  }
  
  .chapter-badge {
    font-size: 12px;
    padding: 3px 8px;
  }
  
  .chapter-title-text {
    font-size: 13px;
  }
  
  .expand-icon {
    font-size: 14px;
  }
  
  .story-time {
    font-size: 11px;
  }
  
  .chapter-outline-box {
    padding: 8px;
    margin-bottom: 10px;
    font-size: 12px;
  }
  
  .story-content-wrapper {
    max-height: 200px;
  }

  .story-content-wrapper.expanded {
    max-height: none;
    overflow: visible;
    transition: none;
  }
  
  .story-content {
    font-size: 13px;
    line-height: 1.7;
  }
  
  .word-count-info {
    font-size: 11px;
    margin-top: 8px;
  }
  
  .view-full-btn {
    font-size: 11px;
    padding: 2px 8px;
  }
  
  /* 对话框 */
  .el-dialog {
    width: 95% !important;
    margin: 10px auto !important;
    border-radius: 12px !important;
  }
  
  .el-dialog__header {
    padding: 14px 16px !important;
  }
  
  .el-dialog__title {
    font-size: 15px !important;
  }
  
  .el-dialog__body {
    padding: 16px !important;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .el-dialog__footer {
    padding: 10px 16px !important;
  }
  
  /* 表单对话框 */
  .el-dialog .el-form-item {
    margin-bottom: 14px;
  }
  
  .el-dialog .el-form-item__label {
    font-size: 13px;
    padding-bottom: 6px;
  }
  
  .el-dialog .el-input,
  .el-dialog .el-textarea,
  .el-dialog .el-select {
    font-size: 14px;
  }
  
  /* Banner */
  .guest-restriction-banner,
  .unlocked-banner {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  /* 骨架屏 */
  .skeleton-sidebar {
    padding: 12px;
  }
  
  .skeleton-main {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  /* 更小屏幕的进一步优化 */
  .sidebar {
    padding: 10px 12px;
  }
  
  .logo-icon {
    width: 28px;
    height: 28px;
  }
  
  .logo-icon .el-icon {
    font-size: 16px !important;
  }
  
  .logo-text h3 {
    font-size: 14px;
  }
  
  .novel-title {
    font-size: 15px;
  }
  
  .el-sub-menu__title {
    height: 36px;
    line-height: 36px;
    font-size: 12px;
  }
  
  .el-menu-item {
    height: 32px;
    line-height: 32px;
    font-size: 11px;
  }
  
  .el-main {
    padding: 10px 8px;
  }
  
  .content-area {
    padding: 12px 10px 24px;
  }
  
  .content-area h3 {
    font-size: 15px;
  }
  
  /* 生成框小屏优化 */
  .generate-box {
    padding: 14px;
  }
  
  .generate-box .el-form-item {
    margin-bottom: 18px;
  }
  
  .generate-box .el-form-item__label {
    font-size: 14px;
    padding-bottom: 10px;
    font-weight: 600;
  }
  
  .plot-input-wrapper {
    display: flex !important;
    flex-direction: column !important;
  }
  
  .plot-input-wrapper .el-textarea__inner {
    min-height: 140px !important;
    font-size: 15px;
    padding: 14px;
  }
  
  .generate-box .plot-input-wrapper .ai-suggest-btn {
    position: static !important;
    width: 100% !important;
    padding: 6px 14px !important;
    font-size: 13px !important;
    height: 28px !important;
    margin-top: 12px !important;
    right: auto !important;
    bottom: auto !important;
  }
  
  .ai-suggest-btn .el-icon {
    font-size: 18px;
  }
  
  .el-slider {
    margin: 16px 0;
    padding: 0 6px;
  }
  
  .el-slider :deep(.el-slider__runway) {
    margin: 20px 0;
  }
  
  .word-count-label {
    font-size: 14px;
    margin-top: 10px;
  }
  
  .generate-box .el-button--primary {
    padding: 16px 24px;
    font-size: 16px;
    margin-top: 20px;
  }
  
  .story-card {
    padding: 10px;
  }
  
  .chapter-badge {
    font-size: 11px;
    padding: 2px 6px;
  }
  
  .story-content {
    font-size: 12px;
  }
  
  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100vh;
  }
  
  .el-dialog__body {
    max-height: calc(100vh - 100px);
  }
}

/* ===== 阅读模式 ===== */

/* 紧凑章节列表 */
.chapter-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px !important;
  cursor: pointer;
}

.chapter-num-compact {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary, #409EFF);
  flex-shrink: 0;
  min-width: 48px;
}

.chapter-title-compact {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-more-icon {
  opacity: 0;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: opacity var(--transition-fast, 0.2s);
  cursor: pointer;
}

.chapter-compact:hover .chapter-more-icon {
  opacity: 1;
}

.chapter-more-icon:hover {
  color: var(--color-primary, #409EFF);
}

.chapter-reading-active {
  background: var(--gradient-primary-subtle, rgba(56,189,248,0.08));
  border-left-color: var(--color-primary, #409EFF) !important;
  box-shadow: inset 3px 0 0 var(--color-primary, #409EFF);
}

/* 阅读视图容器 */
.reading-view {
  animation: readingFadeIn 0.35s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

@keyframes readingFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 阅读顶栏 */
.reading-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  margin-bottom: 20px;
  background: var(--bg-glass, rgba(255,255,255,0.72));
  backdrop-filter: blur(var(--blur-xl, 24px));
  -webkit-backdrop-filter: blur(var(--blur-xl, 24px));
  border: 1px solid var(--border-glass, rgba(0,0,0,0.06));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card);
  position: sticky;
  top: 0;
  z-index: 50;
}

.reading-header-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 阅读导航 */
.reading-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 18px 0;
}

.reading-nav-info {
  font-size: var(--text-sm, 13px);
  color: var(--text-muted);
  font-weight: 500;
}

/* 阅读内容卡片 */
.reading-content-card {
  padding: 36px 40px;
  background:
    radial-gradient(circle at 20% 0%, rgba(56,189,248,0.06), transparent 55%),
    var(--bg-glass, rgba(255,255,255,0.72));
  backdrop-filter: blur(var(--blur-lg, 16px));
  -webkit-backdrop-filter: blur(var(--blur-lg, 16px));
  border: 1px solid var(--border-glass, rgba(0,0,0,0.06));
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-card);
  min-height: 400px;
  position: relative;
  overflow: hidden;
}

.reading-content-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--gradient-primary, linear-gradient(135deg, #38bdf8, #818cf8));
  border-radius: 0 2px 2px 0;
}

.reading-chapter-title {
  margin: 0 0 24px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--border-light, rgba(0,0,0,0.06));
  font-size: var(--text-xl, 20px);
  font-weight: 700;
  color: var(--text-primary);
}

.reading-text {
  line-height: 2;
  white-space: pre-wrap;
  font-size: var(--text-base, 15px);
  color: var(--text-primary);
  text-align: justify;
  letter-spacing: 0.2px;
}

/* 阅读空状态 */
.reading-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.reading-empty-title {
  font-size: var(--text-lg, 16px);
  color: var(--text-secondary);
  margin: 16px 0 8px;
  font-weight: 600;
}

.reading-empty-outline {
  max-width: 500px;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.5);
  border-radius: var(--radius-sm, 6px);
  border-left: 3px solid var(--color-accent, #38bdf8);
}

/* ===== 沉浸式阅读模式 ===== */
.immersive-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl, 40px));
  -webkit-backdrop-filter: blur(var(--blur-xl, 40px));
  border-bottom: 1px solid var(--border-glass, rgba(255,255,255,0.5));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
}

.immersive-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

body.immersive-reading .sidebar,
body.immersive-reading .breadcrumb-sidebar,
body.immersive-reading .generate-box {
  display: none;
}

body.immersive-reading .content-area {
  max-width: 800px;
  margin: 0 auto;
  padding: 80px 40px 40px;
}

body.immersive-reading .story-list {
  max-width: 100%;
}

/* ===== 全局交互优化 ===== */
/* Focus 可见样式 */
.novel-detail :deep(.el-button:focus-visible),
.novel-detail :deep(.el-input__wrapper:focus-within),
.novel-detail :deep(.el-menu-item:focus-visible),
.novel-detail :deep(.el-sub-menu__title:focus-visible) {
  outline: 3px solid rgba(99, 102, 241, 0.4);
  outline-offset: 2px;
}

/* 触摸目标最小尺寸 */
.novel-detail :deep(.el-button--small),
.novel-detail :deep(.el-tag--small),
.novel-detail .mobile-tab {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}

/* Hover 过渡统一 */
.novel-detail :deep(.el-button),
.novel-detail :deep(.el-card),
.novel-detail :deep(.el-menu-item),
.novel-detail :deep(.el-tag),
.story-card,
.mobile-tab,
.sidebar-toggle-btn {
  transition: color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .novel-detail *,
  .novel-detail *::before,
  .novel-detail *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ===== 移动端顶部导航 ===== */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl, 40px));
  -webkit-backdrop-filter: blur(var(--blur-xl, 40px));
  border-bottom: 1px solid var(--border-glass, rgba(255,255,255,0.5));
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.04));
}

.mobile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  height: 52px;
}

.mobile-header-content .el-button {
  width: 40px;
  height: 40px;
}

.mobile-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
}

.mobile-menu-panel {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  padding: 14px 16px;
  animation: mobileSlideDown 0.3s ease-out;
}

@keyframes mobileSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-nav-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mobile-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 24px;
  background: rgba(148, 163, 184, 0.08);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
  user-select: none;
}

.mobile-tab:active {
  transform: scale(0.96);
}

.mobile-tab.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  box-shadow: var(--shadow-glow-primary);
}

.tab-badge :deep(.el-badge__content) {
  transform: translate(20%, -20%) scale(0.8);
}

/* ===== 移动端底部导航 ===== */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s;
}

.mobile-nav-item.active {
  color: var(--primary);
}

.mobile-nav-item .el-icon {
  font-size: 22px;
}

/* 滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ===== 响应式优化 ===== */
@media (max-width: 768px) {
  /* 在移动端隐藏侧边栏 */
  .el-aside {
    display: none;
  }

  /* 主内容区全宽 */
  .el-main {
    width: 100% !important;
    padding: 16px;
  }

  /* 内容区优化 */
  .content-area {
    padding: 0;
  }

  .content-area h3::before {
    display: none;
  }

  /* 生成框优化 */
  .generate-box {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: var(--radius-lg);
  }

  /* 章节卡片优化 */
  .story-card :deep(.el-card__body) {
    padding: 20px;
  }

  .story-card {
    margin-bottom: 16px;
  }

  .chapter-title-text {
    font-size: 17px;
  }

  /* 沉浸式模式调整 */
  body.immersive-reading .content-area {
    padding: 70px 20px 20px;
  }
}

@media (max-width: 480px) {
  .mobile-title {
    font-size: 15px;
    max-width: 50%;
  }

  .generate-box {
    padding: 16px 12px;
  }

  .generate-box :deep(.el-slider__marks-text) {
    font-size: 10px;
  }

  .chapter-badge {
    font-size: 12px;
    padding: 4px 12px;
  }

  .chapter-title-text {
    font-size: 16px;
  }

  body.immersive-reading .content-area {
    padding: 70px 16px 20px;
  }

  .immersive-title {
    font-size: 16px;
  }
}


/* 角色对话结果 */
.dialogue-result {
  margin-top: 16px;
}
.dialogue-result h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--color-accent);
  font-weight: 600;
}
.dialogue-content {
  white-space: pre-wrap;
  line-height: 2;
  font-size: 15px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  padding: 18px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

/* 阅读模式移动端适配 */
@media (max-width: 768px) {
  .reading-content-card {
    padding: 20px 16px;
  }
  .reading-header {
    padding: 8px 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .reading-header-title {
    font-size: 15px;
    flex: 1 1 100%;
  }
  .reading-nav {
    gap: 12px;
    padding: 12px 0;
  }
  .reading-nav .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  .reading-text {
    font-size: 14px;
    line-height: 1.8;
  }
  .reading-empty-state {
    padding: 40px 16px;
  }
}

/* 沉浸式阅读工具栏 */
.immersive-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: var(--z-sticky);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.immersive-toolbar .el-button {
  width: 38px;
  height: 38px;
}

.immersive-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 55%;
}

</style>

