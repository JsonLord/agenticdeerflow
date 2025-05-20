// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useSettingsStore, changeSettings, LLMProviderConfig } from '~/core/store/settings-store';
import { chatStream } from '~/core/api/chat';
import { nanoid } from 'nanoid';
import { useStore } from '~/core/store/store';

/**
 * Test suite for verifying the full web application functionality
 */

// Mock fetch for testing
const originalFetch = global.fetch;
let capturedRequestBody: any = null;

// Mock implementation of fetch
const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Capture the request body
  if (init?.body) {
    try {
      capturedRequestBody = JSON.parse(init.body as string);
      console.log('Intercepted API call with body:', capturedRequestBody);
    } catch (e) {
      console.error('Failed to parse request body:', e);
    }
  }
  
  // Return a mock response
  return {
    ok: true,
    status: 200,
    headers: new Headers({
      'content-type': 'text/event-stream',
    }),
    body: {
      getReader() {
        return {
          read() {
            return Promise.resolve({ done: true, value: undefined });
          },
          cancel() {
            return Promise.resolve();
          },
        };
      },
    },
  } as Response;
};

/**
 * Test function to verify that LLM configurations are properly passed to the chat API
 */
export async function testLLMConfigPassing() {
  console.log('Starting LLM configuration test...');
  
  // 1. Set up a test LLM configuration
  const testConfig: LLMProviderConfig = {
    provider: 'openai',
    model_name: 'gpt-4-turbo',
    api_key: 'test-api-key-' + nanoid(6),
  };
  
  // Update all LLM roles with the same configuration
  const newLLMConfigurations = {
    basic: testConfig,
    reasoning: testConfig,
    vision: testConfig,
  };
  
  // Apply the configuration to the settings store
  changeSettings({ llmConfigurations: newLLMConfigurations });
  console.log('Applied test LLM configuration:', testConfig);
  
  // 2. Replace fetch with mock implementation
  global.fetch = mockFetch;
  
  try {
    // 3. Send a test message to trigger the chat API
    const threadId = nanoid();
    console.log('Sending test message with thread ID:', threadId);
    
    const stream = chatStream(
      'Test research question about climate change',
      {
        thread_id: threadId,
        auto_accepted_plan: false,
        max_plan_iterations: 1,
        max_step_num: 3,
        max_search_results: 3,
        enable_background_investigation: true,
      }
    );
    
    // Just start the stream to trigger the API call
    const iterator = stream[Symbol.asyncIterator]();
    try {
      await iterator.next();
    } catch (e) {
      // Ignore errors from the mock implementation
    }
    
    // 4. Verify that the LLM configuration was properly passed
    if (!capturedRequestBody) {
      console.error('No request body was captured!');
      return false;
    }
    
    const passedLLMConfigs = capturedRequestBody.llm_configurations;
    console.log('LLM configurations passed to API:', passedLLMConfigs);
    
    if (!passedLLMConfigs) {
      console.error('No LLM configurations were passed to the API!');
      return false;
    }
    
    // Check that all roles have the correct configuration
    const roles = ['basic', 'reasoning', 'vision'];
    let allConfigsCorrect = true;
    
    for (const role of roles) {
      const roleConfig = passedLLMConfigs[role];
      if (!roleConfig) {
        console.error(`Missing configuration for role: ${role}`);
        allConfigsCorrect = false;
        continue;
      }
      
      if (roleConfig.provider !== testConfig.provider) {
        console.error(`Incorrect provider for role ${role}: ${roleConfig.provider} (expected: ${testConfig.provider})`);
        allConfigsCorrect = false;
      }
      
      if (roleConfig.model_name !== testConfig.model_name) {
        console.error(`Incorrect model_name for role ${role}: ${roleConfig.model_name} (expected: ${testConfig.model_name})`);
        allConfigsCorrect = false;
      }
      
      if (roleConfig.api_key !== testConfig.api_key) {
        console.error(`Incorrect api_key for role ${role}: ${roleConfig.api_key} (expected: ${testConfig.api_key})`);
        allConfigsCorrect = false;
      }
    }
    
    if (allConfigsCorrect) {
      console.log('✅ Test passed! LLM configurations were correctly passed to the API.');
      return true;
    } else {
      console.error('❌ Test failed! LLM configurations were not correctly passed to the API.');
      return false;
    }
  } finally {
    // Restore the original fetch implementation
    global.fetch = originalFetch;
  }
}

/**
 * Test function to verify that the settings store works correctly
 */
