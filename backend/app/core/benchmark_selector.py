"""Select benchmark prompts based on mode and optional category filters."""

from typing import Optional
from app.benchmarks.loaders import load_live_subset, load_full_suite


def select_prompts(mode: str = "live", categories: Optional[list[str]] = None) -> list[dict]:
    """Return the appropriate benchmark prompt list for the given mode."""
    if mode == "full":
        prompts = load_full_suite()
    else:
        prompts = load_live_subset()

    if categories:
        prompts = [p for p in prompts if p.get("category") in categories]

    return prompts
