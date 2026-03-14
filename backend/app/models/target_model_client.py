"""Abstract interface for the target model being evaluated."""

from abc import ABC, abstractmethod


class TargetModelClient(ABC):
    @abstractmethod
    async def complete(self, system_prompt: str, user_message: str) -> str:
        """Run a single completion and return the response text."""
        ...


class ClaudeTargetClient(TargetModelClient):
    def __init__(self, model: str = "claude-sonnet-4-6"):
        self.model = model
        import anthropic
        self.client = anthropic.AsyncAnthropic()

    async def complete(self, system_prompt: str, user_message: str) -> str:
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text
