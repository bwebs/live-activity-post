from pydantic import BaseModel, Field
from typing import Optional, Any
import os
import json

# Import Pydantic AI
try:
    from pydantic_ai import Agent
except ImportError:
    Agent = None

# Define the output structure for the Live Activity
class LiveActivityUpdate(BaseModel):
    headline: str = Field(description="A short, catchy headline for the notification")
    status_text: str = Field(description="A brief status update (e.g., 'Order Picked Up', 'Goal Scored')")
    progress: float = Field(description="A number between 0.0 and 1.0 indicating progress", ge=0.0, le=1.0)
    alert_title: Optional[str] = Field(description="Title for the alert", default=None)

# Mock AI Agent function
async def process_payload_with_ai(payload: Any) -> LiveActivityUpdate:
    """
    Uses an LLM to interpret the payload and generate a Live Activity update.
    """

    # Check for OpenAI Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not found. Returning mock response.")
        return LiveActivityUpdate(
            headline="New Event",
            status_text=f"Received: {str(payload)[:20]}...",
            progress=0.5,
            alert_title="Webhook Received"
        )

    # Use Pydantic AI if available and key is present
    if Agent:
        try:
            # Example Pydantic AI usage
            # agent = Agent('openai:gpt-4', result_type=LiveActivityUpdate)
            # result = await agent.run(f"Process this webhook payload into a live activity update: {payload}")
            # return result.data
            pass
        except Exception as e:
            print(f"Error using Pydantic AI: {e}")

    # Fallback/Simulation Logic
    if isinstance(payload, dict):
        event = payload.get("event", "Update")
        value = payload.get("value", 0.5)
        # normalize value if possible
        try:
            val_float = float(value)
            if val_float > 1: val_float = 1.0
        except:
            val_float = 0.5

        return LiveActivityUpdate(
            headline=f"Event: {event}",
            status_text=f"Processed event {event}",
            progress=val_float,
            alert_title=event
        )

    return LiveActivityUpdate(
        headline="New Message",
        status_text=str(payload)[:50],
        progress=0.5,
        alert_title="Update"
    )
