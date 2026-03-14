"""Firebase Admin SDK initialization and Firestore client accessor."""

import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore as google_firestore

from app.config import settings

_firebase_app: firebase_admin.App | None = None
_db: google_firestore.AsyncClient | None = None


def init_firebase() -> None:
    global _firebase_app, _db
    cred = credentials.Certificate(settings.firebase_credentials_path)
    _firebase_app = firebase_admin.initialize_app(cred)
    project_id = settings.firebase_project_id or _firebase_app.project_id
    _db = google_firestore.AsyncClient(
        project=project_id,
        credentials=cred.get_credential(),
    )


def get_firestore() -> google_firestore.AsyncClient:
    if _db is None:
        raise RuntimeError("Firebase has not been initialized. Call init_firebase() first.")
    return _db


# Kept for backwards-compat import paths used in routes
async def get_db():
    """No-op — Firestore client is a global singleton; kept to avoid import errors."""
    yield None
