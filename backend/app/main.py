from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas import ChatRequest, ChatResponse, SearchRequest, DocumentResponse, GraphData
from app.services.llm import llm_service
from app.services.rag import rag_service
from app.workflows.ingest_workflow import ingestion_workflow
from app.services.document_store import document_store, DocumentMetadata
from typing import List
import uuid
import datetime
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()

@api_router.get("/health")
def health_check():
    return {"status": "ok"}

@api_router.get("/")
def read_root():
    return {"message": "Welcome to Nexus Backend"}

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    conversation_id = request.conversation_id or str(uuid.uuid4())
    last_message = request.messages[-1].content
    context_docs = rag_service.search(last_message)
    context = "\n".join(context_docs)

    system_prompt = f"Use the following context to answer the user's question:\n{context}\n\n" if context else ""

    llm_messages = [{"role": m.role, "content": m.content} for m in request.messages]
    if context:
        llm_messages[-1]["content"] = f"{system_prompt}User Question: {last_message}"

    response_text = await llm_service.generate_response(llm_messages)

    return ChatResponse(
        response=response_text,
        conversation_id=conversation_id,
        sources=context_docs,
        timestamp=datetime.datetime.now().isoformat()
    )

@api_router.post("/ingest/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        try:
            content = await file.read()
            result_msg = await ingestion_workflow.ingest_document(content, file.filename)
            doc_id = str(uuid.uuid4())
            doc = DocumentMetadata(
                id=doc_id,
                filename=file.filename,
                upload_date=datetime.datetime.now().isoformat(),
                status="completed",
                content_path=f"uploads/{file.filename}"
            )
            document_store.add_document(doc)
            results.append({"filename": file.filename, "status": "success", "id": doc_id})
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "error": str(e)})

    return {"results": results}

@api_router.post("/ingest/trigger")
async def trigger_ingestion():
    return {"status": "ingestion_triggered", "message": "Processing started"}

@api_router.post("/ingest")
async def ingest_single(file: UploadFile = File(...)):
    return await upload_documents([file])

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents():
    docs = document_store.get_documents()
    return [
        DocumentResponse(
            id=d.id,
            filename=d.filename,
            upload_date=d.upload_date,
            status=d.status,
            summary=d.summary
        ) for d in docs
    ]

@api_router.post("/documents/{doc_id}/summary")
async def generate_summary(doc_id: str):
    doc = document_store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    summary = f"Summary for {doc.filename}"
    document_store.update_document_summary(doc_id, summary)
    return {"summary": summary}

@api_router.get("/graph", response_model=GraphData)
async def get_graph():
    return GraphData(
        nodes=[
            {"id": "1", "label": "Document A", "type": "document"},
            {"id": "2", "label": "Topic X", "type": "topic"}
        ],
        links=[
            {"source": "1", "target": "2", "label": "mentions"}
        ]
    )

@api_router.post("/search")
async def search(request: SearchRequest):
    results = rag_service.search(request.query, request.limit)
    return {"results": results}

app.include_router(api_router, prefix="/api")
