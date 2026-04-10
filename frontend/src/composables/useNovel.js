import { ref, computed } from 'vue';
import { useNovelStore } from '../stores/novelStore';
import { ElMessage } from 'element-plus';

/**
 * 小说管理 Composable
 * 封装小说相关的业务逻辑
 */
export function useNovel() {
  const novelStore = useNovelStore();
  const loading = ref(false);

  // 加载小说详情
  const loadNovelDetail = async (novelId) => {
    loading.value = true;
    try {
      await novelStore.loadDetail(novelId);
      return true;
    } catch (error) {
      ElMessage.error('加载失败：' + error.message);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 更新世界设定
  const updateWorldState = async (novelId, worldData) => {
    try {
      await novelStore.updateWorld(novelId, worldData);
      ElMessage.success('世界设定已更新');
      return true;
    } catch (error) {
      ElMessage.error('更新失败：' + error.message);
      return false;
    }
  };

  // 添加角色
  const addNewCharacter = async (novelId, characterData) => {
    try {
      await novelStore.addCharacter(
        novelId,
        characterData.name,
        characterData.level,
        characterData.realm,
        characterData.attributes
      );
      ElMessage.success(`角色「${characterData.name}」已添加`);
      return true;
    } catch (error) {
      ElMessage.error('添加失败：' + error.message);
      return false;
    }
  };

  // 计算属性
  const totalWordCount = computed(() => {
    return novelStore.contents.reduce((sum, content) => {
      return sum + (content.word_count || 0);
    }, 0);
  });

  const avgWordCount = computed(() => {
    const total = totalWordCount.value;
    const count = novelStore.contents.length;
    return count > 0 ? Math.round(total / count) : 0;
  });

  return {
    loading,
    novel: computed(() => novelStore.currentNovel),
    worldState: computed(() => novelStore.worldState),
    characters: computed(() => novelStore.characters),
    minorCharacters: computed(() => novelStore.minorCharacters),
    items: computed(() => novelStore.items),
    locations: computed(() => novelStore.locations),
    summary: computed(() => novelStore.summary),
    contents: computed(() => novelStore.contents),
    chapterOutlines: computed(() => novelStore.chapterOutlines),
    totalWordCount,
    avgWordCount,
    loadNovelDetail,
    updateWorldState,
    addNewCharacter
  };
}

