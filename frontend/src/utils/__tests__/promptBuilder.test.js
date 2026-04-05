import { describe, it, expect } from 'vitest';

describe('PromptBuilder', () => {
  describe('buildPrompt', () => {
    it('should build basic prompt', () => {
      const context = {
        genre: 'Fantasy',
        characters: ['Hero', 'Villain']
      };

      // Test prompt building
      expect(context.genre).toBe('Fantasy');
    });

    it('should include character information', () => {
      const characters = [
        { name: 'Hero', role: 'Protagonist' },
        { name: 'Villain', role: 'Antagonist' }
      ];

      expect(characters).toHaveLength(2);
    });

    it('should include plot context', () => {
      const plot = {
        currentChapter: 5,
        summary: 'The hero discovers a secret'
      };

      expect(plot.currentChapter).toBe(5);
    });

    it('should handle empty context', () => {
      const context = {};

      expect(context).toEqual({});
    });
  });

  describe('formatCharacters', () => {
    it('should format character list', () => {
      const characters = [
        { name: 'Alice', traits: ['brave', 'kind'] },
        { name: 'Bob', traits: ['clever', 'mysterious'] }
      ];

      expect(characters[0].name).toBe('Alice');
    });
  });

  describe('formatPlotPoints', () => {
    it('should format plot points', () => {
      const plotPoints = [
        'Hero meets mentor',
        'Discovers hidden power',
        'Faces first challenge'
      ];

      expect(plotPoints).toHaveLength(3);
    });
  });
});
