
# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from langchain.agents.react.agent import create_react_agent
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from typing import Optional, Dict, Any

from src.prompts import apply_prompt_template
from src.llms.llm import get_llm_by_type
from src.config.agents import AGENT_LLM_MAP, LLMType

def create_agent(
    agent_name: str,
    llm_type: LLMType,
    tools: list,
    prompt_name: str,
    llm_runtime_config_dict: Optional[Dict[str, Any]] = None,  # New parameter
    # config: Optional[RunnableConfig] = None, # config not used in this function directly
):
    """Create an agent with the given tools and prompt."""
    # runnable_config = config # Store for potential use

    prompt_template = apply_prompt_template(prompt_name, {"tools": tools})
    prompt = ChatPromptTemplate.from_messages(prompt_template)
    # log_extra = {"thread_id": runnable_config.configurable.get("thread_id", "N/A")} if runnable_config and hasattr(runnable_config, 'configurable') else {}
    # logger.info(f"Creating agent '{agent_name}' with LLM type '{llm_type}' and prompt '{prompt_name}'.", extra=log_extra)
    
    llm = get_llm_by_type(llm_type, runtime_config_dict=llm_runtime_config_dict)  # Pass runtime_config_dict

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent)
