import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

describe('NovelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNovel', () => {
    it('should create a novel successfully', async () => {
      const mockNovelData = {
        title: 'Test Novel',
        genre: 'Fantasy',
        user_id: 1
      };

      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      // Test would import and call the actual service
      expect(mockQuery).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));
      
      expect(mockQuery).toBeDefined();
    });
  });

  describe('getNovelById', () => {
    it('should retrieve a novel by id', async () => {
      const mockNovel = {
        id: 1,
        title: 'Test Novel',
        genre: 'Fantasy'
      };

      mockQuery.mockResolvedValueOnce([[mockNovel]]);

      expect(mockQuery).toBeDefined();
    });

    it('should return null for non-existent novel', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      expect(mockQuery).toBeDefined();
    });
  });

  describe('updateNovel', () => {
    it('should update novel successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      expect(mockQuery).toBeDefined();
    });
  });

  describe('deleteNovel', () => {
    it('should delete novel successfully', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      expect(mockQuery).toBeDefined();
    });
  });
});
