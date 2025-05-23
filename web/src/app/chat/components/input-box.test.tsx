import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputBox } from './input-box';

// Mock the dependencies
vi.mock('framer-motion', () => {
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('lucide-react', () => {
  return {
    ArrowUp: () => <div data-testid="arrow-up">ArrowUp</div>,
    ThumbsUp: () => <div>ThumbsUp</div>,
    X: () => <div>X</div>,
  };
});

vi.mock('~/components/deer-flow/icons/detective', () => {
  return {
    Detective: () => <div>Detective</div>,
  };
});

vi.mock('~/components/deer-flow/tooltip', () => {
  return {
    Tooltip: ({ children, title }: any) => (
      <div title={typeof title === 'string' ? title : 'tooltip'}>
        {children}
      </div>
    ),
  };
});

vi.mock('~/components/ui/button', () => {
  return {
    Button: ({ children, onClick, className, 'aria-label': ariaLabel }: any) => (
      <button 
        onClick={onClick} 
        className={className} 
        aria-label={ariaLabel}
      >
        {children}
      </button>
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

  it('renders correctly', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);
    expect(screen.getByPlaceholderText('What can I do for you?')).toBeInTheDocument();
    expect(screen.getByText('Investigation')).toBeInTheDocument();
  });

  it('calls onSubmit when send button is clicked with non-empty message', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);
    
    // Type a message
    const textarea = screen.getByPlaceholderText('What can I do for you?');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    // Click the send button
    const sendButton = screen.getByText('ArrowUp').closest('button');
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    
    // Check if onSubmit was called with the correct message
    expect(mockOnSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('does not call onSubmit when send button is clicked with empty message', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);
    
    // Click the send button without typing a message
    const sendButton = screen.getByText('ArrowUp').closest('button');
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    
    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSend when onSubmit is not provided', () => {
    render(<InputBox onSend={mockOnSend} />);
    
    // Type a message
    const textarea = screen.getByPlaceholderText('What can I do for you?');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    // Click the send button
    const sendButton = screen.getByText('ArrowUp').closest('button');
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    
    // Check if onSend was called with the correct message
    expect(mockOnSend).toHaveBeenCalledWith('Hello world', { interruptFeedback: undefined });
  });
});

