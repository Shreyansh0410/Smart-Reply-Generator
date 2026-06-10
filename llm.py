import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List

# Import prompts
try:
    from backend.prompts import (
        EMAIL_ANALYSIS_SYSTEM_PROMPT,
        EMAIL_ANALYSIS_USER_PROMPT_TEMPLATE,
        EMAIL_GENERATION_SYSTEM_PROMPT,
        EMAIL_GENERATION_USER_PROMPT_TEMPLATE
    )
except ImportError:
    from prompts import (
        EMAIL_ANALYSIS_SYSTEM_PROMPT,
        EMAIL_ANALYSIS_USER_PROMPT_TEMPLATE,
        EMAIL_GENERATION_SYSTEM_PROMPT,
        EMAIL_GENERATION_USER_PROMPT_TEMPLATE
    )

def make_gemini_rest_call(prompt: str, system_prompt: str, api_key: str, model: str = "gemini-2.5-flash") -> str:
    """Makes a direct REST API call to Gemini."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    # Standard format for Gemini API
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }
    
    if system_prompt:
        payload["systemInstruction"] = {
            "parts": [{"text": system_prompt}]
        }
        
    headers = {
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            # Extract text from response
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return text
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_content)
            error_msg = error_json.get("error", {}).get("message", "Unknown Gemini API error")
        except Exception:
            error_msg = error_content
        raise RuntimeError(f"Gemini API Error (HTTP {e.code}): {error_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to communicate with Gemini API: {str(e)}")


def make_openai_rest_call(prompt: str, system_prompt: str, api_key: str, model: str = "gpt-4o-mini") -> str:
    """Makes a direct REST API call to OpenAI."""
    url = "https://api.openai.com/v1/chat/completions"
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text = res_data["choices"][0]["message"]["content"]
            return text
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_content)
            error_msg = error_json.get("error", {}).get("message", "Unknown OpenAI API error")
        except Exception:
            error_msg = error_content
        raise RuntimeError(f"OpenAI API Error (HTTP {e.code}): {error_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to communicate with OpenAI API: {str(e)}")


def clean_json_response(text: str) -> Dict[str, Any]:
    """Cleans code fences or whitespace around JSON and parses it."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    return json.loads(text)


def analyze_email_content(email_content: str, provider: str, api_key: str, model: str = None) -> Dict[str, Any]:
    """Analyzes incoming email for sentiment, urgency, summary, requests, and strategy."""
    if not api_key:
        # Fallback to env key
        if provider == "gemini":
            api_key = os.environ.get("GEMINI_API_KEY")
        else:
            api_key = os.environ.get("OPENAI_API_KEY")
            
    if not api_key:
        raise ValueError(f"No API key provided for {provider.capitalize()}. Please specify one in settings or environment.")

    prompt = EMAIL_ANALYSIS_USER_PROMPT_TEMPLATE.format(email_content=email_content)
    system_prompt = EMAIL_ANALYSIS_SYSTEM_PROMPT

    if provider == "gemini":
        target_model = model or "gemini-2.5-flash"
        raw_response = make_gemini_rest_call(prompt, system_prompt, api_key, target_model)
    elif provider == "openai":
        target_model = model or "gpt-4o-mini"
        raw_response = make_openai_rest_call(prompt, system_prompt, api_key, target_model)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    try:
        return clean_json_response(raw_response)
    except json.JSONDecodeError:
        # Fallback parsing if JSON is slightly malformed but contains standard JSON structure
        raise RuntimeError(f"Failed to parse model response as JSON. Raw response:\n{raw_response}")


def generate_email_replies(
    email_content: str,
    key_requests: List[str],
    tone: str,
    length: str,
    custom_points: str,
    provider: str,
    api_key: str,
    model: str = None
) -> Dict[str, str]:
    """Generates three email draft responses based on preferences and context."""
    if not api_key:
        if provider == "gemini":
            api_key = os.environ.get("GEMINI_API_KEY")
        else:
            api_key = os.environ.get("OPENAI_API_KEY")
            
    if not api_key:
        raise ValueError(f"No API key provided for {provider.capitalize()}. Please specify one in settings or environment.")

    key_requests_str = "\n".join([f"- {req}" for req in key_requests]) if key_requests else "None detected. Respond appropriately."
    custom_points_str = custom_points if custom_points.strip() else "None specified. Use your best judgment."

    prompt = EMAIL_GENERATION_USER_PROMPT_TEMPLATE.format(
        email_content=email_content,
        key_requests=key_requests_str,
        tone=tone,
        length=length,
        custom_points=custom_points_str
    )
    system_prompt = EMAIL_GENERATION_SYSTEM_PROMPT

    if provider == "gemini":
        target_model = model or "gemini-2.5-flash"
        raw_response = make_gemini_rest_call(prompt, system_prompt, api_key, target_model)
    elif provider == "openai":
        target_model = model or "gpt-4o-mini"
        raw_response = make_openai_rest_call(prompt, system_prompt, api_key, target_model)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    try:
        drafts = clean_json_response(raw_response)
        # Validate that drafts contain expected fields, defaulting to backup strings if missing
        return {
            "draft_direct": drafts.get("draft_direct", "Failed to generate direct draft."),
            "draft_warm": drafts.get("draft_warm", "Failed to generate warm draft."),
            "draft_structured": drafts.get("draft_structured", "Failed to generate structured draft.")
        }
    except json.JSONDecodeError:
        raise RuntimeError(f"Failed to parse drafts as JSON. Raw response:\n{raw_response}")
