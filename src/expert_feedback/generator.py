
import logging
import re
from typing import Any, Dict, List, Optional

from src.graph.types import State
from src.llms.llm import get_llm_by_type, AGENT_LLM_MAP
from src.prompts.template import apply_prompt_template
from src.server.expert_feedback_models import ExpertFeedbackResponse
from src.prompts.planner_model import Plan # For type hinting current_plan

# Placeholder for graph_executable type, typically a LangGraph CompiledGraph
LangGraphExecutable = Any

logger = logging.getLogger(__name__)

def _format_graph_state_for_expert_llm(full_state_values: State) -> str:
    """
    Formats the relevant parts of the graph state into a concise textual context
    for the expert LLM.
    """
    context_parts = []

    # Initial User Query
    if full_state_values.get("messages"):
        # Find the first user message
        initial_query = next((msg.get("content") for msg in full_state_values["messages"] if msg.get("role") == "user"), None)
        if initial_query:
            context_parts.append(f"Initial User Query:\n{initial_query}\n")

    # Current Plan
    current_plan_obj = full_state_values.get("current_plan")
    if current_plan_obj:
        plan_text = ""
        if isinstance(current_plan_obj, Plan): # If it's the Pydantic model
            plan_text += f"Plan Title: {current_plan_obj.title}\n"
            plan_text += f"Planner's Thought: {current_plan_obj.thought}\n"
            plan_text += "Plan Steps:\n"
            for i, step in enumerate(current_plan_obj.steps):
                status = "Completed" if step.execution_res else "Pending"
                plan_text += f"  {i+1}. {step.title} (Status: {status})\n"
                if step.execution_res:
                    plan_text += f"     Result: {step.execution_res[:200]}...\n" # Truncate long results
        elif isinstance(current_plan_obj, str): # If it's a string (e.g., before validation)
            plan_text = current_plan_obj
        elif isinstance(current_plan_obj, dict): # If it's a dict
            plan_text = f"Plan Title: {current_plan_obj.get('title', 'N/A')}\n"
            plan_text += "Steps:\n" + "\n".join([f"  - {s.get('title', 'N/A')}" for s in current_plan_obj.get('steps', [])])

        if plan_text:
            context_parts.append(f"Current Research Plan:\n{plan_text}\n")


    # Key Observations
    observations = full_state_values.get("observations")
    if observations:
        obs_text = "\n".join([f"- {obs[:300]}..." for obs in observations]) # Truncate long observations
        context_parts.append(f"Key Observations Gathered:\n{obs_text}\n")

    # Current Draft Report
    final_report = full_state_values.get("final_report")
    if final_report:
        context_parts.append(f"Current Draft Report (or Final Report if process ended):\n{final_report[:1000]}...\n") # Truncate long reports

    if not context_parts:
        return "No specific research state details available to analyze."

    return "\n---\n".join(context_parts)

def _parse_expert_llm_output(llm_output: str) -> ExpertFeedbackResponse:
    """
    Parses the structured text output from the expert LLM into an ExpertFeedbackResponse object.
    """
    raw_output = llm_output # Keep the raw output

    def extract_section(text: str, heading: str) -> str:
        match = re.search(rf"^\s*##\s*{re.escape(heading)}\s*\n(.*?)(?=\n\s*##\s*|\Z)", text, re.DOTALL | re.MULTILINE)
        return match.group(1).strip() if match else ""

    def extract_list_items(section_text: str) -> List[str]:
        if not section_text:
            return []
        # Handles lines starting with '-' or '*' or numbers like '1.'
        items = re.findall(r"^\s*[-*]\s*(.+)$|^\s*[0-9]+\.\s*(.+)$", section_text, re.MULTILINE)
        # items will be a list of tuples, e.g., [('Item 1 text', ''), ('', 'Item 2 text')]
        # We need to filter out empty strings and take the non-empty part of each tuple.
        return [item[0] or item[1] for item in items if item[0] or item[1]]

    process_judgment = extract_section(llm_output, "Process Judgment")
    current_beliefs_text = extract_section(llm_output, "Current Beliefs & Conclusions")
    challenging_viewpoints_text = extract_section(llm_output, "Challenging Viewpoints & Alternative Perspectives")
    further_research_questions_text = extract_section(llm_output, "Further Research Questions")

    current_beliefs = extract_list_items(current_beliefs_text)
    challenging_viewpoints = extract_list_items(challenging_viewpoints_text)
    further_research_questions = extract_list_items(further_research_questions_text)
    
    # Fallback if parsing fails for some sections but we have raw output
    if not process_judgment and not current_beliefs and not challenging_viewpoints and not further_research_questions and raw_output:
        logger.warning("Failed to parse structured expert feedback, using raw output for judgment.")
        process_judgment = "Could not parse structured feedback. See raw output."

    return ExpertFeedbackResponse(
        process_judgment=process_judgment,
        current_beliefs=current_beliefs,
        challenging_viewpoints=challenging_viewpoints,
        further_research_questions=further_research_questions,
        raw_llm_output=raw_output
    )

async def generate_expert_feedback(
    thread_id: str,
    graph_executable: LangGraphExecutable,
    # config: Optional[Dict[str, Any]] = None # For runtime_llm_configs if needed
) -> ExpertFeedbackResponse:
    """
    Generates expert feedback on the current state of the research for a given thread_id.
    """
    logger.info(f"Generating expert feedback for thread_id: {thread_id}")

    try:
        # 1. Fetch current full graph state
        graph_config = {"configurable": {"thread_id": thread_id}}
        latest_snapshot = graph_executable.get_state(graph_config)
        
        if not latest_snapshot:
            logger.warning(f"No state found for thread_id: {thread_id}. Cannot generate expert feedback.")
            return ExpertFeedbackResponse(
                process_judgment="No state found for this thread.",
                current_beliefs=[],
                challenging_viewpoints=[],
                further_research_questions=[],
                raw_llm_output="No state snapshot available."
            )
        
        full_state_values: State = latest_snapshot.values # type: ignore

        # 2. Format graph state for LLM context
        expert_llm_context = _format_graph_state_for_expert_llm(full_state_values)

        # 3. Prepare prompt for the expert LLM
        prompt_input_state = {"expert_llm_context": expert_llm_context}
        
        expert_llm_messages = apply_prompt_template(
            "expert_coordinator_feedback",
            prompt_input_state, # type: ignore
        )
        
        # 4. Invoke the expert LLM
        expert_llm_role = AGENT_LLM_MAP.get("reasoning", "reasoning")
        llm = get_llm_by_type(
            expert_llm_role, # type: ignore
        )
        
        logger.debug(f"Expert feedback LLM prompt messages: {expert_llm_messages}")
        response = await llm.ainvoke(expert_llm_messages)
        llm_output_text = response.content if hasattr(response, 'content') else str(response)
        logger.info("Expert LLM generated feedback.")
        logger.debug(f"Raw expert LLM output:\n{llm_output_text}")

        # 5. Parse LLM output
        parsed_feedback = _parse_expert_llm_output(llm_output_text)
        return parsed_feedback

    except Exception as e:
        logger.error(f"Error generating expert feedback for thread_id {thread_id}: {e}", exc_info=True)
        return ExpertFeedbackResponse(
            process_judgment=f"Error generating feedback: {str(e)}",
            current_beliefs=[],
            challenging_viewpoints=[],
            further_research_questions=[],
            raw_llm_output=f"An error occurred: {str(e)}"
        )
