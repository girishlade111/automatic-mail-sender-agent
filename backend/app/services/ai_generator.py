import json
import logging
import re

import openai
from app.config import settings

logger = logging.getLogger(__name__)

# Cap each interpolated field so a single oversized cell can't blow up the prompt (PRD §28).
MAX_FIELD_LENGTH = 500


def _sanitize_field(value) -> str:
    """Neutralize recipient-supplied values before they are rendered into the prompt.

    Strips control characters and collapses prompt-injection markers that try to
    impersonate the system/instruction layer, then caps the length.
    """
    text = str(value)
    # Drop control chars (keep normal whitespace which is later collapsed)
    text = "".join(ch for ch in text if ch == " " or ch.isprintable())
    # Defuse common injection phrasing without altering legitimate content too aggressively
    text = re.sub(r"(?i)ignore (all|any|previous|the above)", "[redacted]", text)
    text = re.sub(r"(?i)\bsystem prompt\b", "[redacted]", text)
    text = text.strip()
    if len(text) > MAX_FIELD_LENGTH:
        text = text[:MAX_FIELD_LENGTH] + "…"
    return text


def generate_personalized_email(contact_data: dict, prompt_template: str, tone: str, length: str, temperature: float = 0.7) -> dict:
    """Calls NVIDIA NIM to generate an email. Returns a dict with 'subject' and 'body'."""
    if not settings.NVIDIA_NIM_API_KEY:
        raise ValueError("NVIDIA NIM API Key is not configured")

    logger.info("Generating email for contact: %s", contact_data.get("name", "Unknown"))

    client = openai.OpenAI(
        api_key=settings.NVIDIA_NIM_API_KEY,
        base_url=settings.NVIDIA_NIM_BASE_URL
    )

    # Replace variables in the prompt template like {{name}}, {{company}} with sanitized values
    rendered_prompt = prompt_template
    for key, value in contact_data.items():
        if value:
            rendered_prompt = rendered_prompt.replace(f"{{{{{key}}}}}", _sanitize_field(value))

    # Remove any unreplaced variables
    rendered_prompt = re.sub(r'\{\{[^}]+\}\}', '', rendered_prompt)
            
    system_prompt = (
        "You are an expert personalized email copywriter. "
        "Generate a highly personalized, human-sounding email based on the user's instructions. "
        "Do not use generic AI-like wording. "
        f"Tone: {tone or 'Professional'}. "
        f"Length constraint: {length or 'Medium'} (Short: ~50 words, Medium: ~150 words, Long: ~250 words). "
        "Output ONLY valid JSON containing 'subject' and 'body' keys."
    )
    
    # Standard NIM model for instruction following
    model_name = "meta/llama-3.3-70b-instruct"
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": rendered_prompt}
        ],
        temperature=temperature,
        max_tokens=1024
    )
    
    content = response.choices[0].message.content.strip()
    
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        result = json.loads(content)
        logger.info("Successfully generated email for contact: %s", contact_data.get("name", "Unknown"))
        return {
            "subject": result.get("subject", "Personalized Outreach").strip(),
            "body": result.get("body", content).strip()
        }
    except Exception:
        # Fallback if output is not strictly JSON
        logger.warning("Failed to parse JSON response, using fallback parsing")
        lines = content.split('\n', 1)
        subject = lines[0].replace('Subject:', '').strip() if len(lines) > 0 else "Personalized Outreach"
        body = lines[1].strip() if len(lines) > 1 else content
        return {"subject": subject, "body": body}
