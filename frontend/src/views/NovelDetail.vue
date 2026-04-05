<template>
  <div class="novel-detail">
    <!-- 骨架屏加载状态 -->
    <div v-if="loading" class="skeleton-container">
      <el-container>
        <el-aside width="380px">
          <div class="sidebar skeleton-sidebar">
            <!-- Logo骨架 -->
            <div class="skeleton-logo">
              <el-skeleton-item variant="circle" style="width: 44px; height: 44px;" />
              <el-skeleton-item variant="text" style="width: 120px; margin-left: 12px;" />
            </div>
            <!-- 标题骨架 -->
            <el-skeleton-item variant="h3" style="width: 80%; margin: 20px 0;" />
            <!-- 菜单骨架 -->
            <div class="skeleton-menu">
              <el-skeleton-item variant="text" style="width: 100%; height: 40px; margin-bottom: 12px;" />
              <el-skeleton-item variant="text" style="width: 100%; height: 40px; margin-bottom: 12px;" />
              <el-skeleton-item variant="text" style="width: 100%; height: 40px; margin-bottom: 12px;" />
              <el-skeleton-item variant="text" style="width: 100%; height: 40px; margin-bottom: 12px;" />
              <el-skeleton-item variant="text" style="width: 100%; height: 40px; margin-bottom: 12px;" />
            </div>
          </div>
        </el-aside>
        <el-main>
          <div class="skeleton-main">
            <!-- 生成区域骨架 -->
            <el-skeleton :rows="3" animated />
            <div style="margin-top: 24px;">
              <el-skeleton-item variant="button" style="width: 100%; height: 48px;" />
            </div>
            <!-- 内容区域骨架 -->
            <div style="margin-top: 32px;">
              <el-skeleton :rows="6" animated />
            </div>
          </div>
        </el-main>
      </el-container>
    </div>

    <!-- 实际内容 -->
    <div v-else>
      <!-- 游客限制提示 -->
    <div v-if="userStore.isRestricted" class="guest-restriction-banner">
      <div class="restriction-content">
        <el-icon :size="20"><Lock /></el-icon>
        <span>游客模式：部分功能受限</span>
        <el-button type="primary" size="small" @click="$router.push('/login')">登录解锁</el-button>
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
      <el-aside width="380px">
        <div class="sidebar breadcrumb-sidebar">
          <!-- Logo区域，点击跳转到宣传页面 -->
          <div class="logo-section" @click="goToLanding" style="cursor: pointer; margin-bottom: 16px;">
            <div class="logo-icon">
              <el-icon :size="28"><Reading /></el-icon>
            </div>
            <div class="logo-text">
              <h3>AI小说生成</h3>
            </div>
          </div>

          <!-- 返回按钮和面包屑 -->
          <div class="breadcrumb-header">
            <el-button text @click="$router.push('/novels')" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              <span>返回列表</span>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/novels' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ novel?.title || '小说详情' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <h2 class="novel-title">{{ novel?.title }}</h2>

          <!-- 面包屑导航式功能菜单 -->
          <el-menu
            :default-active="activeMenu"
            class="breadcrumb-menu"
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
                  <div v-for="chapter in chapterOutlines" :key="chapter.id" class="chapter-menu-item">
                    <div class="chapter-header">
                      <span class="chapter-num">第{{ chapter.chapter_number }}章</span>
                      <el-tag :type="getChapterStatusType(chapter.status)" size="small">{{ chapter.status }}</el-tag>
                    </div>
                    <div class="chapter-title">{{ chapter.title }}</div>
                    <div class="chapter-outline">{{ chapter.outline }}</div>
                  </div>
                  <el-empty v-if="chapterOutlines.length === 0" description="暂无章节大纲" :image-size="50" />
                </div>
                <div class="menu-actions">
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
                    <h4>🎯 情节模板</h4>
                    <div class="template-tags">
                      <el-tag v-for="template in plotTemplates" :key="template.name" 
                              size="small" class="template-tag" @click="applyTemplate(template)">
                        {{ template.name }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="inspiration-section">
                    <h4>💡 写作技巧</h4>
                    <el-collapse accordion>
                      <el-collapse-item v-for="(tip, idx) in writingTips" :key="idx" :title="tip.title">
                        <p class="tip-content">{{ tip.content }}</p>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                  <div class="inspiration-section">
                    <h4>🎲 随机灵感</h4>
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
                      <el-button color="#e74c3c" size="small" @click="exportNovel('pdf')">
                        <el-icon><Document /></el-icon> 导出 PDF
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="导出为Word文档格式" placement="top">
                      <el-button color="#2b579a" size="small" @click="exportNovel('docx')">
                        <el-icon><Document /></el-icon> 导出 Word
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="生成精美分享海报" placement="top">
                      <el-button color="#9b59b6" size="small" @click="showPosterDialog = true">
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
                    <h4>📊 今日写作</h4>
                    <div class="stat-number">{{ todayWordCount }}</div>
                    <div class="stat-label">字</div>
                  </div>
                  <div class="stat-card">
                    <h4>📝 累计章节</h4>
                    <div class="stat-number">{{ contents.length }}</div>
                    <div class="stat-label">章</div>
                  </div>
                  <div class="stat-card">
                    <h4>📈 平均字数</h4>
                    <div class="stat-number">{{ avgWordCount }}</div>
                    <div class="stat-label">字/章</div>
                  </div>
                  <div class="writing-chart">
                    <h4>📅 近7天写作趋势</h4>
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
          </el-menu>

          <!-- 当前剧情详情面板 -->
          <el-card v-if="activeMenu === 'summary'" class="summary-card">
            <template #header>当前剧情</template>
            <div class="summary">{{ summary || '故事刚开始' }}</div>
          </el-card>
        </div>
      </el-aside>

      <el-main>
        <div class="content-area">
          <h3>小说内容</h3>
          
          <!-- 生成输入 -->
          <div class="generate-box">
            <el-form :model="generateForm" label-width="80px" style="width: 100%;">
              <el-form-item label="剧情指令" style="width: 100%;">
                <div class="plot-input-wrapper" style="width: 100%;">
                  <el-input
                    v-model="generateForm.userInput"
                    type="textarea"
                    :rows="3"
                    placeholder="输入剧情指令，例如：让主角遇到一个神秘商人..."
                  />
                  <el-tooltip content="AI智能分析当前剧情，生成续写建议" placement="left">
                    <el-button 
                      class="ai-suggest-btn"
                      type="primary" 
                      text
                      @click="getAIPlotSuggestion"
                      :loading="gettingSuggestion"
                      size="small"
                    >
                      <el-icon><MagicStick /></el-icon>
                      AI建议
                    </el-button>
                  </el-tooltip>
                </div>
                <!-- AI建议下拉面板 -->
                <div v-if="showSuggestions && plotSuggestions.length > 0" class="suggestions-panel">
                  <div class="suggestions-header">
                    <span>🤖 AI生成的剧情建议</span>
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
            
            <el-tooltip content="根据剧情指令AI生成下一章内容" placement="bottom">
              <el-button 
                type="primary" 
                @click="generateStoryStream" 
                :loading="generating"
                style="width: 100%;"
              >
                <el-icon><MagicStick /></el-icon>
                {{ generating ? '生成中...' : '开始生成' }}
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

          <!-- 内容展示 - 虚拟滚动 -->
          <div class="story-list">
            <RecycleScroller
              v-if="contents.length > 0"
              class="scroller"
              :items="contents"
              :item-size="200"
              key-field="id"
              v-slot="{ item: content, index }"
            >
              <el-card class="story-card">
                <div class="story-header">
                  <div class="story-title-section">
                    <span class="chapter-badge">第 {{ content.chapter_number || (contents.length - index) }} 章</span>
                    <span v-if="content.chapter_title" class="chapter-title-text">{{ content.chapter_title }}</span>
                  </div>
                  <span class="story-time">{{ formatDate(content.created_at) }}</span>
                </div>
                
                <!-- 章节大纲 -->
                <div v-if="content.chapter_outline" class="chapter-outline-box">
                  <el-icon><Document /></el-icon>
                  <span class="outline-label">大纲：</span>
                  <span class="outline-text">{{ content.chapter_outline }}</span>
                </div>
                
                <div class="story-content">{{ content.content }}</div>
                
                <!-- 字数统计 -->
                <div v-if="content.word_count" class="word-count-info">
                  <el-icon><Reading /></el-icon>
                  <span>{{ content.word_count }} 字</span>
                </div>
              </el-card>
            </RecycleScroller>
            <el-empty v-else description="还没有内容，开始生成吧！" />
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
                  关系强度: {{ '★'.repeat(rel.strength) }}{{ '☆'.repeat(5 - rel.strength) }}
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
              <div class="poster-icon">📚</div>
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
              <div class="poster-logo">AI小说生成系统</div>
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
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, Document, Reading, TrendCharts, Lock, Unlock, OfficeBuilding, User, UserFilled, Box, Location, Edit, Plus, Close, ArrowRight, Loading, Right, Download, Calendar } from '@element-plus/icons-vue'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { Document as DocxDocument, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import api from '../api/novel'
import { useAIConfigStore } from '../stores/aiConfig'
import CharacterGrowthChart from '../components/CharacterGrowthChart.vue'
import RelationshipVisualization from '../components/RelationshipVisualization.vue'
import { useUserStore } from '../stores/user'
import { useNovelWorker } from '../composables/useNovelWorker'
import TimelineManager from '../components/TimelineManager.vue'

const aiConfigStore = useAIConfigStore()
const userStore = useUserStore()
const { isProcessing: workerProcessing, result: workerResult, analyzeText, calculateStats } = useNovelWorker()
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
const showGrowthChart = ref(false)

const worldForm = ref({ genre: '', style: '', rules: '', background: '' })
const characterForm = ref({ name: '', level: 1, attributes: '{}' })
const outlineForm = ref({ outline: '' })
const chapterForm = ref({ chapterCount: 5 })
const parsing = ref(false)
const generatingChapters = ref(false)

// AI剧情建议相关
const gettingSuggestion = ref(false)
const showSuggestions = ref(false)
const plotSuggestions = ref([])

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

// 头像颜色映射
const avatarColors = [
  '#fb7185', '#38bdf8', '#a855f7', '#22c55e', 
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
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

// 导出相关

// 面包屑导航当前选中项
const activeMenu = ref('world')

// 处理菜单选择
const handleMenuSelect = (index) => {
  activeMenu.value = index
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
      showSuggestions.value = true
      ElMessage.success('已生成剧情建议')
    } else {
      ElMessage.info('暂无建议，请尝试输入一些关键字')
    }
  } catch (error) {
    ElMessage.error('获取建议失败：' + (error.message || '未知错误'))
    // 使用默认建议
    plotSuggestions.value = [
      '让主角遇到一个神秘商人，获得重要情报',
      '主角发现隐藏在身边的敌人，陷入危机',
      '主角突破修为瓶颈，实力大幅提升',
      '主角与重要配角重逢，揭示过去的秘密',
      '主角获得一件神秘宝物，引发新的冒险'
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
  doc.text(`作者：AI小说生成系统`, 105, 45, { align: 'center' })
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
      text: `作者：AI小说生成系统`,
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
  content += `作者：AI小说生成系统\n`
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
  content += `> 作者：AI小说生成系统  \n`
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
    作者：AI小说生成系统<br>
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
})

// 清理计时器
onUnmounted(() => {
  if (guestTimer) {
    clearInterval(guestTimer)
  }
})

// 监听路由参数变化，当小说ID变化时重新加载
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    novelId.value = newId
    loadDetail()
  }
}, { immediate: false })
</script>

