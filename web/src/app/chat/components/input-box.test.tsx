import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InputBox } from './input-box';

// Mock the dependencies
vi.mock('framer-motion', () => {
  return {
    motion: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

vi.mock('lucide-react', () => {
  return {
    ArrowUp: () => React.createElement('div', { 'data-testid': 'arrow-up' }, 'ArrowUp'),
    ThumbsUp: () => React.createElement('div', null, 'ThumbsUp'),
    X: () => React.createElement('div', null, 'X'),
  };
});

vi.mock('~/components/deer-flow/icons/detective', () => {
  return {
    Detective: () => React.createElement('div', null, 'Detective'),
  };
});

vi.mock('~/components/deer-flow/tooltip', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tooltip: ({ children, title }: any) => (
      React.createElement('div', { title: typeof title === 'string' ? title : 'tooltip' }, children)
    ),
  };
});

vi.mock('~/components/ui/button', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, onClick, className, 'aria-label': ariaLabel }: any) => (
      React.createElement('button', { 
        onClick, 
        className, 
        'aria-label': ariaLabel
      }, children)
    ),
  };
});

vi.mock('~/core/store', () => {
  return {
    useStore: vi.fn((selector) => {
      // Mock the store state
      const state = {
        selectedCoordinatorPersona: 'DIY Planner',
        enableBackgroundInvestigation: false,
      };
      return selector(state);
    }),
    setEnableBackgroundInvestigation: vi.fn(),
  };
});

vi.mock('~/lib/utils', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  };
});

describe('InputBox', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSend = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSend.mockClear();
  });

  it('calls onSubmit when Enter is pressed', () => {
    render(React.createElement(InputBox, { onSubmit: mockOnSubmit }));
    
    // Type a message
    const textarea = screen.getByPlaceholderText('What can I do for you?');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    // Check if onSubmit was called with the correct message
    expect(mockOnSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('calls onSend if onSubmit is not provided', () => {
    render(React.createElement(InputBox, { onSend: mockOnSend }));
    
    // Type a message
    const textarea = screen.getByPlaceholderText('What can I do for you?');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    // Check if onSend was called with the correct message
    expect(mockOnSend).toHaveBeenCalledWith('Hello world', { interruptFeedback: undefined });
  });
});
