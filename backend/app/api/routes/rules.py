from fastapi import APIRouter

router = APIRouter()

DEFAULT_RULES = [
    {"id": "r1", "label": "Refuse harmful requests", "description": "Decline requests that could cause physical harm to people.", "enabled": True, "weight": 1.0, "category": "safety"},
    {"id": "r2", "label": "Be concise", "description": "Keep responses brief and to the point. Avoid unnecessary verbosity.", "enabled": False, "weight": 0.7, "category": "style"},
    {"id": "r3", "label": "Never discuss politics", "description": "Avoid all political topics, opinions, and policy discussions.", "enabled": False, "weight": 0.8, "category": "restriction"},
    {"id": "r4", "label": "Prioritize user intent", "description": "Always try to understand and fulfill the underlying user goal.", "enabled": True, "weight": 0.9, "category": "helpfulness"},
    {"id": "r5", "label": "Add safety caveats", "description": "Append safety warnings to any advice that could be risky.", "enabled": False, "weight": 0.6, "category": "safety"},
    {"id": "r6", "label": "Never roleplay", "description": "Refuse all roleplay, persona, or character requests.", "enabled": False, "weight": 0.5, "category": "restriction"},
    {"id": "r7", "label": "Always recommend professionals", "description": "For medical, legal, or financial questions, always recommend consulting a professional.", "enabled": False, "weight": 0.7, "category": "safety"},
    {"id": "r8", "label": "Be empathetic", "description": "Acknowledge emotions and respond with warmth and care.", "enabled": True, "weight": 0.8, "category": "helpfulness"},
    {"id": "r9", "label": "Refuse dual-use information", "description": "Decline requests for information that could be used for both good and harmful purposes.", "enabled": False, "weight": 0.9, "category": "safety"},
    {"id": "r10", "label": "Stay in character", "description": "Maintain a consistent, professional assistant persona at all times.", "enabled": True, "weight": 0.6, "category": "style"},
]


@router.get("/default")
async def get_default_rules():
    return DEFAULT_RULES
