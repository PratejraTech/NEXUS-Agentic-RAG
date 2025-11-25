from pydantic import BaseModel
from typing import List, Optional, Any, Dict

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
    timestamp: str = ""

class DocumentIngestRequest(BaseModel):
    filename: str
    content_type: str

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class DocumentResponse(BaseModel):
    id: str
    filename: str
    upload_date: str
    status: str
    summary: Optional[str] = None

class GraphNode(BaseModel):
    id: str
    label: str
    type: str

class GraphLink(BaseModel):
    source: str
    target: str
    label: str

class GraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]
