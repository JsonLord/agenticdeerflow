import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputBox } from './input-box';
import * as storeModule from '~/core/store';

// Mock the store
vi.mock('~/core/store', () => {
  return {
    useStore: vi.fn(() => 'DIY Planner'),
    useSettingsStore: vi.fn(() => false),
    setEnableBackgroundInvestigation: vi.fn(),
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
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Check if onSubmit was called with the correct message
    expect(mockOnSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('does not call onSubmit when send button is clicked with empty message', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);
    
    // Click the send button without typing a message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('uses the selected persona from the store', () => {
    render(<InputBox onSubmit={mockOnSubmit} />);
    
    // Type a message
    const textarea = screen.getByPlaceholderText('What can I do for you?');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    // Click the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Check if the store was accessed to get the selected persona
    expect(storeModule.useStore).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalledWith('Hello world');
  });
});

