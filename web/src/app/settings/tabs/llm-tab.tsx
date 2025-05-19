// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquare, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { SettingsState, LLMProviderConfig } from "~/core/store";

import type { Tab } from "./types";

// Available models for each provider
const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
];

const AZURE_MODELS = [
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
];

const OLLAMA_MODELS = [
  "llama3",
  "llama2",
  "mistral",
  "mixtral",
  "phi",
];

// Define the form schema
const llmFormSchema = z.object({
  provider: z.enum(["", "openai", "azure", "ollama", "openai_compatible"]),
  model_name: z.string().optional(),
  api_key: z.string().optional(),
  base_url: z.string().optional(),
});

export const LLMTab: Tab = ({
  settings,
  onChange,
}: {
  settings: SettingsState;
  onChange: (changes: Partial<SettingsState>) => void;
}) => {
  // Get the current LLM configuration
  const currentConfig = settings.llmConfigurations?.basic || { provider: "" };
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const form = useForm<z.infer<typeof llmFormSchema>>({
    resolver: zodResolver(llmFormSchema),
    defaultValues: {
      provider: currentConfig.provider || "",
      model_name: currentConfig.model_name || "",
      api_key: currentConfig.api_key || "",
      base_url: (currentConfig as any).base_url || "",
    },
    mode: "all",
    reValidateMode: "onBlur",
  });

  const watchProvider = form.watch("provider");

  // Update form when settings change
  useEffect(() => {
    form.reset({
      provider: currentConfig.provider || "",
      model_name: currentConfig.model_name || "",
      api_key: currentConfig.api_key || "",
      base_url: (currentConfig as any).base_url || "",
    });
  }, [currentConfig, form]);

  // Get available models based on selected provider
  const getAvailableModels = () => {
    switch (watchProvider) {
      case "openai":
        return OPENAI_MODELS;
      case "azure":
        return AZURE_MODELS;
      case "ollama":
        return OLLAMA_MODELS;
      default:
        return [];
    }
  };

  const handleUpdateSettings = () => {
    const values = form.getValues();
    
    if (!values.provider) {
      toast.error("Provider Required", {
        description: "Please select an LLM provider before updating settings.",
      });
      return;
    }

    // Create a new LLM configuration based on form values
    const newConfig: LLMProviderConfig = {
      provider: values.provider as any,
      model_name: values.model_name,
      api_key: values.api_key,
    };

    // Add base_url if applicable
    if (values.base_url && ["openai", "azure", "ollama", "openai_compatible"].includes(values.provider)) {
      (newConfig as any).base_url = values.base_url;
    }

    // Update all LLM roles with the same configuration
    const newLLMConfigurations = {
      basic: newConfig,
      reasoning: newConfig,
      vision: newConfig,
    };

    onChange({ llmConfigurations: newLLMConfigurations });
    
    // Show success message
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-medium">LLM Configuration</h1>
        <p className="text-muted-foreground text-sm">
          Configure the Large Language Model settings for DeerFlow.
        </p>
      </header>
      
      {showSuccessMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription>
            LLM successfully configured
          </AlertDescription>
        </Alert>
      )}
      
      <main>
        <Form {...form}>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LLM Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-60">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Default (System Config)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="azure">Azure OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="openai_compatible">OpenAI Compatible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the LLM provider you want to use.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchProvider && (
              <>
                <FormField
                  control={form.control}
                  name="model_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      {getAvailableModels().length > 0 ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-60">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableModels().map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input
                            className="w-60"
                            placeholder="Enter model name"
                            {...field}
                          />
                        </FormControl>
                      )}
                      <FormDescription>
                        Select or enter the model you want to use.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input
                          className="w-60"
                          type="password"
                          placeholder="Enter your API key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your API key will be stored locally and never sent to our servers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {["openai", "azure", "ollama", "openai_compatible"].includes(watchProvider) && (
                  <FormField
                    control={form.control}
                    name="base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchProvider === "azure"
                            ? "Azure Endpoint"
                            : watchProvider === "ollama"
                            ? "Ollama Server URL"
                            : "Base URL"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="w-60"
                            placeholder={
                              watchProvider === "azure"
                                ? "https://your-resource.openai.azure.com"
                                : watchProvider === "ollama"
                                ? "http://localhost:11434"
                                : "https://api.openai.com/v1"
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {watchProvider === "azure"
                            ? "Your Azure OpenAI endpoint URL"
                            : watchProvider === "ollama"
                            ? "URL of your Ollama server"
                            : "Custom base URL for API requests (optional)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button 
                  type="button" 
                  onClick={handleUpdateSettings}
                  className="mt-4"
                >
                  Update LLM Settings
                </Button>
              </>
            )}
          </form>
        </Form>
      </main>
    </div>
  );
};

LLMTab.icon = BotMessageSquare;