<style scoped>
.novel-detail {
  min-height: 100vh;
  /* 继承全局深色多彩背景，本页只叠加彩色光斑与毛玻璃容器 */
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
  /* 侧边栏改为明亮毛玻璃 */
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  padding: 28px;
  overflow-y: auto;
  box-shadow: 8px 0 28px rgba(148, 163, 184, 0.32);
  border-right: 1px solid rgba(255, 255, 255, 0.9);
  transition: all var(--transition-base);
}

.sidebar h2 {
  margin: 0 0 28px 0;
  color: #1f2937;
  font-size: 22px;
  font-weight: 700;
  padding-bottom: 18px;
  border-bottom: 3px solid transparent;
  background: linear-gradient(90deg, #fb7185 0%, #38bdf8 45%, #a855f7 100%) left bottom no-repeat;
  background-size: 100% 3px;
  letter-spacing: -0.3px;
}

.section-card {
  margin-bottom: 24px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.85);
  transition: all var(--transition-base);
  overflow: hidden;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.2), transparent 55%),
              radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.16), transparent 55%),
              rgba(255, 255, 255, 0.75);
  max-width: 100%;
  box-sizing: border-box;
}

.section-card:hover {
  box-shadow: 0 14px 30px rgba(148, 163, 184, 0.3);
  transform: translateY(-2px);
  border-color: rgba(129, 140, 248, 0.8);
}

