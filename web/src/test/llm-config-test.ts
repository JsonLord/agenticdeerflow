// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { nanoid } from 'nanoid';

import { chatStream } from '~/core/api/chat';
import type { LLMProviderConfig } from '~/core/store/settings-store';
import { changeSettings } from '~/core/store/settings-store';

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
  
  // 2. Create a mock implementation of fetch to intercept the API call
  const originalFetch = global.fetch;
  let capturedRequestBody: Record<string, unknown> = null;
  
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only intercept calls to the chat/stream endpoint
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      // For Request objects
      url = input.url;
    }
    
    if (url.includes('chat/stream')) {
      // Capture the request body
      capturedRequestBody = JSON.parse(init?.body as string);
      console.log('Intercepted chat/stream API call with body:', capturedRequestBody);
      
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
    }
    
    // Pass through all other requests
    return originalFetch(input, init);
  };
  
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
    } catch {
      // Ignore errors from the mock implementation
    }
    
    // 4. Verify that the LLM configuration was properly passed
    if (!capturedRequestBody) {
      console.error('No request body was captured!');
      return false;
    }
    
    const passedLLMConfigs = capturedRequestBody.llm_configurations as Record<string, LLMProviderConfig>;
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
      console.log('\u2705 Test passed! LLM configurations were correctly passed to the API.');
      return true;
    } else {
      console.error('\u274c Test failed! LLM configurations were not correctly passed to the API.');
      return false;
    }
  } finally {
    // Restore the original fetch implementation
    global.fetch = originalFetch;
  }
}

/**
 * Test function to verify that the research chat functionality works properly
 */
export async function testResearchChatFunctionality() {
  console.log('Starting research chat functionality test...');
  
  // Mock a successful test for now
  // In the future, this would need to be implemented with a more comprehensive test framework
  // that can interact with the UI components and verify the research workflow
  
  // Create a mock implementation of fetch to intercept the API call
  const originalFetch = global.fetch;
  let apiCallMade = false;
  
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only intercept calls to the chat/stream endpoint
    const url = input.toString();
    if (url.includes('chat/stream')) {
      const requestBody = JSON.parse(init?.body as string);
      
      // Check if this is a research chat request
      if (requestBody.enable_background_investigation) {
        apiCallMade = true;
        console.log('Intercepted research chat API call:', requestBody);
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
    }
    
    // Pass through all other requests
    return originalFetch(input, init);
  };
  
  try {
    // Send a test message to trigger the research chat API
    const threadId = nanoid();
    console.log('Sending test research message with thread ID:', threadId);
    
    const stream = chatStream(
      'Test research question about climate change',
      {
        thread_id: threadId,
        auto_accepted_plan: false,
        max_plan_iterations: 1,
        max_step_num: 3,
        max_search_results: 3,
        enable_background_investigation: true, // This flag enables research mode
      }
    );
    
    // Just start the stream to trigger the API call
    const iterator = stream[Symbol.asyncIterator]();
    try {
      await iterator.next();
    } catch (e) {
      // Ignore errors from the mock implementation
    }
    
    if (apiCallMade) {
      console.log('\u2705 Test passed! Research chat API was called successfully.');
      return true;
    } else {
      console.error('\u274c Test failed! Research chat API was not called.');
      return false;
    }
  } finally {
    // Restore the original fetch implementation
    global.fetch = originalFetch;
  }
}

// Export a main test function that runs all tests
export async function runAllTests() {
  const llmConfigResult = await testLLMConfigPassing();
  const researchChatResult = await testResearchChatFunctionality();
  
  return {
    llmConfigTest: llmConfigResult,
    researchChatTest: researchChatResult,
    allPassed: llmConfigResult && researchChatResult,
  };
}
