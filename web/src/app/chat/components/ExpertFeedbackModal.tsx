
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "~/core/store";

// TypeScript interface mirroring backend Pydantic model ExpertFeedbackResponse
interface ExpertFeedbackData {
  process_judgment: string;
  current_beliefs: string[];
  challenging_viewpoints: string[];
  further_research_questions: string[];
  raw_llm_output: string;
}

interface ExpertFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string; // Prop for display purposes, fetching uses store's threadId
}

export const ExpertFeedbackModal: React.FC<ExpertFeedbackModalProps> = ({
  isOpen,
  onClose,
  threadId: displayThreadId, // Renamed to avoid confusion
}) => {
  const [feedbackData, setFeedbackData] = useState<ExpertFeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const threadIdFromStore = useStore((state) => state.threadId);

  const fetchExpertFeedback = useCallback(async () => {
    if (!threadIdFromStore) {
      setFetchError("Thread ID is not available from the store for fetching feedback.");
      setFeedbackData(null);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/expert_feedback/${threadIdFromStore}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch expert feedback" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data: ExpertFeedbackData = await response.json();
      setFeedbackData(data);
    } catch (error) {
      console.error("Failed to fetch expert feedback:", error);
      setFetchError(error instanceof Error ? error.message : "An unknown error occurred while fetching feedback.");
      setFeedbackData(null);
    } finally {
      setIsLoading(false);
    }
  }, [threadIdFromStore]);

  useEffect(() => {
    if (isOpen && threadIdFromStore) {
      fetchExpertFeedback();
    }
    // Reset data when modal is closed to ensure fresh data on reopen
    if (!isOpen) {
      setFeedbackData(null);
      setFetchError(null);
      setIsLoading(false);
    }
  }, [isOpen, threadIdFromStore, fetchExpertFeedback]);

  const handleRefresh = () => {
    fetchExpertFeedback();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[70vw] md:max-w-[60vw] lg:max-w-[50vw] h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Expert Feedback & Analysis</DialogTitle>
          <DialogDescription>
            Review critical feedback and strategic insights on the current research process.
            {displayThreadId && <span className="block text-xs mt-1">Thread ID: {displayThreadId}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4 border rounded-md my-4 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p>Loading expert feedback...</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center text-destructive p-4">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="font-semibold">Error loading feedback:</p>
              <p className="text-sm text-center">{fetchError}</p>
            </div>
          ) : feedbackData ? (
            <div className="space-y-4 text-sm text-left w-full"> {/* Ensure text is aligned left and takes full width */}
              <div>
                <h3 className="font-semibold text-base mb-1 text-gray-800 dark:text-gray-200">Process Judgment</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{feedbackData.process_judgment || "Not provided."}</p>
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1 text-gray-800 dark:text-gray-200">Current Beliefs & Conclusions</h3>
                {feedbackData.current_beliefs && feedbackData.current_beliefs.length > 0 ? (
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    {feedbackData.current_beliefs.map((belief, index) => (
                      <li key={`belief-${index}`}>{belief}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">No specific beliefs or conclusions identified.</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1 text-gray-800 dark:text-gray-200">Challenging Viewpoints & Alternative Perspectives</h3>
                {feedbackData.challenging_viewpoints && feedbackData.challenging_viewpoints.length > 0 ? (
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    {feedbackData.challenging_viewpoints.map((viewpoint, index) => (
                      <li key={`viewpoint-${index}`}>{viewpoint}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">No challenging viewpoints provided.</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1 text-gray-800 dark:text-gray-200">Further Research Questions</h3>
                {feedbackData.further_research_questions && feedbackData.further_research_questions.length > 0 ? (
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    {feedbackData.further_research_questions.map((question, index) => (
                      <li key={`question-${index}`}>{question}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">No further research questions suggested.</p>
                )}
              </div>
              {/*
                Optional: Keep a way to view raw output for debugging if needed,
                perhaps behind a toggle or in a collapsible section. 
                For now, removed for clarity in the main view.
                <details className="mt-4 text-xs">
                  <summary className="text-muted-foreground cursor-pointer">View Raw LLM Output</summary>
                  <pre className="mt-1 p-2 bg-muted rounded max-h-[100px] overflow-auto whitespace-pre-wrap">
                    {feedbackData.raw_llm_output}
                  </pre>
                </details>
              */}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Click Refresh to load expert feedback.
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Feedback
          </Button>
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
