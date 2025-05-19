# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pathlib import Path
from typing import Any, Dict

from langchain_openai import ChatOpenAI

from src.config import load_yaml_config
from src.config.agents import LLMType

# Cache for LLM instances
_llm_cache: dict[LLMType, ChatOpenAI] = {}


def _create_llm_use_conf(llm_type: LLMType, conf: Dict[str, Any]) -> ChatOpenAI:
    llm_type_to_expected_key = {
        "reasoning": "REASONING_MODEL",
        "basic": "BASIC_MODEL",
        "vision": "VISION_MODEL",
    }

    if llm_type not in llm_type_to_expected_key:
        raise ValueError(
            f"Unknown LLM type: '{llm_type}'. Supported types are: {list(llm_type_to_expected_key.keys())}"
        )

    expected_config_key = llm_type_to_expected_key[llm_type]
    llm_conf = conf.get(expected_config_key)

    if llm_conf is None:
        raise ValueError(
            f"Configuration for LLM type '{llm_type}' (expected key: '{expected_config_key}') "
            f"not found or is null in conf.yaml. Please check your configuration."
        )
    
    if not isinstance(llm_conf, dict):
        raise ValueError(
            f"Configuration for LLM type '{llm_type}' (expected key: '{expected_config_key}') "
            f"is invalid in conf.yaml. It should be a dictionary, but found type {type(llm_conf).__name__}."
        )
        
    try:
        return ChatOpenAI(**llm_conf)
    except Exception as e:
        # Catch potential errors during ChatOpenAI instantiation (e.g., missing keys in llm_conf)
        raise ValueError(
            f"Error instantiating ChatOpenAI for LLM type '{llm_type}' with configuration key '{expected_config_key}'. "
            f"Ensure the configuration in conf.yaml is complete and valid. Original error: {str(e)}"
        )


def get_llm_by_type(
    llm_type: LLMType,
) -> ChatOpenAI:
    """
    Get LLM instance by type. Returns cached instance if available.
    """
    if llm_type in _llm_cache:
        return _llm_cache[llm_type]

    conf = load_yaml_config(
        str((Path(__file__).parent.parent.parent / "conf.yaml").resolve())
    )
    llm = _create_llm_use_conf(llm_type, conf)
    _llm_cache[llm_type] = llm
    return llm


# Initialize LLMs for different purposes - now these will be cached
basic_llm = get_llm_by_type("basic")

# In the future, we will use reasoning_llm and vl_llm for different purposes
# reasoning_llm = get_llm_by_type("reasoning")
# vl_llm = get_llm_by_type("vision")


if __name__ == "__main__":
    print(basic_llm.invoke("Hello"))
