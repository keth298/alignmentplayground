from sqlalchemy.orm import Session


class RulesetRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_ruleset(self, ruleset: dict) -> str:
        # TODO: persist ruleset, return its ID
        pass

    def get_by_id(self, ruleset_id: str) -> dict | None:
        pass

    def get_by_hash(self, ruleset_hash: str) -> dict | None:
        pass
