import React, { useState, useEffect } from 'react';
import { 
  testLLMConfigurationPassing,
  testSettingsStore,
  testMainStore,
  testMCPSettings,
  runAllTests
} from '../../../tests/frontend/application-test';

/**
 * Test UI for running application tests
 */
const ApplicationTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({
    llmConfig: null,
    settingsStore: null,
    mainStore: null,
    mcpSettings: null,
    allTests: null
  });
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Capture console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalConsoleError(...args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  // Run individual test
  const runTest = (testName: string, testFn: () => boolean) => {
    setIsRunning(true);
    setLogs(prev => [...prev, `Running ${testName} test...`]);
    
    try {
      const result = testFn();
      setTestResults(prev => ({ ...prev, [testName]: result }));
      setLogs(prev => [...prev, `${testName} test ${result ? 'passed' : 'failed'}`]);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }));
      setLogs(prev => [...prev, `ERROR in ${testName} test: ${error}`]);
    }
    
    setIsRunning(false);
  };
  
  // Run all tests
  const handleRunAllTests = () => {
    setIsRunning(true);
    setLogs(prev => [...prev, 'Running all tests...']);
    
    try {
      const result = runAllTests();
      setTestResults(prev => ({ 
        ...prev, 
        allTests: result,
        llmConfig: testResults.llmConfig,
        settingsStore: testResults.settingsStore,
        mainStore: testResults.mainStore,
        mcpSettings: testResults.mcpSettings
      }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, allTests: false }));
      setLogs(prev => [...prev, `ERROR in all tests: ${error}`]);
    }
    
    setIsRunning(false);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Reset test results
  const resetTests = () => {
    setTestResults({
      llmConfig: null,
      settingsStore: null,
      mainStore: null,
      mcpSettings: null,
      allTests: null
    });
    setLogs([]);
  };
  
  // Get test result status
  const getTestStatus = (result: boolean | null) => {
    if (result === null) return 'Not run';
    return result ? 'Passed' : 'Failed';
  };
  
  // Get test result color
  const getTestStatusColor = (result: boolean | null) => {
    if (result === null) return 'gray';
    return result ? 'green' : 'red';
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Application Test UI</h1>
      
      {/* Test Controls */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => runTest('llmConfig', testLLMConfigurationPassing)}
            disabled={isRunning}
          >
            Test LLM Config
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => runTest('settingsStore', testSettingsStore)}
            disabled={isRunning}
          >
            Test Settings Store
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => runTest('mainStore', testMainStore)}
            disabled={isRunning}
          >
            Test Main Store
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => runTest('mcpSettings', testMCPSettings)}
            disabled={isRunning}
          >
            Test MCP Settings
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
            onClick={handleRunAllTests}
            disabled={isRunning}
          >
            Run All Tests
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded"
            onClick={clearLogs}
          >
            Clear Logs
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={resetTests}
          >
            Reset Tests
          </button>
        </div>
      </div>
      
      {/* Test Results */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div 
              key={testName}
              className={`p-3 border rounded ${
                result === null 
                  ? 'bg-gray-100' 
                  : result 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
              }`}
            >
              <h3 className="font-medium capitalize">{testName}</h3>
              <p style={{ color: getTestStatusColor(result) }}>
                {getTestStatus(result)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Test Logs */}
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Logs</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run a test to see logs.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${log.startsWith('ERROR') ? 'text-red-400' : ''}`}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Test Summary */}
      <div className="mt-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Summary</h2>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Object.values(testResults).filter(Boolean).length}
            </div>
            <div className="text-green-600">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Object.values(testResults).filter(result => result === false).length}
            </div>
            <div className="text-red-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Object.values(testResults).filter(result => result === null).length}
            </div>
            <div className="text-gray-600">Not Run</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTestPage;

