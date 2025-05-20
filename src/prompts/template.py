# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
from datetime import datetime
from typing import Optional, Dict, Any
from jinja2 import (
    Environment,
    FileSystemLoader,
    select_autoescape,
    TemplateNotFound
)

from langgraph.prebuilt.chat_agent_executor import AgentState

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
    template_path = ""
    if prompt_name == "coordinator":
        default_coordinator_path = os.path.join(
            "coordinator_personas", "default.md"
        )
        if selected_persona:
            persona_specific_path = os.path.join(
                "coordinator_personas", f"{selected_persona}.md"
            )
            try:
                # Get the template path from the loader
                template_path = env.loader.get_source(
                    env, persona_specific_path
                )[1]
                # Read the template file directly
                with open(template_path, 'r') as f:
                    return f.read()
            except (TemplateNotFound, FileNotFoundError):
                # Fall through to load default
                pass

        # Load default if no persona selected or if persona-specific not found
        try:
            # Get the template path from the loader
            template_path = env.loader.get_source(
                env, default_coordinator_path
            )[1]
            # Read the template file directly
            with open(template_path, 'r') as f:
                return f.read()
        except (TemplateNotFound, FileNotFoundError) as e_default:
            msg = (
                f"Error loading default coordinator template "
                f"'{default_coordinator_path}'. "
                f"Ensure 'src/prompts/coordinator_personas/default.md' exists. "
                f"Original error: {e_default}"
            )
            raise ValueError(msg) from e_default
    else:
        # For non-coordinator prompts
        template_path = f"{prompt_name}.md"
        try:
            # Get the template path from the loader
            template_path = env.loader.get_source(
                env, template_path
            )[1]
            # Read the template file directly
            with open(template_path, 'r') as f:
                return f.read()
        except (TemplateNotFound, FileNotFoundError) as e:
            msg = f"Error loading template '{template_path}': {e}"
            raise ValueError(msg) from e


def apply_prompt_template(
    prompt_name: str,
    state: AgentState,
    configurable: Optional[Dict[str, Any]] = None
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
    time_format = "%a %b %d %Y %H:%M:%S %z"
    state_vars = {
        "CURRENT_TIME": datetime.now().strftime(time_format),
    }
    # Merge state dictionary
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
        messages = [{"role": "system", "content": system_prompt}]
        return messages + messages_from_state
    except Exception as e:
        # Include prompt_name and selected_persona in the error for better context
        p_info = ""
        if selected_persona:
            p_info = f" (persona: {selected_persona})"
        err_prefix = f"Error applying template '{prompt_name}'"
        err_msg = f"{err_prefix}{p_info}: {e}"
        raise ValueError(err_msg) from e
