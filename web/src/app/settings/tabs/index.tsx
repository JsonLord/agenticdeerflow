// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { FileText, Info, Settings, BotMessageSquare, type LucideIcon } from "lucide-react"; // Added BotMessageSquare for LLM tab


import { AboutTab } from "./about-tab";
import { GeneralTab } from "./general-tab";
import { LLMTab } from "./llm-tab"; // Import the new LLMTab
import { MCPTab } from "./mcp-tab";

export interface SettingsTab {
  name: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const tabs: SettingsTab[] = [
  {
    name: "General",
    icon: <Settings className="mr-2 h-4 w-4" />,
    content: <GeneralTab />,
  },
  {
    name: "LLMs", // New LLM Tab
    icon: <BotMessageSquare className="mr-2 h-4 w-4" />,
    content: <LLMTab />,
  },
  {
    name: "MCP",
    icon: <FileText className="mr-2 h-4 w-4" />,
    content: <MCPTab />,
  },
  {
    name: "About",
    icon: <Info className="mr-2 h-4 w-4" />,
    content: <AboutTab />,
  },
];

export const SETTINGS_TABS = [GeneralTab, LLMTab, MCPTab, AboutTab].map((tab) => {
  const name = tab.name ?? tab.displayName;
  return {
    ...tab,
    id: name.replace(/Tab$/, "").toLocaleLowerCase(),
    label: name.replace(/Tab$/, ""),
    icon: (tab.icon ?? <Settings />) as LucideIcon,
    component: tab,
  };
});
