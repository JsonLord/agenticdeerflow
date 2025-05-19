# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import List, Optional, Union

from typing import List, Optional, Union, Dict, Any # Added Dict, Any

from pydantic import BaseModel, Field


class ContentItem(BaseModel):
    type: str = Field(..., description="The type of content (text, image, etc.)")
    text: Optional[str] = Field(None, description="The text content if type is 'text'")
    image_url: Optional[str] = Field(
        None, description="The image URL if type is 'image'"
    )


class ChatMessage(BaseModel):
    role: str = Field(
        ..., description="The role of the message sender (user or assistant)"
    )
    content: Union[str, List[ContentItem]] = Field(
        ...,
        description="The content of the message, either a string or a list of content items",
    )


class ChatRequest(BaseModel):
    messages: Optional[List[ChatMessage]] = Field(
        [], description="History of messages between the user and the assistant"
    )
    debug: Optional[bool] = Field(False, description="Whether to enable debug logging")
    thread_id: Optional[str] = Field(
        "__default__", description="A specific conversation identifier"
    )
    max_plan_iterations: Optional[int] = Field(
        1, description="The maximum number of plan iterations"
    )
    max_step_num: Optional[int] = Field(
        3, description="The maximum number of steps in a plan"
    )
    max_search_results: Optional[int] = Field(
        3, description="The maximum number of search results"
    )
    auto_accepted_plan: Optional[bool] = Field(
        False, description="Whether to automatically accept the plan"
    )
    interrupt_feedback: Optional[str] = Field(
        None, description="Interrupt feedback from the user on the plan"
    )
    mcp_settings: Optional[dict] = Field(
        None, description="MCP settings for the chat request"
    )
    enable_background_investigation: Optional[bool] = Field(
        True, description="Whether to get background investigation before plan"
    )
    llm_configurations: Optional[Dict[str, Dict[str, Any]]] = Field(
        None, description="Runtime LLM configurations for different roles (e.g., basic, reasoning, vision)"
    )
    selected_persona: Optional[str] = Field(
        None, description="The ID of the selected coordinator persona (e.g., 'default', 'analytical_researcher')"
    )


class TTSRequest(BaseModel):
    text: str
    encoding: Optional[str] = "mp3"
    speed_ratio: Optional[float] = 1.0
    volume_ratio: Optional[float] = 1.0
    pitch_ratio: Optional[float] = 1.0
    text_type: Optional[str] = "ssml"
    with_frontend: Optional[bool] = True
    frontend_type: Optional[str] = "unitTson"


    text: str = Field(..., description="The text to convert to speech")
    voice_type: Optional[str] = Field(
        "BV700_V2_streaming", description="The voice type to use"
    )
    encoding: Optional[str] = Field("mp3", description="The audio encoding format")
    speed_ratio: Optional[float] = Field(1.0, description="Speech speed ratio")
    volume_ratio: Optional[float] = Field(1.0, description="Speech volume ratio")
    pitch_ratio: Optional[float] = Field(1.0, description="Speech pitch ratio")
    text_type: Optional[str] = Field("plain", description="Text type (plain or ssml)")
    with_frontend: Optional[int] = Field(
        1, description="Whether to use frontend processing"
    )
    frontend_type: Optional[str] = Field("unitTson", description="Frontend type")


class GeneratePodcastRequest(BaseModel):
    content: str


    content: str = Field(..., description="The content of the podcast")


class GeneratePPTRequest(BaseModel):
    content: str


    content: str = Field(..., description="The content of the ppt")


class GenerateProseRequest(BaseModel):
    prompt: str
    content: str
    locale: Optional[str] = "en-US"
    option: Optional[str] = "polish"  # Default to polish
    command: Optional[str] = "polish" # Default to polish


class CoordinatorFeedbackRequest(BaseModel):
    """
    Request model for submitting feedback on a coordinator persona.
    """
    persona_id: str
    feedback_text: str

    prompt: str = Field(..., description="The content of the prose")
    option: str = Field(..., description="The option of the prose writer")
    command: Optional[str] = Field(
        "", description="The user custom command of the prose writer"
    )
