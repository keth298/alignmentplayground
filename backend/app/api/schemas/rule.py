from pydantic import BaseModel


class RuleBase(BaseModel):
    id: str
    text: str
    enabled: bool = True
    weight: float = 1.0


class RuleCreate(RuleBase):
    pass


class RuleResponse(RuleBase):
    pass


class RuleValidateRequest(BaseModel):
    rules: list[RuleBase]


class RuleValidateResponse(BaseModel):
    valid: bool
    errors: list[str] = []
