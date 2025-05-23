import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationStarter } from './conversation-starter';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  return {
    motion: {
      li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    },
  };
});

// Mock the utils
vi.mock('~/lib/utils', () => {
  return {
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

  it('renders example questions', () => {
    render(<ConversationStarter onSubmit={mockOnSubmit} />);
    
    // Check if example questions are rendered
    expect(screen.getByText(/How many times taller is the Eiffel Tower/)).toBeInTheDocument();
    expect(screen.getByText(/How many years does an average Tesla battery last/)).toBeInTheDocument();
  });

  it('calls onSubmit when a question is clicked', () => {
    render(<ConversationStarter onSubmit={mockOnSubmit} />);
    
    // Click on an example question
    const question = screen.getByText(/How many times taller is the Eiffel Tower/);
    fireEvent.click(question);
    
    // Check if onSubmit was called with the correct question
    expect(mockOnSubmit).toHaveBeenCalledWith(
      'How many times taller is the Eiffel Tower than the tallest building in the world?'
    );
  });

  it('calls onSend when a question is clicked and onSubmit is not provided', () => {
    render(<ConversationStarter onSend={mockOnSend} />);
    
    // Click on an example question
    const question = screen.getByText(/How many times taller is the Eiffel Tower/);
    fireEvent.click(question);
    
    // Check if onSend was called with the correct question
    expect(mockOnSend).toHaveBeenCalledWith(
      'How many times taller is the Eiffel Tower than the tallest building in the world?'
    );
  });

  it('prioritizes onSubmit over onSend when both are provided', () => {
    render(<ConversationStarter onSubmit={mockOnSubmit} onSend={mockOnSend} />);
    
    // Click on an example question
    const question = screen.getByText(/How many times taller is the Eiffel Tower/);
    fireEvent.click(question);
    
    // Check if onSubmit was called and onSend was not
    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnSend).not.toHaveBeenCalled();
  });
});

