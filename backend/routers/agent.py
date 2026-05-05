from fastapi import APIRouter, HTTPException
from models.schemas import ChatMessage, AgentResponse
from agents.hcp_agent import run_agent

router = APIRouter()

@router.post("/chat", response_model=AgentResponse)
async def chat(msg: ChatMessage):
    try:
        result = run_agent(msg.message, msg.session_id)
        return AgentResponse(response=result["response"], action_taken=result.get("action_taken"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))