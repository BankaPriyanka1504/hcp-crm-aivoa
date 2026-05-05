import os
import json
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from tools.hcp_tools import ALL_TOOLS
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are an AI assistant in a pharmaceutical CRM for field sales reps.
Help reps log and manage interactions with Healthcare Professionals (HCPs).

You have exactly 5 tools:
1. log_interaction - Log a new HCP meeting or call. Use when someone describes meeting a doctor.
2. edit_interaction - Modify an existing interaction. Use when someone wants to update a record.
3. get_hcp_history - Get past interactions with an HCP. Use when asked about history or past meetings.
4. analyze_sentiment - Analyze tone of an interaction. Use ONLY when asked to analyze sentiment.
5. suggest_follow_up - Generate follow-up recommendations. Use when asked for next steps.

RULES:
- When someone describes a meeting, ALWAYS use log_interaction.
- Use today's date YYYY-MM-DD format if date not given.
- Use 09:00 as default time if not specified.
- After using a tool, give a friendly helpful summary of what was done."""

session_memory: dict = {}


def run_agent(message: str, session_id: str = "default") -> dict:
    try:
        llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        llm_with_tools = llm.bind_tools(ALL_TOOLS)

        if session_id not in session_memory:
            session_memory[session_id] = []

        session_memory[session_id].append(HumanMessage(content=message))
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + session_memory[session_id]

        tool_used = None

        for iteration in range(5):
            response = llm_with_tools.invoke(messages)

            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_used = response.tool_calls[0]['name']
                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']
                    tool_call_id = tool_call['id']

                    print(f"[Agent] Tool: {tool_name} | Args: {tool_args}")

                    tool_result = None
                    for t in ALL_TOOLS:
                        if t.name == tool_name:
                            try:
                                tool_result = t.invoke(tool_args)
                            except Exception as e:
                                tool_result = json.dumps({"error": str(e), "success": False})
                            break

                    if tool_result is None:
                        tool_result = json.dumps({"error": f"Tool {tool_name} not found"})

                    print(f"[Agent] Result: {str(tool_result)[:150]}")

                    messages.append(ToolMessage(
                        content=str(tool_result),
                        tool_call_id=tool_call_id
                    ))
            else:
                ai_text = response.content
                session_memory[session_id].append(AIMessage(content=ai_text))
                return {
                    "response": ai_text or "Request processed successfully.",
                    "action_taken": tool_used,
                    "session_id": session_id,
                }

        # Fallback final response
        final = llm_with_tools.invoke(messages)
        ai_text = final.content
        session_memory[session_id].append(AIMessage(content=ai_text))
        return {
            "response": ai_text or "Request processed.",
            "action_taken": tool_used,
            "session_id": session_id,
        }

    except Exception as e:
        print(f"[Agent] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "response": f"Error: {str(e)}",
            "action_taken": None,
            "session_id": session_id,
        }