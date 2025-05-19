from typing import List, Optional

from pydantic import BaseModel


class KGNode(BaseModel):
    """
    Represents a node in the knowledge graph visualization.
    """

    id: str
    label: str
    status: str  # e.g., "pending", "active", "completed", "error", "final_completed"
    type: Optional[str] = None
    error_message: Optional[str] = None


class KGEdge(BaseModel):
    """
    Represents an edge in the knowledge graph visualization.
    """

    id: str
    source: str  # ID of the source KGNode
    target: str  # ID of the target KGNode
    label: Optional[str] = None  # e.g., "transition", "defined"
    type: Optional[str] = None  # e.g., "static", "dynamic_traversed"


class KnowledgeGraphResponse(BaseModel):
    """
    Represents the overall structure of the knowledge graph for API response.
    """

    nodes: List[KGNode]
    edges: List[KGEdge]
