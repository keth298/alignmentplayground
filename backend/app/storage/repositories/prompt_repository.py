from sqlalchemy.orm import Session
from app.storage.models import Base


class PromptRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prompt_id: str):
        # TODO: implement once prompt ORM model is defined
        pass

    def list_by_category(self, category: str):
        pass
