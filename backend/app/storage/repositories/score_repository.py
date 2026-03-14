from sqlalchemy.orm import Session


class ScoreRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_output_scores(self, run_id: str, prompt_id: str, scores: dict):
        # TODO: persist per-output scores
        pass

    def get_scores_for_run(self, run_id: str) -> list[dict]:
        # TODO: retrieve all output scores for a run
        return []
