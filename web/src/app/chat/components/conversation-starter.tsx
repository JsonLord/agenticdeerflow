// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import React from "react";
import { motion } from "framer-motion";

import { cn } from "~/lib/utils";

const questions = [
  "How many times taller is the Eiffel Tower than the tallest building in the world?",
  "How many years does an average Tesla battery last compared to a gasoline engine?",
  "How many liters of water are required to produce 1 kg of beef?",
  "How many times faster is the speed of light compared to the speed of sound?",
];
export function ConversationStarter({
  className,
  onSend,
  onSubmit,
}: {
  className?: string;
  onSend?: (message: string) => void;
  onSubmit?: (message: string) => void; // Add onSubmit prop
}) {
  // Use onSubmit if provided, otherwise fall back to onSend
  const handleQuestionClick = (question: string) => {
    if (onSubmit) {
      console.log("ConversationStarter: Using onSubmit with question:", question);
      onSubmit(question);
    } else if (onSend) {
      console.log("ConversationStarter: Using onSend with question:", question);
      onSend(question);
    } else {
      console.warn("ConversationStarter: No handler provided for question click");
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ul className="flex flex-wrap">
        {questions.map((question, index) => (
          <motion.li
            key={question}
            className="flex w-1/2 shrink-0 p-2 active:scale-105"
            style={{ transition: "all 0.2s ease-out" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.2,
              delay: index * 0.1 + 0.5,
              ease: "easeOut",
            }}
          >
            <div
              className="bg-card text-muted-foreground cursor-pointer rounded-2xl border px-4 py-4 opacity-75 transition-all duration-300 hover:opacity-100 hover:shadow-md"
              onClick={() => {
                handleQuestionClick(question);
              }}
            >
              {question}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
