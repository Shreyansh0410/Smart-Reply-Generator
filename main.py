import os
import logging
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

try:
    from backend.llm import analyze_email_content, generate_email_replies
except ImportError:
    from llm import analyze_email_content, generate_email_replies

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart-reply-generator")

app = FastAPI(
    title="Smart Reply Generator API",
    description="Backend API for Generative AI context-aware email replies."
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request validation schemas
class AnalyzeRequest(BaseModel):
    email_content: str = Field(..., description="The body content of the email to analyze.")
    provider: str = Field("gemini", description="LLM provider: 'gemini' or 'openai'")
    model: Optional[str] = Field(None, description="Specific model name (optional)")
    api_key: Optional[str] = Field(None, description="API Key provided by the user client-side (optional)")

class GenerateRequest(BaseModel):
    email_content: str = Field(..., description="The body content of the original email.")
    key_requests: List[str] = Field(default=[], description="List of questions/points to address in the email.")
    tone: str = Field("Professional", description="Tone of reply (e.g. Professional, Friendly, Assertive, Apologetic, Casual)")
    length: str = Field("Standard", description="Length of reply (Short, Standard, Detailed)")
    custom_points: str = Field("", description="User's custom points/instructions to integrate into the response.")
    provider: str = Field("gemini", description="LLM provider: 'gemini' or 'openai'")
    model: Optional[str] = Field(None, description="Specific model name (optional)")
    api_key: Optional[str] = Field(None, description="API Key provided by the user client-side (optional)")


@app.post("/api/analyze")
async def analyze_email(request: AnalyzeRequest):
    """Analyzes an incoming email for sentiment, urgency, summary, requests, and suggested reply strategy."""
    if not request.email_content.strip():
        raise HTTPException(status_code=400, detail="Email content cannot be empty.")
    
    try:
        analysis = analyze_email_content(
            email_content=request.email_content,
            provider=request.provider,
            api_key=request.api_key,
            model=request.model
        )
        return analysis
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-replies")
async def generate_replies(request: GenerateRequest):
    """Generates three distinct context-aware response drafts (Direct, Warm, Structured)."""
    if not request.email_content.strip():
        raise HTTPException(status_code=400, detail="Original email content cannot be empty.")
        
    try:
        drafts = generate_email_replies(
            email_content=request.email_content,
            key_requests=request.key_requests,
            tone=request.tone,
            length=request.length,
            custom_points=request.custom_points,
            provider=request.provider,
            api_key=request.api_key,
            model=request.model
        )
        return drafts
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Mount the frontend directory static files at root
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
frontend_dir = os.path.join(parent_dir, "frontend")

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    logger.info(f"Mounted static frontend from {frontend_dir}")
else:
    logger.warning(f"Frontend directory not found at {frontend_dir}. API is running, but UI will not be served.")
