// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { GithubOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Spline, MessageSquareText, Lightbulb } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useStore } from "~/core/store";

import { Logo } from "../../components/deer-flow/logo";
import { ThemeToggle } from "../../components/deer-flow/theme-toggle";
import { Tooltip } from "../../components/deer-flow/tooltip";
import { SettingsDialog } from "../settings/dialogs/settings-dialog";
import { KnowledgeGraphModal } from "./components/knowledge-graph-modal";
import { GraphChatbotModal } from "./components/GraphChatbotModal";
import { CoordinatorFeedbackModal } from "./components/CoordinatorFeedbackModal";
// import { ExpertFeedbackModal } from "./components/ExpertFeedbackModal"; // Will be imported in next task

const Main = dynamic(() => import("./main"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      Loading DeerFlow...
    </div>
  ),
});

export default function HomePage() {
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isGraphChatbotModalOpen, setIsGraphChatbotModalOpen] = useState(false);
  const [isCoordinatorFeedbackModalOpen, setIsCoordinatorFeedbackModalOpen] = useState(false);
  const [isExpertFeedbackModalOpen, setIsExpertFeedbackModalOpen] = useState(false);
  const threadId = useStore((state) => state.threadId);

  // Function to pass down to open the feedback modal
  const openCoordinatorFeedbackModal = () => setIsCoordinatorFeedbackModalOpen(true);

  return (
    <div className="flex h-screen w-screen justify-center overscroll-none">
      <header className="fixed top-0 left-0 flex h-12 w-full items-center justify-between px-4">
        <Logo />
        <div className="flex items-center">
          <Tooltip title="Star DeerFlow on GitHub">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com/bytedance/deer-flow"
                target="_blank"
              >
                <GithubOutlined />
              </Link>
            </Button>
          </Tooltip>
          <Tooltip title="View Workflow Graph">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGraphModalOpen(true)}
            >
              <Spline />
            </Button>
          </Tooltip>
          <Tooltip title="Chat about Workflow Graph">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGraphChatbotModalOpen(true)}
            >
              <MessageSquareText />
            </Button>
          </Tooltip>
          <Tooltip title="Get Expert Feedback">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpertFeedbackModalOpen(true)}
            >
              <Lightbulb />
            </Button>
          </Tooltip>
          <ThemeToggle />
          <Suspense>
            <SettingsDialog />
          </Suspense>
        </div>
      </header>
      {/* 
        Pass openCoordinatorFeedbackModal to Main. 
        Main will need to be updated to accept this prop and pass it to InputBox.
        This change to Main.tsx is outside the scope of this specific Plandex response
        if Main.tsx is not in context.
      */}
      <Main onOpenCoordinatorFeedbackModal={openCoordinatorFeedbackModal} />
      <KnowledgeGraphModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        threadId={threadId}
      />
      <GraphChatbotModal
        isOpen={isGraphChatbotModalOpen}
        onClose={() => setIsGraphChatbotModalOpen(false)}
        threadId={threadId}
      />
      <CoordinatorFeedbackModal
        isOpen={isCoordinatorFeedbackModalOpen}
        onClose={() => setIsCoordinatorFeedbackModalOpen(false)}
      />
      {/* Placeholder for ExpertFeedbackModal - will be added in the next task */}
      {/* <ExpertFeedbackModal
            isOpen={isExpertFeedbackModalOpen}
            onClose={() => setIsExpertFeedbackModalOpen(false)}
            threadId={threadId}
          /> */}
    </div>
  );
}
