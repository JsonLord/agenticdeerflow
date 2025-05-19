
# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pathlib import Path
from typing import Any, Dict, Optional

from langchain_openai import ChatOpenAI, AzureChatOpenAI
from langchain_community.chat_models import ChatOllama
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.runnables import RunnableConfig

from src.config import load_yaml_config
from src.config.agents import LLMType, AGENT_LLM_MAP
import logging

logger = logging.getLogger(__name__)

# Cache for LLM instances
_llm_cache: dict[LLMType, BaseChatModel] = {}

# New helper function to create LLM from a config dictionary
def _create_llm_from_config_dict(config_dict: Dict[str, Any]) -> BaseChatModel:
    """
    Creates an LLM instance from a configuration dictionary based on the provider.
    """
    config_copy = config_dict.copy()  # Work with a copy to avoid modifying the original
    provider = config_copy.pop("provider", None)

    if not provider:
        raise ValueError(
            "LLM configuration dictionary must include a 'provider' key."
        )

    provider = provider.lower()
    model_name = config_copy.pop("model", None)  # Common key for model/deployment

    # Common parameters that might be present and can be passed to most models
    # Filter them out if they are None to avoid passing None as default
    common_params = {
        k: config_copy.pop(k)
        for k in ["temperature", "max_tokens", "top_p"]
        if k in config_copy and config_copy[k] is not None
    }

    try:
        if provider == "openai" or provider == "openai_compatible":
            if not model_name:
                raise ValueError(f"Missing 'model' (model_name) in '{provider}' configuration.")
            # api_key and base_url are optional for ChatOpenAI if set in env vars
            # but if provided in config, they should be used.
            api_key = config_copy.pop("api_key", None)
            base_url = config_copy.pop("base_url", None)

            constructor_params = {"model_name": model_name, **common_params}
            if api_key:
                constructor_params["openai_api_key"] = api_key
            if base_url:
                constructor_params["openai_api_base"] = base_url

            # Pass any remaining keys from config_copy if ChatOpenAI accepts them
            constructor_params.update(config_copy)
            return ChatOpenAI(**constructor_params)

        elif provider == "azure":
            if not model_name:  # For Azure, 'model' in config is the deployment name
                raise ValueError(f"Missing 'model' (azure_deployment) in '{provider}' configuration.")

            # Azure specific keys, map them to AzureChatOpenAI parameters
            # From docs: api_base, api_version, api_key
            # AzureChatOpenAI: azure_deployment, openai_api_version, azure_endpoint, openai_api_key
            azure_deployment = model_name
            api_version = config_copy.pop("api_version", None)
            azure_endpoint = config_copy.pop("api_base", config_copy.pop("azure_endpoint", None))
            api_key = config_copy.pop("api_key", None)

            if not api_version:
                raise ValueError("Missing 'api_version' in Azure OpenAI configuration.")
            if not azure_endpoint:
                raise ValueError("Missing 'api_base' or 'azure_endpoint' in Azure OpenAI configuration.")
            # api_key is optional if set in env

            constructor_params = {
                "azure_deployment": azure_deployment,
                "openai_api_version": api_version,
                "azure_endpoint": azure_endpoint,
                **common_params
            }
            if api_key:
                constructor_params["openai_api_key"] = api_key

            constructor_params.update(config_copy)
            return AzureChatOpenAI(**constructor_params)

        elif provider == "ollama":
            if not model_name:
                raise ValueError(f"Missing 'model' in '{provider}' configuration.")

            base_url = config_copy.pop("base_url", None)  # Optional, defaults in ChatOllama

            constructor_params = {"model": model_name, **common_params}
            if base_url:
                constructor_params["base_url"] = base_url

            constructor_params.update(config_copy)
            return ChatOllama(**constructor_params)

        else:
            raise ValueError(f"Unsupported LLM provider: '{provider}'. Supported providers are 'openai', 'azure', 'ollama', 'openai_compatible'.")

    except Exception as e:
        # Catch potential errors during LLM instantiation (e.g., missing keys, invalid values)
        raise ValueError(
            f"Error instantiating LLM for provider '{provider}' with model '{model_name}'. "
            f"Ensure the configuration is complete and valid. Original error: {str(e)}"
        )

