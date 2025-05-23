import { runApplicationTests } from './application-test.js';

async function runAllTests() {
  console.log('Starting tests...');
  
  try {
    // Run application tests
    const appTestsPassed = await runApplicationTests();
    
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

runAllTests();

