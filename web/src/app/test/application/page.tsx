// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { runAllTests, testLLMConfigPassing, testSettingsStore, testMainStore, testMCPSettings } from "~/test/application-test";

export default function ApplicationTestPage() {
  const [testResults, setTestResults] = useState<{
    llmConfigTest?: boolean;
    settingsStoreTest?: boolean;
    mainStoreTest?: boolean;
    mcpSettingsTest?: boolean;
    allPassed?: boolean;
    logs: string[];
  }>({
    logs: [],
  });
  const [isRunning, setIsRunning] = useState(false);

  // Override console.log to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const captureConsole = () => {
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[LOG] ${message}`);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[ERROR] ${message}`);
      originalConsoleError(...args);
    };
    
    return logs;
  };

  const restoreConsole = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  };

  const runTests = async () => {
    setIsRunning(true);
    const logs = captureConsole();
    
    try {
      const results = await runAllTests();
      setTestResults({
        ...results,
        logs,
      });
    } catch (error) {
      console.error("Error running tests:", error);
      setTestResults({
        llmConfigTest: false,
        settingsStoreTest: false,
        mainStoreTest: false,
        mcpSettingsTest: false,
        allPassed: false,
        logs: [...logs, `[ERROR] Uncaught exception: ${error}`],
      });
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  const runLLMConfigTest = async () => {
    setIsRunning(true);
    const logs = captureConsole();
    
    try {
      const result = await testLLMConfigPassing();
      setTestResults({
        ...testResults,
        llmConfigTest: result,
        logs,
      });
    } catch (error) {
      console.error("Error running LLM config test:", error);
      setTestResults({
        ...testResults,
        llmConfigTest: false,
        logs: [...logs, `[ERROR] Uncaught exception: ${error}`],
      });
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  const runSettingsStoreTest = async () => {
    setIsRunning(true);
    const logs = captureConsole();
    
    try {
      const result = await testSettingsStore();
      setTestResults({
        ...testResults,
        settingsStoreTest: result,
        logs,
      });
    } catch (error) {
      console.error("Error running settings store test:", error);
      setTestResults({
        ...testResults,
        settingsStoreTest: false,
        logs: [...logs, `[ERROR] Uncaught exception: ${error}`],
      });
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  const runMainStoreTest = async () => {
    setIsRunning(true);
    const logs = captureConsole();
    
    try {
      const result = await testMainStore();
      setTestResults({
        ...testResults,
        mainStoreTest: result,
        logs,
      });
    } catch (error) {
      console.error("Error running main store test:", error);
      setTestResults({
        ...testResults,
        mainStoreTest: false,
        logs: [...logs, `[ERROR] Uncaught exception: ${error}`],
      });
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  const runMCPSettingsTest = async () => {
    setIsRunning(true);
    const logs = captureConsole();
    
    try {
      const result = await testMCPSettings();
      setTestResults({
        ...testResults,
        mcpSettingsTest: result,
        logs,
      });
    } catch (error) {
      console.error("Error running MCP settings test:", error);
      setTestResults({
        ...testResults,
        mcpSettingsTest: false,
        logs: [...logs, `[ERROR] Uncaught exception: ${error}`],
      });
    } finally {
      restoreConsole();
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">DeerFlow Application Test Suite</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>LLM Configuration Test</CardTitle>
            <CardDescription>
              Tests that LLM configurations are properly passed to the chat API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.llmConfigTest !== undefined && (
              <div className={`p-4 rounded-md ${testResults.llmConfigTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.llmConfigTest ? '✅ Passed' : '❌ Failed'}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runLLMConfigTest} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Settings Store Test</CardTitle>
            <CardDescription>
              Tests that the settings store works correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.settingsStoreTest !== undefined && (
              <div className={`p-4 rounded-md ${testResults.settingsStoreTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.settingsStoreTest ? '✅ Passed' : '❌ Failed'}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runSettingsStoreTest} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Main Store Test</CardTitle>
            <CardDescription>
              Tests that the main store works correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.mainStoreTest !== undefined && (
              <div className={`p-4 rounded-md ${testResults.mainStoreTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.mainStoreTest ? '✅ Passed' : '❌ Failed'}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runMainStoreTest} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>MCP Settings Test</CardTitle>
            <CardDescription>
              Tests that the MCP settings work correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.mcpSettingsTest !== undefined && (
              <div className={`p-4 rounded-md ${testResults.mcpSettingsTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.mcpSettingsTest ? '✅ Passed' : '❌ Failed'}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runMCPSettingsTest} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Run All Tests</CardTitle>
          <CardDescription>
            Run all tests at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.allPassed !== undefined && (
            <div className={`p-4 rounded-md ${testResults.allPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {testResults.allPassed ? '✅ All tests passed' : '❌ Some tests failed'}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runTests} disabled={isRunning} className="mr-4">
            {isRunning ? 'Running...' : 'Run All Tests'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md h-96 overflow-auto font-mono text-sm">
            {testResults.logs.map((log, index) => (
              <div key={index} className={log.startsWith('[ERROR]') ? 'text-red-600' : ''}>
                {log}
              </div>
            ))}
            {testResults.logs.length === 0 && (
              <div className="text-gray-500">No logs yet. Run a test to see logs.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

