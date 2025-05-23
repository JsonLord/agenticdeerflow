// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X, ThumbsUp } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Detective } from "~/components/deer-flow/icons/detective";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { Button } from "~/components/ui/button";
import type { Option } from "~/core/messages";
import {
  setEnableBackgroundInvestigation,
  useSettingsStore,
  useStore,
} from "~/core/store";
import { cn } from "~/lib/utils";

export function InputBox({
  className,
  size,
  responding,
  feedback,
  onSend,
  onCancel,
  onRemoveFeedback,
  onOpenCoordinatorFeedbackModal,
  waitingForFeedback,
  feedbackContext,
  onSubmit,
  onInterrupt,
}: {
  className?: string;
  size?: "large" | "normal";
  responding?: boolean;
  feedback?: { option: Option } | null;
  waitingForFeedback?: boolean;
  feedbackContext?: string;
  onSend?: (message: string, options?: { interruptFeedback?: string }) => void;
  onSubmit?: (message: string) => void;
  onInterrupt?: (feedback: string) => void;
  onCancel?: () => void;
  onRemoveFeedback?: () => void;
  onOpenCoordinatorFeedbackModal?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [imeStatus, setImeStatus] = useState<"active" | "inactive">("inactive");
  const [indent, setIndent] = useState(0);
  
  // Get the selected persona ID from the store
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);
  
  const backgroundInvestigation = useSettingsStore(
    (state) => state.enableBackgroundInvestigation,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedback) {
      setMessage("");

      setTimeout(() => {
        if (feedbackRef.current) {
          setIndent(feedbackRef.current.offsetWidth);
        }
      }, 200);
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [feedback]);

  const handleSendMessage = useCallback(() => {
    if (responding) {
      onCancel?.();
      return;
    }
    
    if (message.trim() === "") {
      console.warn("InputBox: Attempted to send empty message");
      return;
    }
    
    console.log("InputBox: Sending message:", message);
    console.log("InputBox: Using selected persona:", selectedPersonaId);
    
    // Use onSubmit if available (from Main component)
    if (onSubmit) {
      console.log("InputBox: Using onSubmit handler");
      onSubmit(message);
      setMessage("");
      return;
    }
    
    // Fallback to onSend
    if (onSend) {
      console.log("InputBox: Using onSend handler");
      onSend(message, {
        interruptFeedback: feedback?.option.value,
      });
      setMessage("");
      onRemoveFeedback?.();
      return;
    }
    
    console.warn("InputBox: No handler provided for sending messages");
  }, [responding, onCancel, message, onSend, onSubmit, feedback, onRemoveFeedback, selectedPersonaId]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (responding) {
        return;
      }
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        imeStatus === "inactive"
      ) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [responding, imeStatus, handleSendMessage],
  );

  return (
    <div className={cn("bg-card relative rounded-[24px] border", className)}>
      <div className="w-full">
        <AnimatePresence>
          {feedback && (
            <motion.div
              ref={feedbackRef}
              className="bg-background border-brand absolute top-0 left-0 mt-3 ml-2 flex items-center justify-center gap-1 rounded-2xl border px-2 py-0.5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="text-brand flex h-full w-full items-center justify-center text-sm opacity-90">
                {feedback.option.text}
              </div>
              <X
                className="cursor-pointer opacity-60"
                size={16}
                onClick={onRemoveFeedback}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <textarea
          ref={textareaRef}
          className={cn(
            "m-0 w-full resize-none border-none px-4 py-3 text-lg",
            size === "large" ? "min-h-32" : "min-h-4",
          )}
          style={{ textIndent: feedback ? `${indent}px` : 0 }}
          placeholder={
            feedback
              ? `Describe how you ${feedback.option.text.toLocaleLowerCase()}?`
              : "What can I do for you?"
          }
          value={message}
          onCompositionStart={() => setImeStatus("active")}
          onCompositionEnd={() => setImeStatus("inactive")}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
      </div>
      <div className="flex items-center px-4 py-2">
        <div className="flex grow items-center gap-2">
          <Tooltip
            className="max-w-60"
            title={
              <div>
                <h3 className="mb-2 font-bold">
                  Investigation Mode: {backgroundInvestigation ? "On" : "Off"}
                </h3>
                <p>
                  When enabled, DeerFlow will perform a quick search before
                  planning. This is useful for researches related to ongoing
                  events and news.
                </p>
                <p className="mt-2">
                  Selected Mode: {selectedPersonaId}
                </p>
              </div>
            }
          >
            <Button
              className={cn(
                "rounded-2xl",
                backgroundInvestigation && "!border-brand !text-brand",
              )}
              variant="outline"
              size="lg"
              onClick={() => {
                setEnableBackgroundInvestigation(!backgroundInvestigation);
                console.log("Current selected persona:", selectedPersonaId);
              }}
            >
              <Detective /> Investigation
            </Button>
          </Tooltip>
          <Tooltip title="Feedback on Coordinator">
            <Button
              variant="ghost"
              size="icon"

              onClick={() => {
                if (onOpenCoordinatorFeedbackModal) {
                  onOpenCoordinatorFeedbackModal();
                } else {
                  // This else case is unlikely if prop is always passed by Main
                  console.warn("onOpenCoordinatorFeedbackModal not provided to InputBox");
                }
              }}
    
              className="text-muted-foreground hover:text-accent-foreground"
              aria-label="Feedback on Coordinator"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip title={responding ? "Stop" : "Send"}>
            <Button
              variant="outline"
              size="icon"
              className={cn("h-10 w-10 rounded-full")}
              onClick={handleSendMessage}
            >
              {responding ? (
                <div className="flex h-10 w-10 items-center justify-center">
                  <div className="bg-foreground h-4 w-4 rounded-sm opacity-70" />
                </div>
              ) : (
                <ArrowUp />
              )}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
