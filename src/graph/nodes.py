
# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import json
import logging
import os
from typing import Annotated, Literal

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.types import Command, interrupt
from langgraph.graph import END

from langchain_mcp_adapters.client import MultiServerMCPClient

from src.agents import create_agent
from src.tools.search import LoggedTavilySearch
from src.tools import (
    crawl_tool,
    get_web_search_tool,
    python_repl_tool,
)

from src.config.agents import AGENT_LLM_MAP
from src.config.configuration import Configuration
from src.llms.llm import get_llm_by_type
from src.prompts.planner_model import Plan, StepType
from src.prompts.template import apply_prompt_template
from src.utils.json_utils import repair_json_output

from .types import State
from ..config import SELECTED_SEARCH_ENGINE, SearchEngine

logger = logging.getLogger(__name__)

@tool
def handoff_to_planner(
    task_title: Annotated[str, "The title of the task to be handed off."],
    locale: Annotated[str, "The user's detected language locale (e.g., en-US, zh-CN)."],
):
    """Handoff to planner agent to do plan."""
    # This tool is not returning anything: we're just using it
    # as a way for LLM to signal that it needs to hand off to planner agent
    return

def background_investigation_node(
    state: State, config: RunnableConfig
) -> Command[Literal["planner"]]:
    node_name = "background_investigator"
    logger.info(f"{node_name} node is running.")
    updated_state_changes = {}
    try:
        configurable = Configuration.from_runnable_config(config)
        query = state["messages"][-1].content
        background_investigation_results = None
        if SELECTED_SEARCH_ENGINE == SearchEngine.TAVILY:
            searched_content = LoggedTavilySearch(
                max_results=configurable.max_search_results
            ).invoke({"query": query})
            if isinstance(searched_content, list):
                background_investigation_results = [
                    {"title": elem["title"], "content": elem["content"]}
                    for elem in searched_content
                ]
            else:
                logger.error(
                    f"Tavily search returned malformed response: {searched_content}"
                )
                raise ValueError(f"Tavily search returned malformed response: {searched_content}")
        else:
            background_investigation_results = get_web_search_tool(
                configurable.max_search_results
            ).invoke(query)

        updated_state_changes = {
            "background_investigation_results": json.dumps(
                background_investigation_results, ensure_ascii=False
            ),
            "current_node_error": None,
        }
        return Command(
            update=updated_state_changes,
            goto="planner",
        )
    except Exception as e:
        error_message = f"Error in {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        return Command(update=updated_state_changes, goto=END)

