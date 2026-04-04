import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  novelDB, worldDB, characterDB, minorCharacterDB,
  itemDB, locationDB, summaryDB, contentDB, chapterOutlineDB
} from './localDB'

export const useNovelStore = defineStore('novel', () => {
  // === 小说列表 ===
  const novels = ref([])

  function loadNovels() {
    novels.value = novelDB.list()
  }

  function createNovel(title) {
    const id = novelDB.create(title)
    worldDB.create(id)
    summaryDB.set(id, '故事刚开始')
    loadNovels()
    return id
  }

  function deleteNovel(id) {
    novelDB.delete(id)
    loadNovels()
  }

  // === 小说详情 ===
  const currentNovel = ref(null)
  const worldState = ref(null)
  const characters = ref([])
  const minorCharacters = ref([])
  const items = ref([])
  const locations = ref([])
  const summary = ref('')
  const contents = ref([])
  const chapterOutlines = ref([])

  function loadDetail(novelId) {
    currentNovel.value = novelDB.get(novelId)
    worldState.value = worldDB.get(novelId)
    characters.value = characterDB.list(novelId)
    minorCharacters.value = minorCharacterDB.list(novelId)
    items.value = itemDB.list(novelId)
    locations.value = locationDB.list(novelId)
    summary.value = summaryDB.get(novelId)
    contents.value = contentDB.list(novelId)
    chapterOutlines.value = chapterOutlineDB.list(novelId)
  }

  // === 世界设定操作 ===
  function updateWorld(novelId, data) {
    worldDB.update(novelId, {
      genre: data.genre || '',
      style: data.style || '',
      rules: data.rules || '',
      background: data.background || '',
      extra: data.extra || '{}'
    })
    worldState.value = worldDB.get(novelId)
  }

  // === 角色操作 ===
  function addCharacter(novelId, name, level = 1, realm = null, attributes = {}) {
    characterDB.add(novelId, name, level, realm, attributes)
    characters.value = characterDB.list(novelId)
  }

  function updateCharacter(novelId, name, updates) {
    characterDB.update(novelId, name, updates)
    characters.value = characterDB.list(novelId)
  }

  // === 内容操作 ===
  function addContent(novelId, data) {
    contentDB.add(novelId, data)
    contents.value = contentDB.list(novelId)
  }

  function getNextChapterNumber(novelId) {
    return contentDB.getMaxChapterNumber(novelId) + 1
  }

  // === 更新摘要 ===
  function updateSummary(novelId, text) {
    summaryDB.set(novelId, text)
    summary.value = text
  }

  // === 处理 AI 返回的更新数据 ===
  function applyAIUpdates(novelId, updates, nextChapterNumber) {
    // 更新主要角色
    if (updates.character_updates?.length > 0) {
      for (const update of updates.character_updates) {
        characterDB.update(novelId, update.name, {
          status: update.new_status,
          level: update.level
        })
      }
    }

    // 更新/添加配角
    if (updates.minor_character_updates?.length > 0) {
      for (const minor of updates.minor_character_updates) {
        const itemsStr = typeof minor.items === 'string' ? minor.items : JSON.stringify(minor.items || [])
        if (minor.is_new) {
          minorCharacterDB.add(novelId, {
            name: minor.name,
            role: minor.role,
            status: minor.status,
            description: minor.description,
            items: itemsStr,
            first_appearance: nextChapterNumber,
            last_appearance: nextChapterNumber
          })
        } else {
          minorCharacterDB.update(novelId, minor.name, {
            status: minor.status,
            description: minor.description,
            items: itemsStr,
            last_appearance: nextChapterNumber
          })
        }
      }
    }

    // 更新/添加物品
    if (updates.item_updates?.length > 0) {
      for (const item of updates.item_updates) {
        if (item.is_new) {
          itemDB.add(novelId, {
            name: item.name,
            type: item.type,
            owner: item.owner,
            status: item.status
          })
        } else {
          itemDB.update(novelId, item.name, {
            owner: item.owner,
            status: item.status
          })
        }
      }
    }

    // 更新/添加地点
    if (updates.location_updates?.length > 0) {
      for (const location of updates.location_updates) {
        if (location.is_new) {
          locationDB.add(novelId, {
            name: location.name,
            type: location.type,
            status: location.status,
            description: location.description
          })
        } else {
          locationDB.update(novelId, location.name, {
            status: location.status,
            description: location.description
          })
        }
      }
    }

    // 更新世界设定
    if (updates.world_updates && (updates.world_updates.rules || updates.world_updates.background)) {
      const current = worldDB.get(novelId)
      worldDB.update(novelId, {
        rules: updates.world_updates.rules || current?.rules,
        background: updates.world_updates.background || current?.background
      })
    }

    // 更新摘要
    if (updates.summary) {
      summaryDB.set(novelId, updates.summary)
    }

    // 刷新状态
    loadDetail(novelId)
  }

  // === 大纲解析后的初始化 ===
  function applyOutlineParse(novelId, parsed) {
    // 更新世界设定
    const realmSystemStr = typeof parsed.world.realm_system === 'string'
      ? parsed.world.realm_system
      : JSON.stringify(parsed.world.realm_system || {})
    const extraStr = typeof parsed.world.extra === 'string'
      ? parsed.world.extra
      : JSON.stringify(parsed.world.extra || {})

    worldDB.update(novelId, {
      genre: parsed.world.genre,
      style: parsed.world.style,
      rules: parsed.world.rules,
      background: parsed.world.background,
      realm_system: realmSystemStr,
      extra: extraStr
    })

    // 添加角色
    for (const char of parsed.characters) {
      const attrsStr = typeof char.attributes === 'string'
        ? char.attributes
        : JSON.stringify(char.attributes || {})
      characterDB.add(novelId, char.name, char.level || 1, char.realm || null, attrsStr)
    }

    // 更新摘要
    if (parsed.summary) {
      summaryDB.set(novelId, parsed.summary)
    }

    loadDetail(novelId)
  }

  // === 章节大纲 ===
  function addChapterOutlines(novelId, chaptersData) {
    const startNumber = chapterOutlineDB.getMaxChapterNumber(novelId) + 1
    for (let i = 0; i < chaptersData.length; i++) {
      chapterOutlineDB.add(novelId, {
        chapter_number: startNumber + i,
        title: chaptersData[i].title,
        outline: chaptersData[i].outline,
        status: '未开始'
      })
    }
    chapterOutlines.value = chapterOutlineDB.list(novelId)
  }

  return {
    novels,
    loadNovels,
    createNovel,
    deleteNovel,
    currentNovel,
    worldState,
    characters,
    minorCharacters,
    items,
    locations,
    summary,
    contents,
    chapterOutlines,
    loadDetail,
    updateWorld,
    addCharacter,
    updateCharacter,
    addContent,
    getNextChapterNumber,
    updateSummary,
    applyAIUpdates,
    applyOutlineParse,
    addChapterOutlines
  }
})