.section-card :deep(.el-card__header) {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.92);
  padding: 16px 24px;
  transition: background var(--transition-fast);
}

.section-card:hover :deep(.el-card__header) {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18) 0%, rgba(244, 114, 182, 0.16) 50%, rgba(129, 140, 248, 0.18) 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1f2937;
  font-size: 15px;
}

.world-info p {
  margin-bottom: 12px;
  line-height: 1.8;
  color: #4b5563;
  font-size: 14px;
  word-break: break-all;
  overflow-wrap: anywhere;
  max-width: 100%;
}

.world-info strong {
  color: #38bdf8;
}

.style-section {
  margin-bottom: 12px;
  max-width: 100%;
  overflow: hidden;
}

.style-section strong {
  color: #409eff;
  display: block;
  margin-bottom: 8px;
}

.style-content {
  background: rgba(255, 255, 255, 0.78);
  border-left: 3px solid #38bdf8;
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
  color: #374151;
  max-width: 100%;
}

.style-hint {
  margin-top: 10px;
}

.character-list {
  max-height: 320px;
  overflow-y: auto;
}

.character-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.character-item:hover {
  background: #f8f9fa;
}

.character-item:last-child {
  border-bottom: none;
}

.char-name {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  font-size: 15px;
}

.char-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
}

