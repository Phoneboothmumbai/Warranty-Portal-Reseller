"""
AI Support Triage Service
Handles AI-powered troubleshooting before ticket creation
"""
import logging
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# System prompt for IT support triage
SYSTEM_PROMPT = """You are an AI IT Support Assistant for a warranty and asset tracking portal. Your role is to help users troubleshoot technical issues before creating a support ticket.

GUIDELINES:
1. Be friendly, concise, and professional
2. Ask clarifying questions to understand the issue
3. Provide step-by-step troubleshooting solutions
4. Focus on common IT issues: printers, network, software, hardware, devices
5. If you have device/warranty context provided, reference it helpfully
6. Keep responses short (2-4 sentences max unless providing steps)

ESCALATION RULES:
- If the issue requires physical repair, escalate
- If troubleshooting doesn't work after 2-3 attempts, offer to create a ticket
- If user asks for human support, acknowledge and offer ticket creation
- For warranty claims or returns, escalate immediately

When you cannot resolve the issue, respond with:
"I understand this needs further attention. Would you like me to create a support ticket for our technical team?"

NEVER:
- Make up information about warranties or devices
- Suggest risky actions (registry edits, BIOS changes) without warning
- Provide information outside IT support scope"""


async def get_ai_response(
    session_id: str,
    user_message: str,
    message_history: list,
    device_context: Optional[dict] = None
) -> dict:
    """
    Get AI response for support chat.
    
    Args:
        session_id: Unique session identifier
        user_message: Current user message
        message_history: Previous messages in conversation
        device_context: Optional device/warranty info for context
    
    Returns:
        dict with 'response' and 'should_escalate' flag
    """
    if not EMERGENT_LLM_KEY:
        logger.error("EMERGENT_LLM_KEY not configured")
        return {
            "response": "AI support is temporarily unavailable. Please create a ticket directly.",
            "should_escalate": True,
            "error": "AI not configured"
        }
    
    try:
        # Build context-aware system message
        system_message = SYSTEM_PROMPT
        
        if device_context:
            device_info = f"""

DEVICE CONTEXT (User selected this device):
- Device: {device_context.get('device_name', 'N/A')} ({device_context.get('device_type', 'N/A')})
- Serial Number: {device_context.get('serial_number', 'N/A')}
- Model: {device_context.get('model', 'N/A')}
- Warranty Status: {device_context.get('warranty_status', 'Unknown')}
- Warranty Expires: {device_context.get('warranty_end_date', 'N/A')}

Use this information to provide relevant troubleshooting for this specific device."""
            system_message += device_info
        
        # Initialize chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        # Add message history to chat context
        for msg in message_history:
            if msg.get("role") == "user":
                await chat.send_message(UserMessage(text=msg["content"]))
            # Assistant messages are automatically tracked
        
        # Send current message
        msg = UserMessage(text=user_message)
        response = await chat.send_message(msg)
        
        # Check if AI suggests escalation
        should_escalate = any(phrase in response.lower() for phrase in [
            "create a support ticket",
            "create a ticket",
            "technical team",
            "escalate",
            "human support",
            "further attention",
            "service technician"
        ])
        
        return {
            "response": response,
            "should_escalate": should_escalate,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"AI support error: {str(e)}")
        return {
            "response": "I'm having trouble processing your request. Would you like to create a support ticket instead?",
            "should_escalate": True,
            "error": str(e)
        }


def generate_ticket_summary(messages: list) -> dict:
    """
    Generate ticket subject and description from chat history.
    
    Args:
        messages: List of chat messages
    
    Returns:
        dict with 'subject' and 'description'
    """
    if not messages:
        return {"subject": "Support Request", "description": ""}
    
    # Get first user message as base for subject
    first_user_msg = next((m["content"] for m in messages if m["role"] == "user"), "")
    
    # Truncate for subject (max 100 chars)
    subject = first_user_msg[:100]
    if len(first_user_msg) > 100:
        subject = subject.rsplit(' ', 1)[0] + "..."
    
    # Build description from conversation
    description_parts = ["**AI Troubleshooting Attempted:**\n"]
    for msg in messages:
        role = "User" if msg["role"] == "user" else "AI Assistant"
        description_parts.append(f"**{role}:** {msg['content']}\n")
    
    description_parts.append("\n---\n*Issue could not be resolved via AI troubleshooting.*")
    
    return {
        "subject": subject or "Support Request",
        "description": "\n".join(description_parts)
    }
