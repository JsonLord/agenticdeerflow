
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form"; // Removed FormProvider as we use form directly
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

import { 
  useSettingsStore, 
  LLMRole, 
  LLMProvider, 
  LLMProviderConfig,
  LLMRoleConfigurations,
  DEFAULT_SETTINGS,
  OpenAIConfig,
  AzureOpenAIConfig,
  OllamaConfig,
  OpenAICompatibleConfig,
  NotConfiguredLLM,
} from "~/core/store/settings-store";

const llmRoles: { value: LLMRole; label: string }[] = [
  { value: "basic", label: "Basic Model" },
  { value: "reasoning", label: "Reasoning Model" },
  { value: "vision", label: "Vision Model" },
];

const llmProvidersList: { value: LLMProvider; label: string }[] = [
  { value: "", label: "Default (from conf.yaml)" },
  { value: "openai", label: "OpenAI" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "ollama", label: "Ollama" },
  { value: "openai_compatible", label: "Other OpenAI-Compatible" },
];

// Zod schema for validation
const llmConfigSchemaBase = z.object({
  provider: z.custom<LLMProvider>(), // Use z.custom for the union type
  model_name: z.string().optional().nullable(),
  api_key: z.string().optional().nullable(),
  base_url: z.string().optional().nullable(),
  api_version: z.string().optional().nullable(), // Azure specific
  temperature: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || isNaN(parseFloat(String(val)))) ? null : parseFloat(String(val)),
    z.number().min(0).max(2).optional().nullable()
  ),
  max_tokens: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || isNaN(parseInt(String(val), 10))) ? null : parseInt(String(val), 10),
    z.number().int().positive().optional().nullable()
  ),
  top_p: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || isNaN(parseFloat(String(val)))) ? null : parseFloat(String(val)),
    z.number().min(0).max(1).optional().nullable()
  ),
});