def planner_node(
    state: State, config: RunnableConfig
) -> Command[Literal["human_feedback", "reporter", "__end__"]]:
    node_name = "planner"
    logger.info(f"{node_name} generating full plan")
    updated_state_changes = {}
    full_response = ""
    try:
        configurable = Configuration.from_runnable_config(config)
        plan_iterations = state.get("plan_iterations", 0)
        messages = apply_prompt_template("planner", state, configurable)

        if (
            plan_iterations == 0
            and state.get("enable_background_investigation")
            and state.get("background_investigation_results")
        ):
            messages += [
                {
                    "role": "user",
                    "content": (
                        "background investigation results of user query:\n"
                        + state["background_investigation_results"]
                        + "\n"
                    ),
                }
            ]

        if AGENT_LLM_MAP["planner"] == "basic":
            llm = get_llm_by_type(AGENT_LLM_MAP["planner"]).with_structured_output(
                Plan,
                method="json_mode",
            )
        else:
            llm = get_llm_by_type(AGENT_LLM_MAP["planner"])

        if plan_iterations >= configurable.max_plan_iterations:
            logger.warning(f"Max plan iterations ({configurable.max_plan_iterations}) reached. Going to reporter.")
            updated_state_changes["current_node_error"] = None
            return Command(update=updated_state_changes, goto="reporter")

        if AGENT_LLM_MAP["planner"] == "basic":
            response = llm.invoke(messages)
            full_response = response.model_dump_json(indent=4, exclude_none=True)
        else:
            response_stream = llm.stream(messages)
            for chunk in response_stream:
                full_response += chunk.content
        logger.debug(f"Current state messages: {state['messages']}")
        logger.info(f"Planner response: {full_response}")

        curr_plan_data = json.loads(repair_json_output(full_response))

        updated_state_changes["current_node_error"] = None
        if curr_plan_data.get("has_enough_context"):
            logger.info("Planner response has enough context.")
            new_plan = Plan.model_validate(curr_plan_data)
            updated_state_changes.update({
                "messages": [AIMessage(content=full_response, name="planner")],
                "current_plan": new_plan,
            })
            return Command(
                update=updated_state_changes,
                goto="reporter",
            )

        updated_state_changes.update({
            "messages": [AIMessage(content=full_response, name="planner")],
            "current_plan": full_response,
        })
        return Command(
            update=updated_state_changes,
            goto="human_feedback",
        )

    except json.JSONDecodeError as e:
        error_message = f"Error in {node_name} (JSONDecodeError): {str(e)}. Response: {full_response[:500]}"
        logger.warning(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        plan_iterations = state.get("plan_iterations", 0)
        if plan_iterations > 0:
            return Command(update=updated_state_changes, goto="reporter")
        return Command(update=updated_state_changes, goto=END)
    except Exception as e:
        error_message = f"Error in {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        return Command(update=updated_state_changes, goto=END)

def human_feedback_node(
    state: State
) -> Command[Literal["planner", "research_team", "reporter", "__end__"]]:
    node_name = "human_feedback"
    logger.info(f"{node_name} node is running.")
    updated_state_changes = {}
    try:
        current_plan_str = state.get("current_plan", "")
        auto_accepted_plan = state.get("auto_accepted_plan", False)

        if not auto_accepted_plan:
            feedback = interrupt("Please Review the Plan.")

            if feedback and str(feedback).upper().startswith("[EDIT_PLAN]"):
                updated_state_changes.update({
                    "messages": [
                        HumanMessage(content=feedback, name="feedback"),
                    ],
                    "current_node_error": None,
                })
                return Command(update=updated_state_changes, goto="planner")
            elif feedback and str(feedback).upper().startswith("[ACCEPTED]"):
                logger.info("Plan is accepted by user.")
            else:
                raise TypeError(f"Interrupt value of '{feedback}' is not supported or resolution unclear.")

        plan_iterations = state.get("plan_iterations", 0)

        if isinstance(current_plan_str, str):
            repaired_plan_str = repair_json_output(current_plan_str)
            parsed_plan_data = json.loads(repaired_plan_str)
            validated_plan = Plan.model_validate(parsed_plan_data)
        elif isinstance(current_plan_str, Plan):
            validated_plan = current_plan_str
        else:
            raise ValueError(f"current_plan is of unexpected type: {type(current_plan_str)}")

        goto = "research_team"
        if validated_plan.has_enough_context:
            goto = "reporter"

        updated_state_changes.update({
            "current_plan": validated_plan,
            "plan_iterations": plan_iterations + 1,
            "locale": validated_plan.locale,
            "current_node_error": None,
        })
        return Command(update=updated_state_changes, goto=goto)

    except Exception as e:
        error_message = f"Error in {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        return Command(update=updated_state_changes, goto=END)

def coordinator_node(
    state: State
) -> Command[Literal["planner", "background_investigator", "__end__"]]:
    node_name = "coordinator"
    logger.info(f"{node_name} talking.")
    updated_state_changes = {}
    try:
        messages = apply_prompt_template("coordinator", state)
        response = (
            get_llm_by_type(AGENT_LLM_MAP["coordinator"])
            .bind_tools([handoff_to_planner])
            .invoke(messages)
        )
        logger.debug(f"Current state messages: {state['messages']}")

        goto = END
        locale = state.get("locale", "en-US")

        if len(response.tool_calls) > 0:
            goto = "planner"
            if state.get("enable_background_investigation"):
                goto = "background_investigator"

            for tool_call in response.tool_calls:
                if tool_call.get("name", "") == handoff_to_planner.__name__:
                    if tool_locale := tool_call.get("args", {}).get("locale"):
                        locale = tool_locale
                        break
        else:
            logger.warning(
                "Coordinator response contains no tool calls. Terminating workflow execution."
            )
            logger.debug(f"Coordinator response: {response}")

        updated_state_changes = {"locale": locale, "current_node_error": None}
        return Command(
            update=updated_state_changes,
            goto=goto,
        )
    except Exception as e:
        error_message = f"Error in {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        return Command(update=updated_state_changes, goto=END)

def reporter_node(state: State) -> Command:
    node_name = "reporter"
    logger.info(f"{node_name} write final report")
    updated_state_changes = {}
    try:
        current_plan = state.get("current_plan")
        if not isinstance(current_plan, Plan):
            raise ValueError(f"Reporter expected a Plan object for current_plan, got {type(current_plan)}")

        input_ = {
            "messages": [
                HumanMessage(
                    f"# Research Requirements\n\n## Task\n\n{current_plan.title}\n\n## Description\n\n{current_plan.thought}"
                )
            ],
            "locale": state.get("locale", "en-US"),
        }
        invoke_messages = apply_prompt_template("reporter", input_)
        observations = state.get("observations", [])

        invoke_messages.append(
            HumanMessage(
                content="IMPORTANT: Structure your report according to the format in the prompt. Remember to include:\n\n1. Key Points - A bulleted list of the most important findings\n2. Overview - A brief introduction to the topic\n3. Detailed Analysis - Organized into logical sections\n4. Survey Note (optional) - For more comprehensive reports\n5. Key Citations - List all references at the end\n\nFor citations, DO NOT include inline citations in the text. Instead, place all citations in the 'Key Citations' section at the end using the format: `- [Source Title](URL)`. Include an empty line between each citation for better readability.\n\nPRIORITIZE USING MARKDOWN TABLES for data presentation and comparison. Use tables whenever presenting comparative data, statistics, features, or options. Structure tables with clear headers and aligned columns. Example table format:\n\n| Feature | Description | Pros | Cons |\n|---------|-------------|------|------|\n| Feature 1 | Description 1 | Pros 1 | Cons 1 |\n| Feature 2 | Description 2 | Pros 2 | Cons 2 |",
                name="system",
            )
        )

        for observation in observations:
            invoke_messages.append(
                HumanMessage(
                    content=f"Below are some observations for the research task:\n\n{observation}",
                    name="observation",
                )
            )
        logger.debug(f"Current invoke messages: {invoke_messages}")
        response = get_llm_by_type(AGENT_LLM_MAP["reporter"]).invoke(invoke_messages)
        response_content = response.content
        logger.info(f"reporter response: {response_content}")

        updated_state_changes = {
            "final_report": response_content,
            "current_node_error": None,
        }
        return Command(update=updated_state_changes)
    except Exception as e:
        error_message = f"Error in {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
            "final_report": f"Failed to generate report due to: {error_message}"
        }
        return Command(update=updated_state_changes, goto=END)

