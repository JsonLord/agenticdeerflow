
// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { type MCPServer } from "../mcp";

// LLM Configuration Types
export type LLMProvider = "openai" | "azure" | "ollama" | "openai_compatible" | "";

export interface LLMProviderConfigBase {
  provider: LLMProvider;
  model_name?: string; // Model name or deployment name for Azure
  api_key?: string; // Optional, as it might be set via ENV
  // Common optional parameters, allow null to signify "use provider default" or "unset"
  temperature?: number | null;
  max_tokens?: number | null;
  top_p?: number | null;
}

export interface OpenAIConfig extends LLMProviderConfigBase {
  provider: "openai";
  base_url?: string; // Optional OpenAI base URL
}

export interface AzureOpenAIConfig extends LLMProviderConfigBase {
  provider: "azure";
  api_version?: string;
  base_url?: string; // Azure endpoint (maps to azure_endpoint in LangChain)
}

export interface OllamaConfig extends LLMProviderConfigBase {
  provider: "ollama";
  base_url?: string; // Ollama server URL
}

export interface OpenAICompatibleConfig extends LLMProviderConfigBase {
  provider: "openai_compatible";
  base_url?: string; // Base URL for the OpenAI-compatible API
}

// Represents "not configured" or "use default from conf.yaml"
export interface NotConfiguredLLM {
  provider: "";
  // Ensure other optional fields from LLMProviderConfigBase are also optional here if needed
  // for type compatibility, though they wouldn't be used for "not configured".
  model_name?: string;
  api_key?: string;
  temperature?: number | null;
  max_tokens?: number | null;
  top_p?: number | null;
}

export type LLMProviderConfig =
  | OpenAIConfig
  | AzureOpenAIConfig
  | OllamaConfig
  | OpenAICompatibleConfig
  | NotConfiguredLLM;

export type LLMRole = "basic" | "reasoning" | "vision";

export interface LLMRoleConfigurations {
  basic?: LLMProviderConfig;
  reasoning?: LLMProviderConfig;
  vision?: LLMProviderConfig;
}
// End LLM Configuration Types

export interface SettingsState {
  autoAcceptedPlan: boolean;
  maxPlanIterations: number;
  maxStepNum: number;
  maxSearchResults: number;
  mcpServers: MCPServer[];
  enableBackgroundInvestigation: boolean;
  llmConfigurations: LLMRoleConfigurations; // New field
  actions: {
    loadSettings: () => void;
    saveSettings: (settings: Partial<Omit<SettingsState, "actions">>) => void;
    changeSettings: (settings: Partial<Omit<SettingsState, "actions">>) => void;
    addMCPServer: (server: MCPServer) => void;
    removeMCPServer: (id: string) => void;
    updateMCPServer: (server: MCPServer) => void;
  };
}

export const SETTINGS_KEY = "deerflow-settings";

export const DEFAULT_SETTINGS: Omit<SettingsState, "actions"> = {
  autoAcceptedPlan: false,
  maxPlanIterations: 1,
  maxStepNum: 3,
  maxSearchResults: 3,
  mcpServers: [],
  enableBackgroundInvestigation: true,
  llmConfigurations: { 
    basic: { provider: "" }, 
    reasoning: { provider: "" },
    vision: { provider: "" },
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      actions: {
        loadSettings: () => {
          const storedSettings = localStorage.getItem(SETTINGS_KEY);
          if (storedSettings) {
            try {
              const parsed = JSON.parse(storedSettings);
              const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...parsed,
                llmConfigurations: {
                  basic: { 
                    ...DEFAULT_SETTINGS.llmConfigurations.basic, 
                    ...(parsed.llmConfigurations?.basic || {}) 
                  } as LLMProviderConfig,
                  reasoning: { 
                    ...DEFAULT_SETTINGS.llmConfigurations.reasoning, 
                    ...(parsed.llmConfigurations?.reasoning || {}) 
                  } as LLMProviderConfig,
                  vision: { 
                    ...DEFAULT_SETTINGS.llmConfigurations.vision, 
                    ...(parsed.llmConfigurations?.vision || {}) 
                  } as LLMProviderConfig,
                },
              };
              set(mergedSettings);
            } catch (e) {
              console.error("Failed to parse settings from localStorage", e);
              set(DEFAULT_SETTINGS);
            }
          } else {
            set(DEFAULT_SETTINGS);
          }
        },
        saveSettings: (settings) => {
          const currentSettings = { ...get() };
          delete (currentSettings as any).actions;
          
          let newLlmConfigs = currentSettings.llmConfigurations;
          if (settings.llmConfigurations) {
            newLlmConfigs = {
              basic: { ...currentSettings.llmConfigurations.basic, ...settings.llmConfigurations.basic } as LLMProviderConfig,
              reasoning: { ...currentSettings.llmConfigurations.reasoning, ...settings.llmConfigurations.reasoning } as LLMProviderConfig,
              vision: { ...currentSettings.llmConfigurations.vision, ...settings.llmConfigurations.vision } as LLMProviderConfig,
            };
          }

          const newSettings = { 
            ...currentSettings, 
            ...settings,
            llmConfigurations: newLlmConfigs,
          };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
          set(newSettings);
        },
        changeSettings: (settings) => {
          const currentFullState = get();
          const updatedSettings: Partial<Omit<SettingsState, "actions">> = { ...settings };

          if (settings.llmConfigurations) {
            updatedSettings.llmConfigurations = {
              basic: { ...currentFullState.llmConfigurations.basic, ...settings.llmConfigurations.basic } as LLMProviderConfig,
              reasoning: { ...currentFullState.llmConfigurations.reasoning, ...settings.llmConfigurations.reasoning } as LLMProviderConfig,
              vision: { ...currentFullState.llmConfigurations.vision, ...settings.llmConfigurations.vision } as LLMProviderConfig,
            };
          }
          
          set((state) => ({ ...state, ...updatedSettings }));
          
          const stateToPersist = { ...get() };
          delete (stateToPersist as any).actions;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(stateToPersist));
        },
        addMCPServer: (server) =>
          set((state) => ({ mcpServers: [...state.mcpServers, server] })),
        removeMCPServer: (id) =>
          set((state) => ({
            mcpServers: state.mcpServers.filter((s) => s.id !== id),
          })),
        updateMCPServer: (server) =>
          set((state) => ({
            mcpServers: state.mcpServers.map((s) =>
              s.id === server.id ? server : s,
            ),
          })),
      },
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { actions, ...rest } = state;
        return rest;
      },
    },
  ),
);

// Call loadSettings once when the store is initialized
// This is typically done in a top-level component like _app.tsx or layout.tsx
// For now, we can call it here, but it might run multiple times if store is re-imported.
// A better place is in a useEffect in a layout component.
// useSettingsStore.getState().actions.loadSettings();
