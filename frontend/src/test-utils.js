import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import ElementPlus from 'element-plus';

// Create test router
export const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/novels', component: { template: '<div>Novels</div>' } },
      { path: '/novels/:id', component: { template: '<div>Novel Detail</div>' } }
    ]
  });
};

// Create test pinia instance
export const createTestPinia = () => {
  return createPinia();
};

// Global mount options for tests
export const globalMountOptions = {
  global: {
    plugins: [ElementPlus, createTestPinia(), createTestRouter()],
    stubs: {
      'router-link': true,
      'router-view': true
    }
  }
};

// Mock API responses
export const mockApiResponses = {
  novels: [
    { id: 1, title: 'Novel 1', genre: 'Fantasy' },
    { id: 2, title: 'Novel 2', genre: 'Sci-Fi' }
  ],
  novel: {
    id: 1,
    title: 'Test Novel',
    genre: 'Fantasy',
    content: 'Test content'
  },
  user: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  }
};

// Helper to wait for async updates
export const flushPromises = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
};
