from typing import Any, List, Dict
import logging

from src.graph_visualization.serializer import serialize_langgraph_state_for_thread
from src.graph_visualization.models import KnowledgeGraphResponse, KGNode, KGEdge
from src.llms.llm import get_llm_by_type, AGENT_LLM_MAP

# from src.prompts.template import apply_prompt_template # Not used in this V1

# Placeholder for graph_executable type, typically a LangGraph CompiledGraph
LangGraphExecutable = Any

logger = logging.getLogger(__name__)


def _format_graph_state_for_llm(graph_response: KnowledgeGraphResponse) -> str:
    """
    Formats the KnowledgeGraphResponse into a concise textual representation for an LLM.
    """
    if not graph_response:
        return "No graph state available."

    text_parts = ["Current Workflow Graph State:"]

    text_parts.append("\nNodes:")
    if not graph_response.nodes:
        text_parts.append("  - No nodes found.")
    else:
        for node in graph_response.nodes:
            node_info = (
                f'  - Node ID: {node.id}, Label: "{node.label}", Status: {node.status}'
            )
            if node.status == "error" and node.error_message:
                node_info += f', Error: "{node.error_message}"'
            text_parts.append(node_info)

    text_parts.append("\nEdges (Dynamic Transitions - actual path taken):")
    dynamic_edges = [
        edge for edge in graph_response.edges if edge.type == "dynamic_traversed"
    ]
    if not dynamic_edges:
        text_parts.append("  - No dynamic transitions found in this execution.")
    else:
        for edge in dynamic_edges:
            edge_info = f"  - From: {edge.source} To: {edge.target}"
            if edge.label:
                edge_info += f' (Label: "{edge.label}")'
            text_parts.append(edge_info)

    static_edges = [edge for edge in graph_response.edges if edge.type == "static"]
    if static_edges:
        text_parts.append(
            "\nDefined Static Edges (potential paths, not necessarily traversed in this execution):"
        )
        for edge in static_edges:
            edge_info = f"  - From: {edge.source} To: {edge.target}"
            if edge.label:
                edge_info += f' (Label: "{edge.label}")'
            text_parts.append(edge_info)

    active_nodes = [
        node.label for node in graph_response.nodes if node.status == "active"
    ]
    if active_nodes:
        text_parts.append(f"\nCurrently Active Node(s): {', '.join(active_nodes)}")
    else:
        final_completed_nodes = [
            node.label
            for node in graph_response.nodes
            if node.status == "final_completed"
        ]
        error_nodes = [
            node.label for node in graph_response.nodes if node.status == "error"
        ]

        if final_completed_nodes:
            text_parts.append(
                f"\nWorkflow appears to have completed. Node(s) leading to end: {', '.join(final_completed_nodes)}"
            )
        elif error_nodes:
            text_parts.append(
                f"\nWorkflow appears to have terminated due to error(s) in node(s): {', '.join(error_nodes)}"
            )
        else:
            # Check if all nodes are pending or completed (but not final_completed)
            all_pending_or_completed = all(
                n.status in ["pending", "completed"] for n in graph_response.nodes
            )
            if all_pending_or_completed and not any(
                n.status == "active" for n in graph_response.nodes
            ):
                text_parts.append(
                    "\nWorkflow is idle or has not started processing effectively."
                )
            else:
                text_parts.append(
                    "\nWorkflow state is unclear or no nodes are currently active or marked as final_completed."
                )

    return "\n".join(text_parts)


async def answer_graph_question(
    thread_id: str, user_question: str, graph_executable: LangGraphExecutable
) -> str:
    """
    Answers a user's question about the current state of the workflow graph.
    """
    logger.info(
        f"Answering graph question for thread_id='{thread_id}': \"{user_question}\""
    )

    try:
        # 1. Get the current graph state
        graph_state_response = serialize_langgraph_state_for_thread(
            graph_executable, thread_id
        )

        # 2. Format the graph state for the LLM
        graph_context = _format_graph_state_for_llm(graph_state_response)

        # 3. Craft the prompt
        prompt_content = f"""You are an AI assistant helping a user understand the current state of a complex workflow graph.
Your task is to answer the user's question based ONLY on the following graph state information.
Do not make assumptions or use any external knowledge. If the information to answer the question is not present in the provided graph state, clearly state that.

Workflow Graph State:
---
{graph_context}
---

User's Question: {user_question}

Answer:"""

        # 4. Get an LLM instance
        # Using "coordinator" LLM type as a default, can be configured.
        llm_type_str = AGENT_LLM_MAP.get("coordinator", "default")
        llm = get_llm_by_type(llm_type_str)  # type: ignore

        # 5. Invoke the LLM
        logger.debug(f"Graph Chatbot Prompt for LLM:\n{prompt_content}")
        response = await llm.ainvoke(prompt_content)

        answer = response.content if hasattr(response, "content") else str(response)
        logger.info(f'LLM Answer for graph question: "{answer}"')

        return answer

    except Exception as e:
        logger.error(
            f"Error in answer_graph_question for thread_id {thread_id}: {e}",
            exc_info=True,
        )
        return "I'm sorry, but I encountered an error trying to answer your question about the graph."
