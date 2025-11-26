from typing import List
from app.services.storage import storage_service
from app.services.rag import rag_service
import io
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

class IngestionWorkflow:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    async def ingest_document(self, content: bytes, filename: str) -> str:
        # 1. Save file
        file_path = await storage_service.save_upload(content, filename)

        # 2. Extract text
        text = ""
        if filename.lower().endswith(".pdf"):
            try:
                pdf_reader = PdfReader(io.BytesIO(content))
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
            except Exception as e:
                return f"Error processing PDF {filename}: {e}"
        else:
            # Assuming utf-8 for other file types, adjust if necessary
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                return f"Error decoding file {filename} as UTF-8."


        # 3. Chunk text
        chunks = self.text_splitter.split_text(text)

        # 4. Embed and store in Chroma
        if rag_service.collection:
            rag_service.collection.add(
                documents=chunks,
                ids=[f"{filename}_{i}" for i in range(len(chunks))]
            )

        return "Document processed successfully"

ingestion_workflow = IngestionWorkflow()
