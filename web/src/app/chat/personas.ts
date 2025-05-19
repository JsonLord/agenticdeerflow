
// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { 
  type LucideIcon, 
  Brain, 
  SlidersHorizontal, 
  Zap,
  Apple, // Nutritionist
  Wrench, // DIY Planner
  TrendingUp, // Financial Analyst
  Puzzle, // Problem Solver
  PieChart, // Market Analyst
  Briefcase, // Business Developer
  Home, // Home Alternative Finder
  Stethoscope, // Medical Advisor
  GraduationCap, // Academic Researcher
  ShoppingCart, // Product and Price Finder
} from "lucide-react";

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
  {
    id: "nutritionist",
    name: "Nutritionist",
    description: "Acts as a Nutritionist to guide interactions and research on dietary topics.",
    icon: Apple,
  },
  {
    id: "diy_planner",
    name: "DIY Planner",
    description: "Assists with planning and researching DIY projects and tutorials.",
    icon: Wrench,
  },
  {
    id: "financial_analyst",
    name: "Financial Analyst",
    description: "Guides research related to finance, markets, and investments (information only).",
    icon: TrendingUp,
  },
  {
    id: "problem_solver",
    name: "Problem Solver",
    description: "Helps identify and research information related to solving problems.",
    icon: Puzzle,
  },
  {
    id: "market_analyst",
    name: "Market Analyst",
    description: "Focuses on research tasks for market analysis, trends, and competitive landscapes.",
    icon: PieChart,
  },
  {
    id: "business_developer",
    name: "Business Developer",
    description: "Aids in research for business development, partnerships, and strategic growth.",
    icon: Briefcase,
  },
  {
    id: "home_alternative",
    name: "Home Alternative Finder",
    description: "Assists in finding alternatives for home products, services, or solutions.",
    icon: Home,
  },
  {
    id: "medical_advisor",
    name: "Medical Advisor (Info Only)",
    description: "Facilitates research for general information on medical topics (not advice).",
    icon: Stethoscope,
  },
  {
    id: "academic_researcher",
    name: "Academic Researcher",
    description: "Supports academic inquiry by focusing on scholarly sources and research.",
    icon: GraduationCap,
  },
  {
    id: "product_price_finder",
    name: "Product & Price Finder",
    description: "Helps research products, compare prices, and gather product information.",
    icon: ShoppingCart,
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

