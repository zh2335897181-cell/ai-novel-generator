import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNovelStore } from '../novelStore';

describe('Novel Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty state', () => {
    const store = useNovelStore();
    
    expect(store.novels).toEqual([]);
    expect(store.currentNovel).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('should add novel to store', () => {
    const store = useNovelStore();
    const novel = {
      id: 1,
      title: 'Test Novel',
      genre: 'Fantasy'
    };

    store.novels.push(novel);
    
    expect(store.novels).toHaveLength(1);
    expect(store.novels[0].title).toBe('Test Novel');
  });

  it('should set current novel', () => {
    const store = useNovelStore();
    const novel = {
      id: 1,
      title: 'Test Novel'
    };

    store.currentNovel = novel;
    
    expect(store.currentNovel).toEqual(novel);
  });

  it('should update novel in store', () => {
    const store = useNovelStore();
    store.novels = [
      { id: 1, title: 'Original Title' }
    ];

    const updatedNovel = { id: 1, title: 'Updated Title' };
    const index = store.novels.findIndex(n => n.id === 1);
    store.novels[index] = updatedNovel;

    expect(store.novels[0].title).toBe('Updated Title');
  });

  it('should remove novel from store', () => {
    const store = useNovelStore();
    store.novels = [
      { id: 1, title: 'Novel 1' },
      { id: 2, title: 'Novel 2' }
    ];

    store.novels = store.novels.filter(n => n.id !== 1);

    expect(store.novels).toHaveLength(1);
    expect(store.novels[0].id).toBe(2);
  });

  it('should handle loading state', () => {
    const store = useNovelStore();

    store.loading = true;
    expect(store.loading).toBe(true);

    store.loading = false;
    expect(store.loading).toBe(false);
  });
});