def _create_llm_use_conf(llm_type: LLMType, conf: Dict[str, Any]) -> BaseChatModel:
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
        
    # Delegate instantiation to the new helper function
    return _create_llm_from_config_dict(llm_conf)

def get_llm_by_type(
    llm_type: LLMType,
    runtime_config_dict: Optional[Dict[str, Any]] = None,
) -> BaseChatModel:
    """
    Get LLM instance by type.
    If runtime_config_dict is provided, it's used to create the LLM directly, bypassing cache.
    Otherwise, returns cached instance if available, or creates from conf.yaml and caches.
    """
    if runtime_config_dict:
        # If runtime config is provided, create LLM directly and do not cache for now.
        # Cache key would need to be more complex if caching runtime-configured LLMs.
        logger.info(f"Creating LLM for type '{llm_type}' using runtime configuration.")
        return _create_llm_from_config_dict(runtime_config_dict)

    # Fallback to existing caching and conf.yaml based loading
    if llm_type in _llm_cache:
        logger.debug(f"Returning cached LLM for type '{llm_type}'.")
        return _llm_cache[llm_type]

    logger.info(f"LLM for type '{llm_type}' not in cache. Creating from conf.yaml.")
    conf = load_yaml_config(
        str((Path(__file__).parent.parent.parent / "conf.yaml").resolve())
    )
    llm = _create_llm_use_conf(llm_type, conf)
    _llm_cache[llm_type] = llm
    logger.info(f"Cached LLM for type '{llm_type}'.")
    return llm

# Initialize LLMs for different purposes - now these will be cached
basic_llm: BaseChatModel = get_llm_by_type("basic")

# In the future, we will use reasoning_llm and vl_llm for different purposes
# reasoning_llm = get_llm_by_type("reasoning")
# vl_llm = get_llm_by_type("vision")

if __name__ == "__main__":
    # Example usage (requires conf.yaml to be set up with BASIC_MODEL and provider)
    try:
        print("Testing basic_llm (from conf.yaml):")
        print(basic_llm.invoke("Hello"))

        print("\nTesting runtime OpenAI compatible config:")
        runtime_openai_conf = {
            "provider": "openai_compatible",  # or "openai"
            "model": "gpt-3.5-turbo",  # Replace with your model
            # "api_key": "YOUR_OPENAI_API_KEY",  # If not in env
            # "base_url": "YOUR_COMPATIBLE_BASE_URL"  # If using compatible
        }
        # Ensure your environment has OPENAI_API_KEY set or provide it in the dict
        # For local testing, you might need to provide api_key and base_url if not using official OpenAI
        # and if your compatible endpoint requires them.
        # Example for a local Ollama OpenAI-compatible endpoint:
        # runtime_openai_conf = {
        #     "provider": "openai_compatible",
        #     "model": "llama2",
        #     "api_key": "ollama",  # Ollama doesn't use API keys but ChatOpenAI might expect something
        #     "base_url": "http://localhost:11434/v1"
        # }
        # runtime_llm_openai = get_llm_by_type("basic", runtime_config_dict=runtime_openai_conf)
        # print(runtime_llm_openai.invoke("Hi from runtime OpenAI compatible config"))

        # print("\nTesting runtime Ollama config:")
        # runtime_ollama_conf = {
        #     "provider": "ollama",
        #     "model": "llama2",  # Ensure this model is pulled in Ollama
        #     "base_url": "http://localhost:11434"  # Default, can be omitted if ollama serve is default
        # }
        # runtime_llm_ollama = get_llm_by_type("basic", runtime_config_dict=runtime_ollama_conf)
        # print(runtime_llm_ollama.invoke("Hi from runtime Ollama config"))

    except ValueError as ve:
        print(f"Configuration Error: {ve}")
    except Exception as ex:
        print(f"An unexpected error occurred: {ex}")