export async function testSettingsStore() {
  console.log('Starting settings store test...');
  
  // 1. Set up a test LLM configuration
  const testConfig: LLMProviderConfig = {
    provider: 'openai',
    model_name: 'gpt-4-turbo',
    api_key: 'test-api-key-' + nanoid(6),
  };
  
  // Update all LLM roles with the same configuration
  const newLLMConfigurations = {
    basic: testConfig,
    reasoning: testConfig,
    vision: testConfig,
  };
  
  // Apply the configuration to the settings store
  changeSettings({ llmConfigurations: newLLMConfigurations });
  
  // Get the current settings
  const settings = useSettingsStore.getState();
  
  // Verify that the settings were updated correctly
  if (!settings.llmConfigurations) {
    console.error('LLM configurations not found in settings store!');
    return false;
  }
  
  const roles = ['basic', 'reasoning', 'vision'];
  let allConfigsCorrect = true;
  
  for (const role of roles) {
    const roleConfig = settings.llmConfigurations[role as keyof typeof settings.llmConfigurations];
    if (!roleConfig) {
      console.error(`Missing configuration for role: ${role}`);
      allConfigsCorrect = false;
      continue;
    }
    
    if (roleConfig.provider !== testConfig.provider) {
      console.error(`Incorrect provider for role ${role}: ${roleConfig.provider} (expected: ${testConfig.provider})`);
      allConfigsCorrect = false;
    }
    
    if (roleConfig.model_name !== testConfig.model_name) {
      console.error(`Incorrect model_name for role ${role}: ${roleConfig.model_name} (expected: ${testConfig.model_name})`);
      allConfigsCorrect = false;
    }
    
    if (roleConfig.api_key !== testConfig.api_key) {
      console.error(`Incorrect api_key for role ${role}: ${roleConfig.api_key} (expected: ${testConfig.api_key})`);
      allConfigsCorrect = false;
    }
  }
  
  if (allConfigsCorrect) {
    console.log('✅ Test passed! Settings store was correctly updated.');
    return true;
  } else {
    console.error('❌ Test failed! Settings store was not correctly updated.');
    return false;
  }
}

/**
 * Test function to verify that the main store works correctly
 */
export async function testMainStore() {
  console.log('Starting main store test...');
  
  // Get the current store state
  const initialState = useStore.getState();
  
  // Verify that the store has the expected properties
  if (typeof initialState.threadId !== 'string') {
    console.error('Thread ID is not a string!');
    return false;
  }
  
  if (!Array.isArray(initialState.messageIds)) {
    console.error('Message IDs is not an array!');
    return false;
  }
  
  if (!(initialState.messages instanceof Map)) {
    console.error('Messages is not a Map!');
    return false;
  }
  
  // Test appending a message
  const testMessage = {
    id: nanoid(),
    threadId: initialState.threadId,
    role: 'user',
    content: 'Test message',
    contentChunks: ['Test message'],
  };
  
  useStore.getState().appendMessage(testMessage);
  
  // Verify that the message was added
  const updatedState = useStore.getState();
  if (!updatedState.messageIds.includes(testMessage.id)) {
    console.error('Message ID not found in messageIds!');
    return false;
  }
  
  if (!updatedState.messages.has(testMessage.id)) {
    console.error('Message not found in messages Map!');
    return false;
  }
  
  const storedMessage = updatedState.messages.get(testMessage.id);
  if (storedMessage?.content !== testMessage.content) {
    console.error(`Incorrect message content: ${storedMessage?.content} (expected: ${testMessage.content})`);
    return false;
  }
  
  console.log('✅ Test passed! Main store is working correctly.');
  return true;
}

/**
 * Test function to verify that the MCP settings work correctly
 */
export async function testMCPSettings() {
  console.log('Starting MCP settings test...');
  
  // 1. Set up test MCP settings
  const testMCPSettings = {
    servers: {
      'test-server': {
        name: 'Test Server',
        url: 'http://localhost:8000',
        enabled: true,
        enabled_tools: ['test-tool'],
        add_to_agents: ['researcher'],
      },
    },
  };
  
  // Apply the configuration to the settings store
  changeSettings({ mcpSettings: testMCPSettings });
  
  // Get the current settings
  const settings = useSettingsStore.getState();
  
  // Verify that the settings were updated correctly
  if (!settings.mcpSettings) {
    console.error('MCP settings not found in settings store!');
    return false;
  }
  
  if (!settings.mcpSettings.servers) {
    console.error('MCP servers not found in settings!');
    return false;
  }
  
  const server = settings.mcpSettings.servers['test-server'];
  if (!server) {
    console.error('Test server not found in MCP settings!');
    return false;
  }
  
  if (server.name !== 'Test Server') {
    console.error(`Incorrect server name: ${server.name} (expected: Test Server)`);
    return false;
  }
  
  if (server.url !== 'http://localhost:8000') {
    console.error(`Incorrect server URL: ${server.url} (expected: http://localhost:8000)`);
    return false;
  }
  
  if (!server.enabled) {
    console.error('Server is not enabled!');
    return false;
  }
  
  if (!Array.isArray(server.enabled_tools) || server.enabled_tools[0] !== 'test-tool') {
    console.error(`Incorrect enabled tools: ${server.enabled_tools} (expected: ['test-tool'])`);
    return false;
  }
  
  if (!Array.isArray(server.add_to_agents) || server.add_to_agents[0] !== 'researcher') {
    console.error(`Incorrect add_to_agents: ${server.add_to_agents} (expected: ['researcher'])`);
    return false;
  }
  
  console.log('✅ Test passed! MCP settings are working correctly.');
  return true;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  const results = {
    llmConfigTest: await testLLMConfigPassing(),
    settingsStoreTest: await testSettingsStore(),
    mainStoreTest: await testMainStore(),
    mcpSettingsTest: await testMCPSettings(),
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('Test results:', results);
  console.log(`Overall result: ${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
  
  return {
    ...results,
    allPassed,
  };
}

