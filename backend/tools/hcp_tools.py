import json
from datetime import datetime
from langchain_core.tools import tool
from groq import Groq
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def get_db_session() -> Session:
    """Get a database session for use inside tools"""
    from database import SessionLocal
    return SessionLocal()


def call_llm(prompt: str, system: str = "You are a helpful pharma CRM assistant.") -> str:
    response = groq_client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1024,
    )
    return response.choices[0].message.content


def safe_json_parse(raw: str, fallback: dict) -> dict:
    try:
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break
        return json.loads(clean)
    except Exception:
        return fallback


@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    date: str,
    time: str,
    topics_discussed: str,
    outcomes: str = "",
    attendees: str = "",
    sentiment: str = "Neutral",
    materials_shared: str = "",
    samples_distributed: str = "",
) -> str:
    """
    Log a new HCP interaction with AI summarization and entity extraction.
    Use this tool when a sales rep describes meeting or calling a doctor/HCP.
    hcp_name: full name of the doctor/HCP.
    interaction_type: Meeting, Call, Email, Conference, etc.
    date: date in YYYY-MM-DD format, use today's date if not specified.
    time: time in HH:MM format, use 09:00 if not specified.
    topics_discussed: what was discussed during the interaction.
    outcomes: what was agreed or decided.
    sentiment: Positive, Neutral, or Negative based on HCP reaction.
    """
    from models import Interaction

    llm_prompt = f"""Analyze this HCP interaction. Respond ONLY with valid JSON, no markdown:
{{
  "summary": "2 sentence professional summary",
  "inferred_sentiment": "Positive or Neutral or Negative",
  "follow_up_suggestions": ["action 1", "action 2", "action 3"]
}}

HCP: {hcp_name}
Type: {interaction_type}
Topics: {topics_discussed}
Outcomes: {outcomes}
Sentiment: {sentiment}"""

    ai_data = safe_json_parse(
        call_llm(llm_prompt, "You are a pharma CRM AI. Return only valid JSON, no markdown."),
        {
            "summary": f"Meeting with {hcp_name} about {topics_discussed[:80]}.",
            "inferred_sentiment": sentiment,
            "follow_up_suggestions": ["Schedule follow-up", "Send materials", "Update CRM"]
        }
    )

    # Save to database
    db = get_db_session()
    try:
        record = Interaction(
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            date=date,
            time=time,
            attendees=attendees,
            topics_discussed=topics_discussed,
            outcomes=outcomes,
            sentiment=ai_data.get("inferred_sentiment", sentiment),
            materials_shared=[m.strip() for m in materials_shared.split(",") if m.strip()],
            samples_distributed=[s.strip() for s in samples_distributed.split(",") if s.strip()],
            ai_summary=ai_data.get("summary", ""),
            follow_up_suggestions=ai_data.get("follow_up_suggestions", []),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        iid = record.id
    finally:
        db.close()

    return json.dumps({
        "success": True,
        "interaction_id": iid,
        "message": f"Interaction with {hcp_name} logged successfully.",
        "ai_summary": ai_data.get("summary", ""),
        "follow_up_suggestions": ai_data.get("follow_up_suggestions", []),
        "sentiment": ai_data.get("inferred_sentiment", sentiment),
    })


@tool
def edit_interaction(interaction_id: int, field: str, new_value: str) -> str:
    """
    Edit a specific field of an existing logged HCP interaction.
    Use when a user wants to update or correct a previously logged interaction.
    interaction_id: the numeric ID of the interaction to edit.
    field: field name to update - topics_discussed, outcomes, sentiment, follow_up_actions, or attendees.
    new_value: the new value to set for that field.
    """
    from models import Interaction

    db = get_db_session()
    try:
        record = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not record:
            return json.dumps({"success": False, "error": f"Interaction {interaction_id} not found."})

        old_value = str(getattr(record, field, "N/A"))
        setattr(record, field, new_value)
        record.updated_at = datetime.utcnow()

        # Regenerate AI summary if key fields changed
        if field in ["topics_discussed", "outcomes"]:
            try:
                record.ai_summary = call_llm(
                    f"Write a 2-sentence summary: HCP={record.hcp_name}, "
                    f"Topics={record.topics_discussed}, Outcomes={record.outcomes}"
                )
            except Exception:
                pass

        db.commit()
    finally:
        db.close()

    return json.dumps({
        "success": True,
        "interaction_id": interaction_id,
        "field_updated": field,
        "old_value": old_value,
        "new_value": new_value,
        "message": f"Interaction #{interaction_id} updated successfully.",
    })


@tool
def get_hcp_history(hcp_name: str, limit: int = 5) -> str:
    """
    Retrieve past interaction history for a specific HCP with trend analysis.
    Use when asked about history, past meetings, or previous interactions with a doctor.
    hcp_name: the name of the HCP or doctor to look up.
    limit: maximum number of interactions to return, default is 5.
    """
    from models import Interaction

    try:
        limit = int(limit)
    except (ValueError, TypeError):
        limit = 5

    db = get_db_session()
    try:
        history = (
            db.query(Interaction)
            .filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))
            .order_by(Interaction.created_at.desc())
            .limit(limit)
            .all()
        )

        if not history:
            return json.dumps({
                "success": True,
                "hcp_name": hcp_name,
                "total_interactions": 0,
                "trend_analysis": f"No interactions found for {hcp_name} yet.",
                "interactions": [],
            })

        history_text = "\n".join([
            f"- {i.date}: {i.interaction_type} | Sentiment: {i.sentiment} | {(i.topics_discussed or '')[:60]}"
            for i in history
        ])

        try:
            trend = call_llm(
                f"In 2 sentences, summarize engagement trend with {hcp_name}:\n{history_text}",
                "You are a pharma CRM analyst. Be concise."
            )
        except Exception:
            trend = f"Found {len(history)} interaction(s) with {hcp_name}."

        return json.dumps({
            "success": True,
            "hcp_name": hcp_name,
            "total_interactions": len(history),
            "trend_analysis": trend,
            "interactions": [
                {
                    "id": i.id,
                    "date": i.date,
                    "type": i.interaction_type,
                    "summary": i.ai_summary or "",
                    "sentiment": i.sentiment,
                }
                for i in history
            ],
        })
    finally:
        db.close()


