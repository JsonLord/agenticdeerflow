import '@testing-library/jest-dom';
import '@testing-library/react';
import * as matchers from '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  return import('./mocks/lucide-react');
});