def research_team_node(
    state: State,
) -> Command[Literal["planner", "researcher", "coder"]]:
    """Research team node that collaborates on tasks."""
    logger.info("Research team is collaborating on tasks.")
    current_plan = state.get("current_plan")
    if not current_plan or not current_plan.steps:
        return Command(goto="planner")
    if all(step.execution_res for step in current_plan.steps):
        return Command(goto="planner")
    for step in current_plan.steps:
        if not step.execution_res:
            break
    if step.step_type and step.step_type == StepType.RESEARCH:
        return Command(goto="researcher")
    if step.step_type and step.step_type == StepType.PROCESSING:
        return Command(goto="coder")
    return Command(goto="planner")

async def _execute_agent_step(
    state: State, agent, agent_name: str
) -> Command[Literal["research_team", "__end__"]]:
    """Helper function to execute a step using the specified agent."""
    logger.info(f"Executing step via _execute_agent_step for agent: {agent_name}")
    updated_state_changes = {}
    current_step = None
    try:
        current_plan = state.get("current_plan")
        observations = state.get("observations", [])

        if not isinstance(current_plan, Plan):
            raise ValueError(f"Agent {agent_name} expected a Plan object, got {type(current_plan)}")

        completed_steps = []
        for step in current_plan.steps:
            if not step.execution_res:
                current_step = step
                break
            else:
                completed_steps.append(step)

        if not current_step:
            logger.warning(f"No unexecuted step found for {agent_name}")
            raise ValueError(f"No unexecuted step found for agent {agent_name} to execute.")

        logger.info(f"Agent {agent_name} executing step: {current_step.title}")

        completed_steps_info = ""
        if completed_steps:
            completed_steps_info = "# Existing Research Findings\n\n"
            for i, step_obj in enumerate(completed_steps):
                completed_steps_info += f"## Existing Finding {i+1}: {step_obj.title}\n\n"
                completed_steps_info += f"<finding>\n{step_obj.execution_res}\n</finding>\n\n"

        agent_input = {
            "messages": [
                HumanMessage(
                    content=f"{completed_steps_info}# Current Task\n\n## Title\n\n{current_step.title}\n\n## Description\n\n{current_step.description}\n\n## Locale\n\n{state.get('locale', 'en-US')}"
                )
            ]
        }

        if agent_name == "researcher":
            agent_input["messages"].append(
                HumanMessage(
                    content="IMPORTANT: DO NOT include inline citations in the text. Instead, track all sources and include a References section at the end using link reference format. Include an empty line between each citation for better readability. Use this format for each reference:\n- [Source Title](URL)\n\n- [Another Source](URL)",
                    name="system",
                )
            )

        default_recursion_limit = 25
        try:
            env_value_str = os.getenv("AGENT_RECURSION_LIMIT", str(default_recursion_limit))
            parsed_limit = int(env_value_str)
            recursion_limit = parsed_limit if parsed_limit > 0 else default_recursion_limit
            if parsed_limit <= 0:
                logger.warning(
                    f"AGENT_RECURSION_LIMIT value '{env_value_str}' (parsed as {parsed_limit}) is not positive. "
                    f"Using default value {default_recursion_limit}."
                )
        except ValueError:
            raw_env_value = os.getenv("AGENT_RECURSION_LIMIT")
            logger.warning(
                f"Invalid AGENT_RECURSION_LIMIT value: '{raw_env_value}'. "
                f"Using default value {default_recursion_limit}."
            )
            recursion_limit = default_recursion_limit

        logger.info(f"Agent {agent_name} recursion limit set to: {recursion_limit}")
        result = await agent.ainvoke(
            input=agent_input, config={"recursion_limit": recursion_limit}
        )

        response_content = result["messages"][-1].content
        logger.debug(f"{agent_name.capitalize()} full response: {response_content}")

        current_step.execution_res = response_content
        logger.info(f"Step '{current_step.title}' execution completed by {agent_name}")

        updated_state_changes = {
            "messages": [
                HumanMessage(
                    content=response_content,
                    name=agent_name,
                )
            ],
            "observations": observations + [response_content],
            "current_plan": current_plan,
            "current_node_error": None,
        }
        return Command(update=updated_state_changes, goto="research_team")

    except Exception as e:
        error_message = f"Error in agent {agent_name} (_execute_agent_step): {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[agent_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        if current_step is not None:
            current_step.execution_res = f"Error during execution: {error_message}"
            updated_state_changes["current_plan"] = state.get("current_plan")
        return Command(update=updated_state_changes, goto=END)