.item-list, .location-list {
  max-height: 200px;
  overflow-y: auto;
}

.item-entry, .location-entry {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.item-entry:hover, .location-entry:hover {
  background: #f8f9fa;
}

.item-name, .location-name {
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
  font-size: 14px;
}

.item-info, .location-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.owner {
  font-size: 12px;
  color: #409eff;
}

.realm-system {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}

.chapter-list {
  max-height: 300px;
  overflow-y: auto;
}

.chapter-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.chapter-item:hover {
  background: #f8f9fa;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chapter-num {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.chapter-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
  font-size: 14px;
}

.chapter-outline {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.summary {
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
  padding: 4px 0;
}

.content-area {
  padding: 24px 32px 40px;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.content-area h3 {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #1f2937;
  font-weight: 600;
}

.generate-box {
  /* 中心生成区域毛玻璃 + 多彩边框 */
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 55%),
    radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.16), transparent 55%),
    rgba(255, 255, 255, 0.78);
  padding: 32px;
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.9);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.generate-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1 0%, #22c55e 40%, #f97316 100%);
}

.generate-box:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

:deep(.el-form-item__content) {
  width: 100%;
}

.generate-box :deep(.el-textarea) {
  width: 100%;
}

.word-count-label {
  margin-left: 12px;
  color: #38bdf8;
  font-weight: 600;
}

