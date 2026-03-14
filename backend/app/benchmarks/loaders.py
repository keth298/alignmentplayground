import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


def load_live_subset() -> list[dict]:
    return json.loads((DATA_DIR / "live_subset.json").read_text())


def load_full_suite() -> list[dict]:
    live = load_live_subset()
    # Full suite = live subset + extra prompts if full_suite.json exists
    full_path = DATA_DIR / "full_suite.json"
    if full_path.exists():
        extra = json.loads(full_path.read_text())
        return live + extra
    return live


def get_prompts(mode: str) -> list[dict]:
    if mode == "full":
        return load_full_suite()
    return load_live_subset()


def get_categories() -> list[str]:
    prompts = load_live_subset()
    return sorted(set(p["category"] for p in prompts))
