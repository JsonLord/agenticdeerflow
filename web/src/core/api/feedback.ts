// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { resolveServiceURL } from "./resolve-service-url";

interface CoordinatorFeedbackPayload {
  persona_id: string;
  feedback_text: string;
}

interface SubmitFeedbackResponse {
  message: string;
  // Add other fields if the backend response becomes more complex
}

export async function submitCoordinatorFeedback(
  payload: CoordinatorFeedbackPayload,
): Promise<SubmitFeedbackResponse> {
  const response = await fetch(resolveServiceURL("coordinator_feedback"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to submit feedback." }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<SubmitFeedbackResponse>;
}
