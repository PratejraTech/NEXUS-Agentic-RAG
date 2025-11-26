import { Message, GraphData, Citation, Document, IngestionConfig } from '../types';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

export const mockChatResponse = async (input: string): Promise<Message> => {
  try {
      const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input })
      });
      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      return {
          ...data,
          timestamp: new Date(data.timestamp)
      };
  } catch (e) {
      console.error(e);
      throw e;
  }
};

export async function* mockChatResponseStream(input: string) {
  const response = await mockChatResponse(input);
  const fullText = response.content;
  
  (window as any).__lastResponseMetadata = {
      citations: response.citations,
      thinkingTime: response.thinkingTime
  };
  
  const chunks = fullText.split(/(\s+|[,.])/g).filter(Boolean);
  for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 20)); 
      yield chunk;
  }
}

export const getMockResponseMetadata = (): { citations: Citation[], thinkingTime: number } => {
    return (window as any).__lastResponseMetadata || { citations: [], thinkingTime: 0 };
};

export const getMockGraphData = async (): Promise<GraphData> => {
  try {
      const res = await fetch(`${API_URL}/graph`);
      if (!res.ok) throw new Error("Failed to fetch graph");
      return await res.json();
  } catch (e) {
      console.error("Graph fetch failed, falling back to empty", e);
      return { nodes: [], links: [] };
  }
};

export const uploadFiles = async (files: File[]): Promise<void> => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  
  const res = await fetch(`${API_URL}/ingest/upload`, {
      method: 'POST',
      body: formData
  });
  
  if (!res.ok) throw new Error("Upload failed");
};

export const triggerIngestion = async (config: IngestionConfig): Promise<void> => {
   if (config.useN8n && config.n8nWebhookUrl) {
       // --- Trigger n8n Webhook ---
       console.log("Triggering n8n workflow...", config);
       try {
           const res = await fetch(config.n8nWebhookUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   action: "trigger_ingestion",
                   config: {
                       chunk_size: config.chunkSize,
                       chunk_overlap: config.chunkOverlap,
                       use_ocr: config.useOcr,
                       recursion_limit: config.recursionLimit
                   }
               })
           });
           if (!res.ok) throw new Error("n8n Webhook failed");
       } catch (e) {
           console.error("n8n connection error", e);
           throw new Error("Failed to connect to n8n Webhook. Is n8n running?");
       }
   } else {
       // --- Trigger Local Backend ---
       const res = await fetch(`${API_URL}/ingest/trigger`, { 
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               config: {
                   chunk_size: config.chunkSize,
                   chunk_overlap: config.chunkOverlap,
                   use_ocr: config.useOcr,
                   recursion_limit: config.recursionLimit,
                   use_n8n: false
               }
           })
       });
       if (!res.ok) throw new Error("Failed to trigger backend ingestion");
   }
};

export const fetchDocuments = async (): Promise<Document[]> => {
    const res = await fetch(`${API_URL}/documents`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return await res.json();
};

export const generateDocumentSummary = async (docId: string): Promise<string> => {
    const res = await fetch(`${API_URL}/documents/${docId}/summary`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error("Failed to generate summary");
    const data = await res.json();
    return data.summary;
};
