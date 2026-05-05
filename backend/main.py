from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interactions, agent, hcps
from database import engine, SessionLocal
from models import Base, HCP
import uvicorn

app = FastAPI(title="HCP CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interactions.router, prefix="/api/interactions", tags=["interactions"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(hcps.router, prefix="/api/hcps", tags=["hcps"])


@app.on_event("startup")
def startup():
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Seed default HCPs only if table is empty
    db = SessionLocal()
    try:
        if db.query(HCP).count() == 0:
            default_hcps = [
                HCP(name="Dr. Smith", specialty="Oncology", institution="City Hospital"),
                HCP(name="Dr. Patel", specialty="Cardiology", institution="Metro Clinic"),
                HCP(name="Dr. Sharma", specialty="Neurology", institution="Apollo Hospital"),
                HCP(name="Dr. Reddy", specialty="Pulmonology", institution="Care Hospital"),
                HCP(name="Dr. Rao", specialty="Endocrinology", institution="NIMS"),
            ]
            db.add_all(default_hcps)
            db.commit()
            print("[Startup] Default HCPs seeded.")
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "HCP CRM API running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)