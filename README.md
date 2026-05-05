# HCP CRM – AI-First Log Interaction Module

An AI-powered CRM system for pharmaceutical field sales reps to log and manage interactions with Healthcare Professionals (HCPs).

---

## Features

- Log HCP interactions via structured form or conversational AI chat
- LangGraph AI agent with 5 tools for sales activities
- AI-powered summarization and sentiment analysis using Groq LLM
- Persistent data storage with SQLite
- React frontend with Redux state management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Redux |
| Backend | Python, FastAPI |
| AI Agent | LangGraph |
| LLM | Groq (llama-3.3-70b-versatile) |
| Database | SQLite (can swap to PostgreSQL via DATABASE_URL) |

---

## LangGraph Tools

1. **log_interaction** – Logs a new HCP interaction with AI summarization and entity extraction
2. **edit_interaction** – Modifies an existing logged interaction
3. **get_hcp_history** – Retrieves past interaction history with trend analysis
4. **analyze_sentiment** – Analyzes the sentiment and tone of an interaction
5. **suggest_follow_up** – Generates AI-powered personalized follow-up recommendations

---

## Project Structure

```
hcp-crm-aivoa/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # Database connection (SQLAlchemy)
│   ├── models/
│   │   └── __init__.py      # Database table models
│   ├── routers/
│   │   ├── interactions.py  # Interaction CRUD endpoints
│   │   ├── hcps.py          # HCP listing endpoint
│   │   └── agent.py         # AI chat endpoint
│   ├── agents/
│   │   └── hcp_agent.py     # LangGraph agent logic
│   ├── tools/
│   │   └── hcp_tools.py     # All 5 LangGraph tools
│   └── models/
│       └── schemas.py       # Pydantic schemas
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── store/           # Redux store
    │   └── App.js
    └── package.json
```

---

## How to Run

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy langchain-groq langgraph groq python-dotenv langchain-core

# Create .env file
echo GROQ_API_KEY=your_groq_api_key_here > .env
echo DATABASE_URL=sqlite:///./hcp_crm.db >> .env

# Run the server
python main.py
```

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: http://localhost:3000

---

## Environment Variables

Create a `.env` file in the `backend/` folder:

```
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./hcp_crm.db
```

> For production, replace DATABASE_URL with a PostgreSQL connection string.

---

## Notes

- SQLite is used for local development. Switch to PostgreSQL by updating `DATABASE_URL` in `.env`
- All AI features powered by Groq's `llama-3.3-70b-versatile` model
- Database tables and default HCPs are auto-created on first startup