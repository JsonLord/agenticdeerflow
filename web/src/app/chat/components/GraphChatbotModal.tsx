"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useStore } from "~/core/store"; // To get the threadId

interface GraphChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string; // Prop for display, actual threadId for API comes from store
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
  isError?: boolean;
}

export const GraphChatbotModal: React.FC<GraphChatbotModalProps> = ({
  isOpen,
  onClose,
  threadId: displayThreadId, // Renamed to avoid confusion
}) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For overall API call loading state
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const threadIdFromStore = useStore((state) => state.threadId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim() === "" || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue,
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    const botLoadingMessageId = `bot-loading-${Date.now()}`;
    setMessages(prev => [...prev, { id: botLoadingMessageId, sender: 'bot', text: "Thinking...", isLoading: true }]);

    try {
      if (!threadIdFromStore) {
        throw new Error("Thread ID is not available.");
      }

      const response = await fetch('/api/graph_chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadIdFromStore,
          user_question: currentInput,
        }),
      });

      setMessages(prev => prev.filter(msg => msg.id !== botLoadingMessageId)); // Remove loading message

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to get a response from the chatbot." }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const responseData: { answer: string } = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseData.answer,
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Graph chatbot API error:", error);
      setMessages(prev => prev.filter(msg => msg.id !== botLoadingMessageId)); // Remove loading message
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        sender: 'bot',
        text: error instanceof Error ? error.message : "Sorry, I couldn't process your question.",
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, threadIdFromStore]);

  // Reset messages when modal is closed or threadId changes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputValue("");
      setIsLoading(false);
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat about Workflow Graph</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto p-4 border rounded-md my-4 space-y-3 flex flex-col bg-muted/20">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground m-auto">
              Ask a question about the current workflow graph.
              {displayThreadId && <span className="block text-xs mt-1">(Thread: {displayThreadId})</span>}
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-[85%] break-words shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white self-end ml-auto' 
                    : msg.isError 
                      ? 'bg-red-100 text-red-700 self-start mr-auto'
                      : 'bg-white text-gray-800 self-start mr-auto border border-gray-200'
                }`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center space-x-2 p-2 border-t">
          <Input
            type="text"
            placeholder="Ask about the graph..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} size="icon" aria-label="Send message" disabled={isLoading || inputValue.trim() === ""}>
            {isLoading && messages.some(m => m.isLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter className="sm:justify-end mt-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
