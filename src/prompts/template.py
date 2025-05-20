# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import dataclasses
from datetime import datetime
from typing import List, Optional, Dict, Any
import jinja2
from jinja2 import Environment, FileSystemLoader, select_autoescape, TemplateNotFound

from langgraph.prebuilt.chat_agent_executor import AgentState

# from src.config.configuration import Configuration

# Initialize Jinja2 environment
env = Environment(
    loader=FileSystemLoader(os.path.dirname(__file__)),
    autoescape=select_autoescape(),
    trim_blocks=True,
    lstrip_blocks=True,
)


def get_prompt_template(
    prompt_name: str, selected_persona: Optional[str] = None
) -> str:
    """
    Load and return a prompt template as a string.
    For 'coordinator' prompt_name, attempts to load a persona-specific template
    from the 'coordinator_personas' subdirectory, falling back to a default.

    Args:
        prompt_name: Name of the prompt (e.g., "coordinator", "planner").
        selected_persona: Optional persona ID for the coordinator.

    Returns:
        A string containing the template content.

    Raises:
        ValueError: If the template or its fallback cannot be loaded.
    """
    template_path_to_try = ""
    if prompt_name == "coordinator":
        default_coordinator_path = os.path.join("coordinator_personas", "default.md")
        if selected_persona:
            persona_specific_path = os.path.join(
                "coordinator_personas", f"{selected_persona}.md"
            )
            try:
                # Get the template path from the loader
                template_path = env.loader.get_source(env, persona_specific_path)[1]
                # Read the template file directly
                with open(template_path, 'r') as f:
                    return f.read()
            except (TemplateNotFound, FileNotFoundError):
                # print(f"Persona template '{persona_specific_path}' not found. Falling back to default.") # Debug
                pass  # Fall through to load default

        # Load default if no persona selected or if persona-specific not found
        try:
            # Get the template path from the loader
            template_path = env.loader.get_source(env, default_coordinator_path)[1]
            # Read the template file directly
            with open(template_path, 'r') as f:
                return f.read()
        except (TemplateNotFound, FileNotFoundError) as e_default:
            raise ValueError(
                f"Error loading default coordinator template '{default_coordinator_path}'. "
                f"Ensure 'src/prompts/coordinator_personas/default.md' exists. Original error: {e_default}"
            ) from e_default
    else:
        # For non-coordinator prompts
        template_path_to_try = f"{prompt_name}.md"
        try:
            # Get the template path from the loader
            template_path = env.loader.get_source(env, template_path_to_try)[1]
            # Read the template file directly
            with open(template_path, 'r') as f:
                return f.read()
        except (TemplateNotFound, FileNotFoundError) as e:
            raise ValueError(
                f"Error loading template '{template_path_to_try}': {e}"
            ) from e


def apply_prompt_template(
    prompt_name: str, state: AgentState, configurable: Optional[Dict[str, Any]] = None
) -> list:
    """
    Apply template variables to a prompt template and return formatted messages.

    Args:
        prompt_name: Name of the prompt template to use.
        state: Current agent state containing variables to substitute.
        configurable: Optional dictionary containing runtime configurations,
                      which might include 'selected_persona'.

    Returns:
        List of messages with the system prompt as the first message.
    """
    # Convert state to dict for template rendering
    # AgentState is a TypedDict, so it can be directly unpacked if all keys are strings.
    # Or access items using state.get("key") or state["key"]
    state_vars = {
        "CURRENT_TIME": datetime.now().strftime("%a %b %d %Y %H:%M:%S %z"),
    }
    # Merge state dictionary. AgentState might not be directly unpackable with ** if it has non-string keys
    # or if we want to be more explicit.
    for key, value in state.items():
        state_vars[key] = value

    if configurable:
        state_vars.update(configurable)

    selected_persona: Optional[str] = None
    if configurable:
        selected_persona = configurable.get("selected_persona")

    try:
        template_str = get_prompt_template(prompt_name, selected_persona)
        template_obj = env.from_string(template_str)
        system_prompt = template_obj.render(**state_vars)

        messages_from_state = state.get("messages", [])
        return [{"role": "system", "content": system_prompt}] + messages_from_state
    except Exception as e:
        # Include prompt_name and selected_persona in the error for better context
        persona_info = f" (persona: {selected_persona})" if selected_persona else ""
        raise ValueError(
            f"Error applying template '{prompt_name}'{persona_info}: {e}"
        ) from e
