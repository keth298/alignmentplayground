import google.generativeai as genai

from app.config import settings

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


async def gemini_complete(prompt: str, system: str, model: str, max_tokens: int = 512) -> str:
    _ensure_configured()
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    gmodel = genai.GenerativeModel(model)
    response = await gmodel.generate_content_async(
        full_prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=max_tokens),
    )
    return response.text or ""
