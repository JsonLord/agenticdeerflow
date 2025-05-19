from pydantic import BaseModel


class GraphChatbotRequest(BaseModel):
    """
    Request model for querying the graph chatbot.
    """

    thread_id: str
    user_question: str


class GraphChatbotResponse(BaseModel):
    """
    Response model for the graph chatbot's answer.
    """

    answer: str
