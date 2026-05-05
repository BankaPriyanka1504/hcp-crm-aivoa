from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import HCP
from database import get_db

router = APIRouter()


@router.get("/")
async def list_hcps(search: str = "", db: Session = Depends(get_db)):
    query = db.query(HCP)
    if search:
        query = query.filter(HCP.name.ilike(f"%{search}%"))
    hcps = query.all()
    return [{"id": h.id, "name": h.name, "specialty": h.specialty, "institution": h.institution} for h in hcps]