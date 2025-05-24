import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// Set up global React for JSX
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.React = require('react');
