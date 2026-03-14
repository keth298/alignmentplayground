"""Simple in-process task queue. Replace with Celery or ARQ for production."""

import asyncio
from typing import Callable, Any


_queue: asyncio.Queue = asyncio.Queue()


async def enqueue(coro_fn: Callable, *args, **kwargs):
    """Add a coroutine function call to the queue."""
    await _queue.put((coro_fn, args, kwargs))


async def worker_loop():
    """Drain the queue, running tasks one at a time."""
    while True:
        coro_fn, args, kwargs = await _queue.get()
        try:
            await coro_fn(*args, **kwargs)
        except Exception as e:
            print(f"[task_queue] error in task {coro_fn.__name__}: {e}")
        finally:
            _queue.task_done()
