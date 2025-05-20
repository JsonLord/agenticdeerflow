// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { runAllTests } from './application-test.js';

async function main() {
  console.log('Running all tests...');
  
  try {
    const results = await runAllTests();
    
    console.log('\n=== Test Results ===');
    console.log(`LLM Config Test: ${results.llmConfigTest ? 'PASSED' : 'FAILED'}`);
    console.log(`Settings Store Test: ${results.settingsStoreTest ? 'PASSED' : 'FAILED'}`);
    console.log(`Main Store Test: ${results.mainStoreTest ? 'PASSED' : 'FAILED'}`);
    console.log(`MCP Settings Test: ${results.mcpSettingsTest ? 'PASSED' : 'FAILED'}`);
    console.log(`All Tests: ${results.allPassed ? 'PASSED' : 'FAILED'}`);
    
    if (!results.allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main();

