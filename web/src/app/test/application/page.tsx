// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { runAllTests, testLLMConfigPassing, testSettingsStore, testMainStore, testMCPSettings } from '~/test/application-test';

export default function TestPage() {
  const [results, setResults] = useState<{
    llmConfigTest?: boolean;
    settingsStoreTest?: boolean;
    mainStoreTest?: boolean;
    mcpSettingsTest?: boolean;
    allPassed?: boolean;
  }>({});
  
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  
  // Override console.log to capture logs
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    originalLog(...args);
    setLogs(prev => [...prev, args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')]);
  };
  
  console.error = (...args) => {
    originalError(...args);
    setLogs(prev => [...prev, `ERROR: ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}`]);
  };
  
  const handleRunAllTests = async () => {
    setLogs([]);
    setRunning(true);
    try {
      const results = await runAllTests();
      setResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setRunning(false);
    }
  };
  
  const handleRunTest = async (testFn: () => Promise<boolean>, name: keyof typeof results) => {
    setLogs([]);
    setRunning(true);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [name]: result }));
    } catch (error) {
      console.error(`Error running ${name}:`, error);
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Application Tests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>LLM Configuration Test</CardTitle>
            <CardDescription>Tests if LLM configurations are properly passed to the API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">Status:</div>
              {results.llmConfigTest === undefined ? (
                <div className="text-gray-500">Not run</div>
              ) : results.llmConfigTest ? (
                <div className="text-green-500 font-bold">PASSED</div>
              ) : (
                <div className="text-red-500 font-bold">FAILED</div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleRunTest(testLLMConfigPassing, 'llmConfigTest')} 
              disabled={running}
            >
              Run Test
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Settings Store Test</CardTitle>
            <CardDescription>Tests if the settings store works correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">Status:</div>
              {results.settingsStoreTest === undefined ? (
                <div className="text-gray-500">Not run</div>
              ) : results.settingsStoreTest ? (
                <div className="text-green-500 font-bold">PASSED</div>
              ) : (
                <div className="text-red-500 font-bold">FAILED</div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleRunTest(testSettingsStore, 'settingsStoreTest')} 
              disabled={running}
            >
              Run Test
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Main Store Test</CardTitle>
            <CardDescription>Tests if the main store works correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">Status:</div>
              {results.mainStoreTest === undefined ? (
                <div className="text-gray-500">Not run</div>
              ) : results.mainStoreTest ? (
                <div className="text-green-500 font-bold">PASSED</div>
              ) : (
                <div className="text-red-500 font-bold">FAILED</div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleRunTest(testMainStore, 'mainStoreTest')} 
              disabled={running}
            >
              Run Test
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>MCP Settings Test</CardTitle>
            <CardDescription>Tests if the MCP settings work correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">Status:</div>
              {results.mcpSettingsTest === undefined ? (
                <div className="text-gray-500">Not run</div>
              ) : results.mcpSettingsTest ? (
                <div className="text-green-500 font-bold">PASSED</div>
              ) : (
                <div className="text-red-500 font-bold">FAILED</div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleRunTest(testMCPSettings, 'mcpSettingsTest')} 
              disabled={running}
            >
              Run Test
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Run All Tests</CardTitle>
          <CardDescription>Run all application tests at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="mr-2">Status:</div>
            {results.allPassed === undefined ? (
              <div className="text-gray-500">Not run</div>
            ) : results.allPassed ? (
              <div className="text-green-500 font-bold">ALL PASSED</div>
            ) : (
              <div className="text-red-500 font-bold">SOME FAILED</div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRunAllTests} 
            disabled={running}
            className="w-full"
          >
            Run All Tests
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
          <CardDescription>Console output from test runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md h-80 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a test to see output.</div>
            ) : (
              <pre className="whitespace-pre-wrap">
                {logs.map((log, i) => (
                  <div key={i} className={log.startsWith('ERROR') ? 'text-red-500' : ''}>
                    {log}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

