from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.core.prompt_generator import generate_prompts

router = APIRouter()


class GeneratePromptsRequest(BaseModel):
    description: str
    rules: list[dict]
    generator_model: str | None = None


@router.post("/generate")
async def generate_prompts_endpoint(req: GeneratePromptsRequest):
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Model description is required")
    try:
        prompts = await generate_prompts(
            description=req.description,
            rules=req.rules,
            model=req.generator_model or settings.prompt_generator_model,
        )
        return {"prompts": prompts, "count": len(prompts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt generation failed: {e}")
