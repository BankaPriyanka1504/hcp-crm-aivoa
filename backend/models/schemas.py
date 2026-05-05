from pydantic import BaseModel
from typing import Optional, List


class InteractionCreate(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    date: str
    time: str
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = []
    samples_distributed: Optional[List[str]] = []
    sentiment: str = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = None
    samples_distributed: Optional[List[str]] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class AgentResponse(BaseModel):
    response: str
    action_taken: Optional[str] = None