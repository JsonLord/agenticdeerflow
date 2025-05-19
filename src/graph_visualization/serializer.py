
from typing import List, Dict, Optional, Any

# LangGraph imports
from langgraph.graph import START, END
try:
    # StateSnapshot is returned by CompiledGraph.get_state() and by get_state_history()
    from langgraph.graph.state import StateSnapshot
except ImportError:
    # Fallback if the typical import path changes or for different LangGraph versions
    # This is a general placeholder; specific handling might be needed if StateSnapshot is deeply internal.
    StateSnapshot = Any # type: ignore

# Project-specific imports
from src.graph_visualization.models import KGNode, KGEdge, KnowledgeGraphResponse
from src.graph.types import State # State type will be used in Part 2 & 3 for inspecting snapshot.values

# Placeholder for graph_executable type, typically a LangGraph CompiledGraph
LangGraphExecutable = Any


def serialize_langgraph_state_for_thread(
    graph_executable: LangGraphExecutable,
    thread_id: str
) -> KnowledgeGraphResponse:
    """
    Serializes the state of a LangGraph executable for a given thread_id.
    Part 1: Initializes nodes, fetches history, and handles basic edge cases.
    Part 2: Processes state history for node statuses and dynamic edges.
    """
    # 1. Initialization
    nodes_map: Dict[str, KGNode] = {}
    edges_list: List[KGEdge] = []
    processed_edges: set = set()

    # 2. Populate Base Nodes
    # graph_executable.nodes is a dict-like object {name: node_runnable}
    # START and END are special markers and not typically in graph_executable.nodes
    defined_node_names = list(graph_executable.nodes.keys())
    for name in defined_node_names:
        # Skip START and END if they somehow appear in .nodes, though they usually don't.
        # Actual graph nodes are what we care about here.
        if name == START or name == END:
            continue
        nodes_map[name] = KGNode(
            id=name,
            label=name.replace("_node", "").replace("_", " ").title(), # Prettify label
            status="pending",  # Default status
            error_message=None # Initialize error_message
        )

    # 3. Fetch State History
    config = {"configurable": {"thread_id": thread_id}}
    history: List[StateSnapshot] = []

    try:
        # get_state_history() returns a list of StateSnapshot objects
        fetched_history = graph_executable.get_state_history(config)
        if fetched_history is not None: # Ensure it's not None before trying to listify
            history = list(fetched_history)
    except Exception as e:
        # Log this error appropriately in a real application
        print(f"Warning: Could not retrieve full history for thread {thread_id}: {e}")
        try:
            # get_state() returns a single StateSnapshot or None
            latest_state_snapshot = graph_executable.get_state(config)
            if latest_state_snapshot:
                history.append(latest_state_snapshot)
        except Exception as e_latest:
            print(f"Error: Could not retrieve any state for thread {thread_id}: {e_latest}")
            # If no history and no latest state, return nodes as pending
            return KnowledgeGraphResponse(nodes=list(nodes_map.values()), edges=edges_list)

    if not history:
        # This case is hit if history retrieval was empty and latest state also failed or was empty.
        return KnowledgeGraphResponse(nodes=list(nodes_map.values()), edges=edges_list)

    # 4. Process State History (Part 2)
    for i, current_snapshot in enumerate(history):
        # Type hint for current_state_values for better autocompletion and clarity
        current_state_values: State = current_snapshot.values # type: ignore
        decision_making_node_id: str = current_snapshot.name  # Node making the decision

        # Determine the node that EXECUTED to produce current_snapshot.values
        executed_node_id: Optional[str] = None
        if i == 0:  # First snapshot in history
            if decision_making_node_id != START and decision_making_node_id in nodes_map:
                executed_node_id = decision_making_node_id
                # Mark as active initially; will be updated to completed/error if it transitions
                if nodes_map[executed_node_id].status == "pending":
                    nodes_map[executed_node_id].status = "active"
        else:  # Not the first snapshot
            prev_snapshot = history[i - 1]
            if prev_snapshot.next and prev_snapshot.next[0] != END and prev_snapshot.next[0] in nodes_map:
                executed_node_id = prev_snapshot.next[0]

        # Update status of the executed_node_id based on current_snapshot.values
        if executed_node_id and executed_node_id in nodes_map:  # Ensure executed_node_id is valid
            # Assuming State has node_errors: Dict[str, str]
            node_errors_in_current_state = current_state_values.get("node_errors", {})
            if executed_node_id in node_errors_in_current_state:
                nodes_map[executed_node_id].status = "error"
                nodes_map[executed_node_id].error_message = node_errors_in_current_state[executed_node_id]
            else:
                # Default to "completed" if no error. This might be overridden by "active" or "final_completed" later.
                if nodes_map[executed_node_id].status != "error":  # Don't override if already marked error
                    nodes_map[executed_node_id].status = "completed"

        # Process the decision_making_node_id (current_snapshot.name) and its transitions (current_snapshot.next)
        if decision_making_node_id != START and decision_making_node_id in nodes_map:
            # If this node was pending, it means it's now active because it's about to make a decision / has just run
            if nodes_map[decision_making_node_id].status == "pending":
                nodes_map[decision_making_node_id].status = "active"

            if current_snapshot.next:
                for target_node_id in current_snapshot.next:
                    if target_node_id == END:
                        # The decision_making_node_id led to END
                        if nodes_map[decision_making_node_id].status not in ["error", "final_completed"]:
                            nodes_map[decision_making_node_id].status = "final_completed"
                        continue  # Don't draw an edge to the conceptual END node

                    if target_node_id in nodes_map:  # Ensure target is a known node
                        edge_id = f"{decision_making_node_id}_to_{target_node_id}"
                        if edge_id not in processed_edges:
                            edges_list.append(KGEdge(
                                id=edge_id,
                                source=decision_making_node_id,
                                target=target_node_id,
                                label="transition",  # Dynamic edges are transitions
                                type="dynamic_traversed"
                            ))
                            processed_edges.add(edge_id)
                    # else: print(f"Warning: Target node '{target_node_id}' from snapshot.next not in defined graph nodes.")


    # 5. Set the "Active" Node (Part 3)
    if history:  # Ensure history is not empty
        latest_snapshot = history[-1]
        if latest_snapshot.next and latest_snapshot.next[0] != END:
            active_node_candidate_id = latest_snapshot.next[0]
            if active_node_candidate_id in nodes_map:
                # If the candidate is 'pending' or 'completed' (looping), mark 'active'.
                # If it's 'error', it should remain 'error'.
                if nodes_map[active_node_candidate_id].status in ["pending", "completed"]:
                    nodes_map[active_node_candidate_id].status = "active"
        elif latest_snapshot.name in nodes_map and nodes_map[latest_snapshot.name].status == "completed":
            # If the graph ended (no next or next is END) and the last decision-making node was 'completed',
            # it should be 'final_completed'. This handles cases where a node completes and implicitly ends the graph.
            nodes_map[latest_snapshot.name].status = "final_completed"
        # If latest_snapshot.name was already 'final_completed' or 'error', it remains so.

    # 6. Add Static Edges (Part 3)
    # Iterate through graph_executable.edges (statically defined edges).
    # For each static edge, if it wasn't already added as a dynamic/traversed edge,
    # add it as a KGEdge with type="static" for different styling.
    for source_node_id, target_node_id in graph_executable.edges:
        # Skip START -> first_node as it's implicit, and X -> END as it's also implicit for visualization purposes.
        if source_node_id == START or target_node_id == END:
            continue
        if source_node_id not in nodes_map or target_node_id not in nodes_map:
            continue

        static_edge_id_candidate = f"{source_node_id}_to_{target_node_id}"

        # Check if a dynamic version of this edge (source -> target) already exists
        if static_edge_id_candidate not in processed_edges:
            # Ensure we don't add a duplicate static edge if somehow processed_edges was used for static ones.
            static_edge_id_final = f"{static_edge_id_candidate}_static"  # Make ID unique for static
            if static_edge_id_final not in processed_edges:
                edges_list.append(KGEdge(
                    id=static_edge_id_final,
                    source=source_node_id,
                    target=target_node_id,
                    label="defined",  # Label for static edges
                    type="static"    # Type for styling
                ))
                processed_edges.add(static_edge_id_final)

    # 7. Return KnowledgeGraphResponse (Part 3)
    return KnowledgeGraphResponse(nodes=list(nodes_map.values()), edges=edges_list)
    

