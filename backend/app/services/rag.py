from typing import List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.schemas import ChatResponse

class RAGService:
    def __init__(self):
        try:
            self.client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
            self.collection = self.client.get_or_create_collection("nexus_documents")
        except Exception as e:
            print(f"Warning: Could not connect to ChromaDB. Error: {e}")
            self.client = None
            self.collection = None

    def search(self, query: str, limit: int = 5) -> List[str]:
        if not self.collection:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=limit
        )

        if results and results['documents']:
            return results['documents'][0]
        return []

rag_service = RAGService()
