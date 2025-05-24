import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConversationStarter } from './conversation-starter';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  return {
    motion: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      li: ({ children, ...props }: any) => React.createElement('li', props, children),
    },
  };
});

// Mock the utils
vi.mock('~/lib/utils', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  };
});

describe('ConversationStarter', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSend = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSend.mockClear();
  });

  it('calls onSubmit when a question is clicked', () => {
    render(React.createElement(ConversationStarter, { onSubmit: mockOnSubmit }));
    
    // Click on an example question
    const question = screen.getByText(/How many times taller is the Eiffel Tower/);
    fireEvent.click(question);
    
    // Check if onSubmit was called with the correct question
    expect(mockOnSubmit).toHaveBeenCalledWith(
      'How many times taller is the Eiffel Tower than the tallest building in the world?'
    );
  });

  it('calls onSend if onSubmit is not provided', () => {
    render(React.createElement(ConversationStarter, { onSend: mockOnSend }));
    
    // Click on an example question
    const question = screen.getByText(/How many times taller is the Eiffel Tower/);
    fireEvent.click(question);
    
    // Check if onSend was called with the correct question
    expect(mockOnSend).toHaveBeenCalledWith(
      'How many times taller is the Eiffel Tower than the tallest building in the world?'
    );
  });
});