export function LLMTab() {
  const [selectedRole, setSelectedRole] = useState<LLMRole>("basic");
  const { llmConfigurations, actions } = useSettingsStore();

  const form = useForm<LLMProviderConfig>({
    resolver: zodResolver(llmConfigSchemaBase),
    // Initialize with default for the selected role, or the very default if not found
    defaultValues: llmConfigurations[selectedRole] || DEFAULT_SETTINGS.llmConfigurations[selectedRole] || { provider: "" },
  });

  const watchedProvider = form.watch("provider");

  // Effect to reset form when selectedRole changes or when initial llmConfigurations are loaded
  useEffect(() => {
    const currentConfigForRole = llmConfigurations[selectedRole] || DEFAULT_SETTINGS.llmConfigurations[selectedRole] || { provider: "" };
    form.reset(currentConfigForRole);
  }, [selectedRole, llmConfigurations, form]);

  // Effect to save changes to store when any form field changes
  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
      if (type === 'change' && name) { // Ensure it's a user change and a field name exists
        const fieldName = name as keyof LLMProviderConfig;
        let fieldValue = values[fieldName];

        // Handle numeric conversions for specific fields
        if (fieldName === 'temperature' || fieldName === 'top_p') {
          fieldValue = (values[fieldName] === "" || values[fieldName] === null || values[fieldName] === undefined || isNaN(parseFloat(String(values[fieldName])))) 
                       ? null 
                       : parseFloat(String(values[fieldName]));
        } else if (fieldName === 'max_tokens') {
          fieldValue = (values[fieldName] === "" || values[fieldName] === null || values[fieldName] === undefined || isNaN(parseInt(String(values[fieldName]), 10))) 
                       ? null 
                       : parseInt(String(values[fieldName]), 10);
        }
        
        const updatedRoleConfig = { ...form.getValues(), [fieldName]: fieldValue };

        const newConfigurations: LLMRoleConfigurations = {
          ...llmConfigurations,
          [selectedRole]: updatedRoleConfig as LLMProviderConfig,
        };
        actions.changeSettings({ llmConfigurations: newConfigurations });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, llmConfigurations, selectedRole, actions]);

  const handleResetRoleToDefault = useCallback(() => {
    if (selectedRole) {
      const newConfigurations: LLMRoleConfigurations = {
        ...llmConfigurations,
        [selectedRole]: { 
          ...(DEFAULT_SETTINGS.llmConfigurations[selectedRole] || { provider: "" }),
        } as LLMProviderConfig,
      };
      actions.changeSettings({ llmConfigurations: newConfigurations });
      // The form.reset in the useEffect watching llmConfigurations will handle updating the form fields.
    }
  }, [selectedRole, llmConfigurations, actions]);

  const renderProviderFields = (provider: LLMProvider) => {
    if (provider === "") {
      return <p className="text-sm text-muted-foreground p-4 text-center">Using default LLM configuration from backend (conf.yaml).</p>;
    }

    return (
      <div className="space-y-4 mt-4 p-4 border rounded-md">
        <FormField
          control={form.control}
          name="model_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Name {provider === "azure" ? "(Deployment Name)" : ""}</FormLabel>
              <FormControl>
                <Input placeholder={provider === "azure" ? "e.g., gpt-35-turbo-deployment" : "e.g., gpt-3.5-turbo"} {...field} value={field.value ?? ""} />
              </FormControl>
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
                <Input type="password" placeholder="Leave blank to use environment variable" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Optional. If not set, the backend will try to use environment variables.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {(provider === "openai" || provider === "ollama" || provider === "openai_compatible" || provider === "azure") && (
          <FormField
            control={form.control}
            name="base_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {provider === "azure" ? "Azure Endpoint URL" : 
                   provider === "ollama" ? "Ollama Base URL" : 
                   "API Base URL"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      provider === "azure" ? "e.g., https://your-resource.openai.azure.com/" :
                      provider === "ollama" ? "e.g., http://localhost:11434" :
                      provider === "openai_compatible" ? "e.g., https://api.groq.com/openai/v1" :
                      "e.g., https://api.openai.com/v1"
                    } 
                    {...field} value={field.value ?? ""} 
                  />
                </FormControl>
                <FormDescription>
                  {provider === "ollama" && "Optional. Defaults to Ollama's standard local URL if not set."}
                  {provider === "openai_compatible" && "Required for OpenAI-compatible providers."}
                   {provider === "azure" && "Required. Example: https://your-resource.openai.azure.com/"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {provider === "azure" && (
          <FormField
            control={form.control}
            name="api_version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Version (Azure)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2023-07-01-preview" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>Required for Azure OpenAI.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" min="0" max="2" placeholder="e.g., 0.7 (Default by provider)" 
                {...field} 
                value={field.value === null || field.value === undefined ? "" : String(field.value)}
                // onChange is handled by the main form.watch subscription
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="max_tokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Tokens</FormLabel>
              <FormControl>
                <Input type="number" step="1" min="1" placeholder="e.g., 2048 (Default by provider)" 
                 {...field} 
                 value={field.value === null || field.value === undefined ? "" : String(field.value)}
                // onChange is handled by the main form.watch subscription
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="top_p"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Top P</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" min="0" max="1" placeholder="e.g., 1.0 (Default by provider)" 
                 {...field} 
                 value={field.value === null || field.value === undefined ? "" : String(field.value)}
                // onChange is handled by the main form.watch subscription
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  return (
    <Form {...form}> {/* Pass form methods to Form component */}
      <form className="space-y-6 p-1" onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
        <div className="space-y-2">
          <Label htmlFor="llm-role-select">Configure LLM Role</Label>
          <Select 
            value={selectedRole} 
            onValueChange={(value) => setSelectedRole(value as LLMRole)}
          >
            <SelectTrigger id="llm-role-select">
              <SelectValue placeholder="Select LLM Role" />
            </SelectTrigger>
            <SelectContent>
              {llmRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the LLM role (e.g., for basic tasks, reasoning, or vision). Settings are saved automatically.
          </p>
        </div>

        <div className="space-y-2 border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-medium">
              Provider for {llmRoles.find(r => r.value === selectedRole)?.label || selectedRole}
            </h3>
            <Button variant="outline" size="sm" onClick={handleResetRoleToDefault}>
              Reset to Default
            </Button>
          </div>
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LLM Provider</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const newProvider = value as LLMProvider;
                    // When provider changes, reset the form with defaults for the new provider type
                    // under the currently selected role, preserving only the new provider.
                    let newProviderDefaults: LLMProviderConfig = { provider: newProvider };
                    if (newProvider === "openai") newProviderDefaults = { provider: "openai" } as OpenAIConfig;
                    else if (newProvider === "azure") newProviderDefaults = { provider: "azure" } as AzureOpenAIConfig;
                    else if (newProvider === "ollama") newProviderDefaults = { provider: "ollama" } as OllamaConfig;
                    else if (newProvider === "openai_compatible") newProviderDefaults = { provider: "openai_compatible" } as OpenAICompatibleConfig;
                    else newProviderDefaults = { provider: "" } as NotConfiguredLLM;

                    form.reset({
                        ...DEFAULT_SETTINGS.llmConfigurations[selectedRole], // Start with role defaults
                        ...newProviderDefaults, // Overlay provider type specific defaults
                        provider: newProvider, // Ensure the selected provider is set
                    });
                    // The form.watch effect will pick up this change and save it.
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger id={`llm-provider-select-${selectedRole}`}>
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {llmProvidersList.map((providerOpt) => (
                      <SelectItem key={providerOpt.value} value={providerOpt.value}>
                        {providerOpt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {watchedProvider !== undefined && renderProviderFields(watchedProvider)}

      </form>
    </Form>
  );
}
