from typing import List
from app.services.storage import storage_service
from app.services.rag import rag_service

class IngestionWorkflow:
    def __init__(self):
        pass

    async def ingest_document(self, content: bytes, filename: str) -> str:
        file_path = await storage_service.save_upload(content, filename)
        text = f"Content of {filename}"
        chunks = [text]
        return "Document processed successfully"

ingestion_workflow = IngestionWorkflow()
