from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas import ChatRequest, ChatResponse, SearchRequest, DocumentResponse, GraphData
from app.services.llm import llm_service
from app.services.rag import rag_service
from app.workflows.ingestion import ingestion_workflow
from app.services.document_store import document_store, DocumentMetadata
from typing import List
import uuid
import datetime

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Nexus Backend"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # Simple RAG implementation (retrieve context -> generate)
    last_message = request.messages[-1].content
    context_docs = rag_service.search(last_message)
    context = "\n".join(context_docs)

    system_prompt = f"Use the following context to answer the user's question:\n{context}\n\n" if context else ""

    # Prepare messages for LLM
    llm_messages = [{"role": m.role, "content": m.content} for m in request.messages]
    if context:
        # Prepend context to the last user message or as a system message
        llm_messages[-1]['content'] = f"{system_prompt}User Question: {last_message}"

    response_text = await llm_service.generate_response(llm_messages)

    return ChatResponse(
        response=response_text,
        conversation_id=conversation_id,
        sources=context_docs
    )

@app.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        result = await ingestion_workflow.ingest_document(content, file.filename)
        if "successfully" in result:
            doc_id = str(uuid.uuid4())
            doc = DocumentMetadata(
                id=doc_id,
                filename=file.filename,
                upload_date=datetime.datetime.now().isoformat(),
                status="completed",
                content_path=f"uploads/{file.filename}"
            )
            document_store.add_document(doc)
            return {"message": result, "filename": file.filename, "doc_id": doc_id}
        else:
            raise HTTPException(status_code=500, detail=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(request: SearchRequest):
    results = rag_service.search(request.query, request.limit)
    return {"results": results}

@app.get("/documents", response_model=List[DocumentResponse])
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

@app.post("/documents/{doc_id}/summary")
async def generate_summary(doc_id: str):
    doc = document_store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    summary = f"Summary for {doc.filename}"
    document_store.update_document_summary(doc_id, summary)
    return {"summary": summary}

@app.get("/graph", response_model=GraphData)
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