@tool
def analyze_sentiment(interaction_text: str, hcp_name: str = "") -> str:
    """
    Analyze the sentiment and emotional tone of an HCP interaction description.
    Use this tool ONLY when asked to analyze sentiment, tone, or how a doctor reacted.
    Do NOT use this for logging interactions - use log_interaction for that.
    interaction_text: the text description of the interaction to analyze.
    hcp_name: optional name of the HCP for additional context.
    """
    prompt = f"""Analyze this pharma HCP interaction for sentiment. Return ONLY valid JSON, no markdown:
{{
  "overall_sentiment": "Positive or Neutral or Negative",
  "confidence": 0.85,
  "engagement_level": "High or Medium or Low",
  "receptivity_to_product": "High or Medium or Low or Unknown",
  "key_indicators": ["indicator1", "indicator2"],
  "recommended_approach": "one sentence suggestion for next interaction"
}}

HCP: {hcp_name if hcp_name else "Unknown"}
Description: {interaction_text}"""

    fallback = {
        "overall_sentiment": "Neutral",
        "confidence": 0.5,
        "engagement_level": "Medium",
        "receptivity_to_product": "Unknown",
        "key_indicators": ["Hesitant behavior noted", "Questions about side effects"],
        "recommended_approach": "Address concerns with clinical data and patient case studies."
    }

    result = safe_json_parse(
        call_llm(prompt, "You are a sentiment analyst for pharma CRM. Return only valid JSON."),
        fallback
    )
    result["success"] = True
    return json.dumps(result)


@tool
def suggest_follow_up(
    hcp_name: str,
    last_interaction_summary: str,
    sentiment: str = "Neutral",
    product_discussed: str = "",
) -> str:
    """
    Generate AI-powered personalized follow-up action suggestions for an HCP.
    Use when asked for follow-up recommendations, next steps, or what to do after a meeting.
    hcp_name: name of the HCP or doctor.
    last_interaction_summary: brief description of the last meeting or interaction.
    sentiment: the sentiment from the last interaction - Positive, Neutral, or Negative.
    product_discussed: the drug or product that was discussed, if any.
    """
    prompt = f"""Generate specific follow-up actions for a pharma sales rep. Return ONLY valid JSON, no markdown:
{{
  "immediate_actions": ["action within 48 hours"],
  "short_term_actions": ["action within 1-2 weeks"],
  "long_term_strategy": "2 sentence engagement strategy",
  "suggested_materials": ["material to send"],
  "optimal_contact_timing": "best day and time recommendation",
  "talking_points": ["key point 1", "key point 2", "key point 3"]
}}

HCP: {hcp_name}
Last Interaction: {last_interaction_summary}
Sentiment: {sentiment}
Product: {product_discussed if product_discussed else "Not specified"}"""

    fallback = {
        "immediate_actions": ["Send thank-you email within 24 hours", "Share requested materials"],
        "short_term_actions": ["Schedule follow-up meeting in 2 weeks"],
        "long_term_strategy": f"Maintain regular contact with {hcp_name} every 2-3 weeks.",
        "suggested_materials": ["Product efficacy brochure", "Clinical trial summary"],
        "optimal_contact_timing": "Tuesday or Wednesday mornings 9-11 AM",
        "talking_points": ["Latest efficacy data", "Patient outcomes", "Upcoming CME events"]
    }

    result = safe_json_parse(
        call_llm(prompt, "You are a pharma sales coach. Return only valid JSON."),
        fallback
    )
    result["success"] = True
    result["hcp_name"] = hcp_name
    return json.dumps(result)


ALL_TOOLS = [log_interaction, edit_interaction, get_hcp_history, analyze_sentiment, suggest_follow_up]