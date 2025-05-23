import { runAllTests } from './application-test.js';

async function runTests() {
  console.log('Starting tests...');
  
  try {
    // Run application tests
    const appTestsPassed = await runAllTests();
    
    if (appTestsPassed) {
      console.log('All tests passed!');
      process.exit(0);
    } else {
      console.error('Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();