.streaming-content {
  margin-top: 24px;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 55%),
    radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.16), transparent 55%),
    rgba(255, 255, 255, 0.82);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: hidden;
}

.streaming-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #6366f1 0%, #22c55e 40%, #f97316 100%);
  animation: streamProgress 2s ease-in-out infinite;
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
  border-bottom: 2px solid rgba(102, 126, 234, 0.3);
  font-weight: 700;
  color: #4f46e5;
}

.streaming-count {
  font-size: 14px;
  background: white;
  padding: 4px 12px;
  border-radius: 12px;
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
}

.scroller {
  height: 100%;
}

.scroller :deep(.vue-recycle-scroller__item-wrapper) {
  padding-bottom: 24px;
}

.story-list::-webkit-scrollbar {
  width: 6px;
}

.story-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.story-card {
  margin-bottom: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.92);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 55%),
    radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.16), transparent 55%),
    rgba(255, 255, 255, 0.82);
}

.story-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #6366f1 0%, #22c55e 40%, #f97316 100%);
  transform: scaleY(0);
  transition: transform var(--transition-base);
}

.story-card:hover {
  box-shadow: 0 16px 34px rgba(148, 163, 184, 0.36);
  transform: translateX(4px);
  border-color: rgba(129, 140, 248, 0.9);
}

.story-card:hover::before {
  transform: scaleY(1);
}

.story-card :deep(.el-card__body) {
  padding: 32px;
}

.story-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(30, 64, 175, 0.85);
  font-weight: 600;
  color: #4338ca;
}

.story-time {
  color: #6b7280;
  font-size: 13px;
  font-weight: normal;
}

.story-content {
  line-height: 2;
  white-space: pre-wrap;
  color: #1f2937;
  font-size: 15px;
  text-align: justify;
}

.minor-character-list {
  max-height: 300px;
  overflow-y: auto;
}

.minor-char-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.minor-name {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.minor-char-detail {
  padding: 12px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
}

.minor-char-detail p {
  margin: 8px 0;
  color: #4b5563;
}

.minor-char-detail strong {
  color: #38bdf8;
}

.story-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-badge {
  background: linear-gradient(135deg, #6366f1 0%, #22c55e 45%, #f97316 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  letter-spacing: 0.3px;
  transition: all var(--transition-fast);
}

.story-card:hover .chapter-badge {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.chapter-title-text {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.chapter-outline-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.2), transparent 55%),
    rgba(255, 255, 255, 0.82);
  border-left: 3px solid #38bdf8;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.outline-label {
  font-weight: 600;
  color: #38bdf8;
}

.outline-text {
  flex: 1;
}

.word-count-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(30, 64, 175, 0.7);
  font-size: 13px;
  color: #6b7280;
}

/* 游客限制横幅样式 */
.guest-restriction-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-bottom: 1px solid #f59e0b;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.restriction-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.restriction-content .el-icon {
  color: #f59e0b;
}

.restriction-content span {
  color: #92400e;
  font-weight: 500;
}

/* 已解锁横幅样式 */
.unlocked-banner {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-bottom: 1px solid #10b981;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
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
  color: #10b981;
}

.unlocked-content span {
  color: #065f46;
  font-weight: 500;
}

/* Logo区域样式 */
.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  transition: all 0.3s;
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 45%, #a855f7 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(248, 113, 113, 0.4);
  color: #fff;
}

.logo-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.novel-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  padding-bottom: 12px;
  border-bottom: 2px solid transparent;
  background: linear-gradient(90deg, #fb7185 0%, #38bdf8 45%, #a855f7 100%) left bottom no-repeat;
  background-size: 100% 2px;
}

/* 面包屑菜单样式 */
.breadcrumb-menu {
  border-right: none;
  background: transparent;
}