async def _setup_and_execute_agent_step(
    state: State,
    config: RunnableConfig,
    agent_type: str,
    default_tools: list,
) -> Command[Literal["research_team", "__end__"]]:
    """Helper function to set up an agent with appropriate tools and execute a step."""
    node_name = agent_type
    logger.info(f"Setting up agent for: {node_name}")
    updated_state_changes = {}
    try:
        configurable = Configuration.from_runnable_config(config)
        mcp_servers = {}
        enabled_tools = {}

        if configurable.mcp_settings:
            for server_name, server_config_dict in configurable.mcp_settings["servers"].items():
                if (
                    server_config_dict["enabled_tools"]
                    and agent_type in server_config_dict["add_to_agents"]
                ):
                    mcp_servers[server_name] = {
                        k: v
                        for k, v in server_config_dict.items()
                        if k in ("transport", "command", "args", "url", "env")
                    }
                    for tool_name in server_config_dict["enabled_tools"]:
                        enabled_tools[tool_name] = server_name

        agent_to_execute = None
        if mcp_servers:
            async with MultiServerMCPClient(mcp_servers) as client:
                loaded_tools = default_tools[:]
                for tool_instance in client.get_tools():
                    if tool_instance.name in enabled_tools:
                        tool_instance.description = (
                            f"Powered by '{enabled_tools[tool_instance.name]}'.\n{tool_instance.description}"
                        )
                        loaded_tools.append(tool_instance)
                agent_to_execute = create_agent(agent_type, agent_type, loaded_tools, agent_type)
        else:
            agent_to_execute = create_agent(agent_type, agent_type, default_tools, agent_type)

        return await _execute_agent_step(state, agent_to_execute, agent_type)

    except Exception as e:
        error_message = f"Error in _setup_and_execute_agent_step for {node_name}: {str(e)}"
        logger.error(error_message, exc_info=True)
        current_node_errors = state.get("node_errors", {}).copy()
        current_node_errors[node_name] = error_message
        updated_state_changes = {
            "current_node_error": error_message,
            "node_errors": current_node_errors,
        }
        current_plan = state.get("current_plan")
        if isinstance(current_plan, Plan):
            current_step_obj = None
            for step_item in current_plan.steps:
                if not step_item.execution_res:
                    current_step_obj = step_item
                    break
            if current_step_obj:
                current_step_obj.execution_res = f"Error during agent setup: {error_message}"
                updated_state_changes["current_plan"] = current_plan
        return Command(update=updated_state_changes, goto=END)

async def researcher_node(
    state: State, config: RunnableConfig
) -> Command[Literal["research_team"]]:
    """Researcher node that do research"""
    logger.info("Researcher node is researching.")
    configurable = Configuration.from_runnable_config(config)
    return await _setup_and_execute_agent_step(
        state,
        config,
        "researcher",
        [get_web_search_tool(configurable.max_search_results), crawl_tool],
    )

async def coder_node(
    state: State, config: RunnableConfig
) -> Command[Literal["research_team"]]:
    """Coder node that do code analysis."""
    logger.info("Coder node is coding.")
    return await _setup_and_execute_agent_step(
        state,
        config,
        "coder",
        [python_repl_tool],
    )
