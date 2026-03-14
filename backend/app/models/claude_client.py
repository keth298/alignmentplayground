import json

from groq import AsyncGroq

from app.config import settings

_client: AsyncGroq | None = None


def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def complete(prompt: str, system: str, model: str, max_tokens: int = 512) -> str:
    client = get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def complete_with_tools(
    prompt: str,
    system: str,
    model: str,
    tools: list[dict],
    max_tokens: int = 512,
) -> dict:
    """Call model with tool definitions. Returns dict with 'content' and 'tool_calls'."""
    client = get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        tools=tools,
        tool_choice="auto",
        max_tokens=max_tokens,
    )
    msg = response.choices[0].message
    tool_calls = []
    if msg.tool_calls:
        for tc in msg.tool_calls:
            try:
                args = json.loads(tc.function.arguments)
            except Exception:
                args = {}
            tool_calls.append({"name": tc.function.name, "args": args})
    return {
        "content": msg.content or "",
        "tool_calls": tool_calls,
    }
