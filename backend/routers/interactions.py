from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models import Interaction
from database import get_db
from models.schemas import InteractionCreate, InteractionUpdate
from tools.hcp_tools import call_llm
from datetime import datetime

router = APIRouter()


@router.post("/", status_code=201)
async def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    # Use LLM to generate AI summary
    try:
        summary = call_llm(
            f"Summarize in 2 sentences: {data.hcp_name} meeting, "
            f"topics: {data.topics_discussed}, outcomes: {data.outcomes}"
        )
    except Exception:
        summary = f"Meeting with {data.hcp_name} on {data.date}."

    # Create the DB record
    interaction = Interaction(
        hcp_name=data.hcp_name,
        interaction_type=data.interaction_type,
        date=data.date,
        time=data.time,
        attendees=data.attendees,
        topics_discussed=data.topics_discussed,
        materials_shared=data.materials_shared or [],
        samples_distributed=data.samples_distributed or [],
        sentiment=data.sentiment,
        outcomes=data.outcomes,
        follow_up_actions=data.follow_up_actions,
        ai_summary=summary,
        follow_up_suggestions=[],
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return _serialize(interaction)


@router.get("/")
async def list_interactions(db: Session = Depends(get_db)):
    interactions = db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    return [_serialize(i) for i in interactions]


@router.get("/{interaction_id}")
async def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")
    return _serialize(interaction)


@router.patch("/{interaction_id}")
async def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    for key, value in updates.items():
        setattr(interaction, key, value)

    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return _serialize(interaction)


@router.delete("/{interaction_id}")
async def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(interaction)
    db.commit()
    return {"message": f"Interaction {interaction_id} deleted"}


def _serialize(i: Interaction) -> dict:
    """Convert SQLAlchemy model to plain dict"""
    return {
        "id": i.id,
        "hcp_name": i.hcp_name,
        "interaction_type": i.interaction_type,
        "date": i.date,
        "time": i.time,
        "attendees": i.attendees,
        "topics_discussed": i.topics_discussed,
        "materials_shared": i.materials_shared or [],
        "samples_distributed": i.samples_distributed or [],
        "sentiment": i.sentiment,
        "outcomes": i.outcomes,
        "follow_up_actions": i.follow_up_actions,
        "ai_summary": i.ai_summary,
        "follow_up_suggestions": i.follow_up_suggestions or [],
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }