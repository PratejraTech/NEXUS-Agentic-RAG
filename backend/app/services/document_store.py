import json
import os
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    upload_date: str
    status: str
    summary: Optional[str] = None
    content_path: Optional[str] = None

class DocumentStore:
    def __init__(self, storage_file: str = "data/documents.json"):
        self.storage_file = storage_file
        self.documents: List[DocumentMetadata] = []
        self._ensure_storage()
        self._load()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
        if not os.path.exists(self.storage_file):
            with open(self.storage_file, "w") as f:
                json.dump([], f)

    def _load(self):
        try:
            with open(self.storage_file, "r") as f:
                data = json.load(f)
                self.documents = [DocumentMetadata(**d) for d in data]
        except Exception as e:
            print(f"Error loading document store: {e}")
            self.documents = []

    def _save(self):
        try:
            with open(self.storage_file, "w") as f:
                json.dump([d.model_dump() for d in self.documents], f, indent=2)
        except Exception as e:
            print(f"Error saving document store: {e}")

    def add_document(self, doc: DocumentMetadata):
        self.documents.append(doc)
        self._save()

    def get_documents(self) -> List[DocumentMetadata]:
        return self.documents

    def get_document(self, doc_id: str) -> Optional[DocumentMetadata]:
        for doc in self.documents:
            if doc.id == doc_id:
                return doc
        return None

    def update_document_summary(self, doc_id: str, summary: str):
        for doc in self.documents:
            if doc.id == doc_id:
                doc.summary = summary
                self._save()
                return doc
        return None

document_store = DocumentStore()
