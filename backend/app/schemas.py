from pydantic import BaseModel
from typing import List, Optional, Any

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[Any] = []

class DocumentIngestRequest(BaseModel):
    filename: str
    content_type: str

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
