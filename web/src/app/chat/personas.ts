
// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { type LucideIcon, Brain, SlidersHorizontal, Zap } from "lucide-react";

export interface Persona {
  id: string; // Corresponds to the MD filename without .md
  name: string;
  description: string;
  icon?: LucideIcon;
}

export const coordinatorPersonas: Persona[] = [
  {
    id: "default",
    name: "Default Assistant",
    description: "A friendly and general-purpose AI assistant for handling various requests.",
    icon: Zap,
  },
  {
    id: "analytical_researcher",
    name: "Analytical Researcher",
    description: "Meticulously analyzes requests, seeks clarity, and defines precise research objectives.",
    icon: SlidersHorizontal,
  },
  {
    id: "creative_brainstormer",
    name: "Creative Brainstormer",
    description: "Explores queries imaginatively, suggests related concepts, and broadens inquiry.",
    icon: Brain,
  },
  // Add more personas here as new .md files are created
  // e.g., { id: "concise_summarizer", name: "Concise Summarizer", description: "...", icon: SomeIcon }
];

export const getDefaultPersonaId = (): string => {
    // Ensures that if the array is empty or 'default' is not first, it still tries to return 'default'
    const defaultPersona = coordinatorPersonas.find(p => p.id === "default");
    if (defaultPersona) {
        return defaultPersona.id;
    }
    // Fallback if 'default' is not found (should not happen with current data)
    return coordinatorPersonas.length > 0 ? coordinatorPersonas[0].id : "default";
};
