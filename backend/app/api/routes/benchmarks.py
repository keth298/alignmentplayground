from fastapi import APIRouter

from app.benchmarks.loaders import get_categories, get_prompts, load_full_suite, load_live_subset

router = APIRouter()


@router.get("/live")
async def get_live_benchmark():
    return load_live_subset()


@router.get("/full")
async def get_full_benchmark():
    return load_full_suite()


@router.get("/categories")
async def get_categories_list():
    return get_categories()


@router.get("/stats")
async def get_benchmark_stats():
    live = load_live_subset()
    full = load_full_suite()
    categories = get_categories()
    return {
        "live_count": len(live),
        "full_count": len(full),
        "categories": categories,
        "category_counts": {
            cat: len([p for p in live if p["category"] == cat])
            for cat in categories
        },
    }
