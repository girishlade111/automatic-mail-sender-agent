import openai
import json
from app.config import settings

def generate_personalized_email(contact_data: dict, prompt_template: str, tone: str, length: str, temperature: float = 0.7) -> dict:
    """Calls NVIDIA NIM to generate an email. Returns a dict with 'subject' and 'body'."""
    if not settings.NVIDIA_NIM_API_KEY:
        raise ValueError("NVIDIA NIM API Key is not configured")
        
    client = openai.OpenAI(
        api_key=settings.NVIDIA_NIM_API_KEY,
        base_url=settings.NVIDIA_NIM_BASE_URL
    )
    
    # Replace variables in the prompt template like {{name}}, {{company}}
    rendered_prompt = prompt_template
    for key, value in contact_data.items():
        if value:
            rendered_prompt = rendered_prompt.replace(f"{{{{{key}}}}}", str(value))
            
    # Remove any unreplaced variables
    import re
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
        return {
            "subject": result.get("subject", "Personalized Outreach").strip(),
            "body": result.get("body", content).strip()
        }
    except Exception:
        # Fallback if output is not strictly JSON
        lines = content.split('\n', 1)
        subject = lines[0].replace('Subject:', '').strip() if len(lines) > 0 else "Personalized Outreach"
        body = lines[1].strip() if len(lines) > 1 else content
        return {"subject": subject, "body": body}