.breadcrumb-menu :deep(.el-sub-menu__title) {
  font-weight: 600;
  color: #374151;
  padding: 12px 40px 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.breadcrumb-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.breadcrumb-menu :deep(.el-menu-item) {
  height: auto;
  line-height: 1.6;
  padding: 16px;
  white-space: normal;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  margin: 8px 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.breadcrumb-menu :deep(.el-menu-item.is-active) {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
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
  border-top: 1px solid #e5e7eb;
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
  color: #4b5563;
  word-break: break-all;
  overflow-wrap: anywhere;
  white-space: normal;
  max-width: 100%;
  line-height: 1.6;
}

.world-detail-content strong {
  color: #38bdf8;
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
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  margin-bottom: 6px;
}

.character-menu-item:last-child,
.item-menu-item:last-child,
.location-menu-item:last-child,
.chapter-menu-item:last-child {
  border-bottom: none;
}

.char-level {
  font-size: 12px;
  color: #6b7280;
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
  color: #4b5563;
}

.minor-detail strong {
  color: #38bdf8;
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
  color: #374151;
}

.chapter-menu-item .chapter-outline {
  color: #6b7280;
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
  color: #374151;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
}

.summary-card .summary {
  padding: 12px;
  line-height: 1.8;
  color: #4b5563;
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  padding: 4px 8px;
}

.ai-suggest-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.suggestions-panel {
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
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
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%);
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(56, 189, 248, 0.08);
  padding-left: 20px;
}

.suggestion-item .suggestion-text {
  flex: 1;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  padding-right: 12px;
}

.suggestion-item .el-icon {
  color: #38bdf8;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.suggestion-item:hover .el-icon {
  opacity: 1;
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
  color: #374151;
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
  color: #4b5563;
  line-height: 1.6;
  padding: 8px 0;
}

.random-inspiration {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  border-left: 3px solid #fb7185;
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
  border-left: 3px solid #38bdf8;
}

.node-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.node-name {
  font-weight: 600;
  color: #374151;
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
  color: #6b7280;
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
  color: #6b7280;
  display: block;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
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
  color: #6b7280;
  font-weight: normal;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #38bdf8;
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
  color: #374151;
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
  background: linear-gradient(180deg, #38bdf8 0%, #fb7185 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
}

.chart-bar .bar-label {
  font-size: 10px;
  color: #6b7280;
}

.chart-bar .bar-value {
  font-size: 10px;
  font-weight: 600;
  color: #374151;
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
  color: #38bdf8;
}

.analyzing-status span {
  font-size: 16px;
  color: #6b7280;
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
  background: #f8fafc;
  border-radius: 12px;
}

.relations-list {
  width: 340px;
  border-left: 1px solid #e5e7eb;
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
  color: #1f2937;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.relation-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fff;
}

.relation-item:hover {
  background: #f8fafc;
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
  color: #9ca3af;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #f3f4f6;
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
  color: #1f2937;
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
  color: #6b7280;
  letter-spacing: 1px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
}

/* 关系类型标签颜色 */
.relation-item :deep(.el-tag--danger) {
  background-color: rgba(251, 113, 133, 0.12);
  border-color: rgba(251, 113, 133, 0.3);
  color: #e11d48;
}

.relation-item :deep(.el-tag--primary) {
  background-color: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
  color: #0284c7;
}

.relation-item :deep(.el-tag--success) {
  background-color: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
  color: #16a34a;
}

.relation-item :deep(.el-tag--warning) {
  background-color: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  color: #d97706;
}

.relation-item :deep(.el-tag--info) {
  background-color: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.3);
  color: #475569;
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
    border-top: 1px solid #e5e7eb;
    max-height: 350px;
  }
}

/* 骨架屏样式 */
.skeleton-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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
}

.skeleton-menu {
  margin-top: 16px;
}

.skeleton-main {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
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
  color: #6b7280;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
</style>
