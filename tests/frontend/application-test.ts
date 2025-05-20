/**
 * Application tests for the frontend components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMainStore } from '../../src/stores/main';
import { useSettingsStore } from '../../src/stores/settings';
import { createPinia, setActivePinia } from 'pinia';

// Mock the fetch API
global.fetch = vi.fn();

describe('Frontend Application Tests', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
    
    // Reset mocks
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LLM Configuration Tests', () => {
    it('should correctly pass LLM configuration to the backend', async () => {
      // Setup the mock fetch response
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Get the settings store
      const settingsStore = useSettingsStore();
      
      // Update LLM settings
      settingsStore.updateLLMSettings({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-api-key',
      });

      // Verify the settings were updated
      expect(settingsStore.llmSettings.provider).toBe('openai');
      expect(settingsStore.llmSettings.model).toBe('gpt-4');
      expect(settingsStore.llmSettings.apiKey).toBe('test-api-key');
    });
  });

  describe('Settings Store Tests', () => {
    it('should correctly store and retrieve settings', () => {
      const settingsStore = useSettingsStore();
      
      // Update settings
      settingsStore.updateSettings({
        theme: 'dark',
        language: 'en',
        notifications: true,
      });

      // Verify settings were updated
      expect(settingsStore.settings.theme).toBe('dark');
      expect(settingsStore.settings.language).toBe('en');
      expect(settingsStore.settings.notifications).toBe(true);
    });
  });

  describe('Main Store Tests', () => {
    it('should correctly manage chat messages', () => {
      const mainStore = useMainStore();
      
      // Add a message
      mainStore.addMessage({
        id: '1',
        role: 'user',
        content: 'Hello, world!',
        timestamp: new Date().toISOString(),
      });

      // Verify message was added
      expect(mainStore.messages.length).toBe(1);
      expect(mainStore.messages[0].content).toBe('Hello, world!');
      
      // Add another message
      mainStore.addMessage({
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date().toISOString(),
      });
      
      // Verify second message was added
      expect(mainStore.messages.length).toBe(2);
      expect(mainStore.messages[1].role).toBe('assistant');
    });
  });

  describe('MCP Settings Tests', () => {
    it('should correctly configure MCP settings', () => {
      const settingsStore = useSettingsStore();
      
      // Update MCP settings
      settingsStore.updateMCPSettings({
        url: 'http://localhost:8000',
        enabled: true,
      });
      
      // Verify MCP settings were updated
      expect(settingsStore.mcpSettings.url).toBe('http://localhost:8000');
      expect(settingsStore.mcpSettings.enabled).toBe(true);
    });
  });
});

