"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  closeResearch,
  openResearch,
  sendMessage,
  useLastInterruptMessage,
  useStore,
} from "~/core/store";

import { ConversationStarter } from "./components/conversation-starter";
import { InputBox } from "./components/input-box";
import { MessageListView } from "./components/message-list-view";
import { PersonaCarouselFrame } from "./components/PersonaCarouselFrame";
import { ResearchBlock } from "./components/research-block";

interface MainProps {
  onOpenCoordinatorFeedbackModal?: () => void;
}

export default function Main({ onOpenCoordinatorFeedbackModal }: MainProps) {
  const responding = useStore((state) => state.responding);
  const messageIds = useStore(useShallow((state) => state.messageIds));
  const openResearchId = useStore((state) => state.openResearchId);
  const lastInterruptMessage = useLastInterruptMessage();
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);

  const waitingForFeedback = lastInterruptMessage != null;
  const feedbackContext = lastInterruptMessage?.interruptFeedback;

  const handleSubmit = (value: string) => {
    // Log the selected persona ID for debugging
    console.log("Submitting with selected persona:", selectedPersonaId);
    void sendMessage(value);
  };

  const handleInterrupt = (feedback: string) => {
    void sendMessage(undefined, { interruptFeedback: feedback });
  };

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  }, [messageIds]);

  return (
    <main className="relative flex h-full w-full max-w-4xl flex-1 flex-col items-center justify-center overflow-hidden pt-12">
      <div
        ref={mainContentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full pb-[200px] scroll-smooth"
      >
        {messageIds.length === 0 ? (
          <>
            <ConversationStarter onSubmit={handleSubmit} />
          </>
        ) : (
          <MessageListView
            messageIds={messageIds}
            responding={responding}
            waitingForFeedback={waitingForFeedback}
            onInterrupt={handleInterrupt}
            onOpenResearch={openResearch}
          />
        )}
      </div>
      <div className="fixed bottom-0 w-full max-w-4xl p-4 space-y-3">
        <InputBox
          responding={responding}
          waitingForFeedback={waitingForFeedback}
          feedbackContext={feedbackContext}
          onSubmit={handleSubmit}
          onInterrupt={handleInterrupt}
          onOpenCoordinatorFeedbackModal={onOpenCoordinatorFeedbackModal}
        />
        <PersonaCarouselFrame />
      </div>
      {openResearchId && (
        <ResearchBlock
          researchId={openResearchId}
          onClose={closeResearch}
          isStreaming={responding}
        />
      )}
    </main>
  );
}

