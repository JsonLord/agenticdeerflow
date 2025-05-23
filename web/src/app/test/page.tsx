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
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const captureConsole = () => {
    const logs: string[] = [];
    
    console.log = (...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[LOG] ${message}`);
      originalConsoleLog(...args);
    };
    
    console.error = (...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg)
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
    setRunning(true);
    setResults({});
    const capturedLogs = captureConsole();
    
    try {
      // Run individual tests
      const llmConfigTest = await testLLMConfigPassing();
      setResults(prev => ({ ...prev, llmConfigTest }));
      
      const settingsStoreTest = await testSettingsStore();
      setResults(prev => ({ ...prev, settingsStoreTest }));
      
      const mainStoreTest = await testMainStore();
      setResults(prev => ({ ...prev, mainStoreTest }));
      
      const mcpSettingsTest = await testMCPSettings();
      setResults(prev => ({ ...prev, mcpSettingsTest }));
      
      // Run all tests together
      const allPassed = await runAllTests();
      setResults(prev => ({ ...prev, allPassed }));
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setLogs(capturedLogs);
      restoreConsole();
      setRunning(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Application Tests</h1>
      
      <div className="mb-6">
        <Button onClick={runTests} disabled={running}>
          {running ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <TestResultCard 
          title="LLM Config Test" 
          description="Tests if LLM configuration is correctly passed to the API"
          result={results.llmConfigTest}
        />
        
        <TestResultCard 
          title="Settings Store Test" 
          description="Tests if settings store correctly manages user preferences"
          result={results.settingsStoreTest}
        />
        
        <TestResultCard 
          title="Main Store Test" 
          description="Tests if main application store works correctly"
          result={results.mainStoreTest}
        />
        
        <TestResultCard 
          title="MCP Settings Test" 
          description="Tests if MCP settings are correctly managed"
          result={results.mcpSettingsTest}
        />
        
        <TestResultCard 
          title="All Tests" 
          description="Runs all tests together to check for integration issues"
          result={results.allPassed}
          className="md:col-span-2 lg:col-span-3"
        />
      </div>
      
      <div className="bg-muted rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Test Logs</h2>
        <div className="bg-card border rounded-md p-4 h-[400px] overflow-y-auto font-mono text-sm">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${log.startsWith('[ERROR]') ? 'text-destructive' : ''}`}
              >
                {log}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">Run tests to see logs...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestResultCard({ 
  title, 
  description, 
  result, 
  className = '' 
}: { 
  title: string; 
  description: string; 
  result?: boolean; 
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {result === undefined ? (
          <div className="text-muted-foreground">Not run yet</div>
        ) : result ? (
          <div className="text-green-500 font-semibold">PASSED</div>
        ) : (
          <div className="text-destructive font-semibold">FAILED</div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Check logs for details
        </div>
      </CardFooter>
    </Card>
  );
}
