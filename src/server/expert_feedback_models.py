from typing import List, Optional
from pydantic import BaseModel

class ExpertFeedbackRequest(BaseModel):
    """
    Request model for triggering expert feedback generation.
    Currently empty as thread_id is expected as a path parameter.
    Can be extended if specific request body parameters are needed in the future.
    """
    pass # No specific body parameters needed for now if thread_id is a path param

class ExpertFeedbackResponse(BaseModel):
    """
    Response model for the structured expert feedback.
    """
    process_judgment: str
    current_beliefs: List[str]
    challenging_viewpoints: List[str]
    further_research_questions: List[str]
    raw_llm_output: str # For debugging or if structured parsing fails
