import { Message, GraphData, Citation } from '../types';
import { MOCK_GRAPH_DATA } from './mockData';

export const mockChatResponse = async (input: string): Promise<Message> => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: `Based on the analysis of your knowledge base, regarding "${input}":\n\nThe strategic initiative "Project Titan" is closely linked to the 2025 revenue projections. Documents indicate that Sarah Connor has taken lead on the implementation phase, specifically targeting the Q3 infrastructure upgrades.\n\nHowever, there are noted dependencies on the new AI Regulation compliance protocols which might impact the timeline.`,
    timestamp: new Date(),
    thinkingTime: 2450,
    citations: [
      {
        id: '1',
        documentName: 'Strategic Plan 2025.pdf',
        pageNumber: 12,
        textSnippet: 'Project Titan remains the primary driver for Q3 growth...',
        relevanceScore: 0.95
      },
      {
        id: '2',
        documentName: 'Budget Report.pdf',
        pageNumber: 4,
        textSnippet: 'Allocation for Cyberdyne collaboration increased by 15%...',
        relevanceScore: 0.88
      }
    ]
  };
};

export async function* mockChatResponseStream(input: string) {
  const fullResponse = `Based on the analysis of your knowledge base, regarding "${input}":\n\nThe strategic initiative "Project Titan" is closely linked to the 2025 revenue projections. Documents indicate that Sarah Connor has taken lead on the implementation phase, specifically targeting the Q3 infrastructure upgrades.\n\nHowever, there are noted dependencies on the new AI Regulation compliance protocols which might impact the timeline.`;
  
  // Split by words but keep spaces/punctuation to make it look natural
  const chunks = fullResponse.split(/(\s+|[,.])/g).filter(Boolean);
  
  for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50)); // Simulate token generation latency
      yield chunk;
  }
}

export const getMockResponseMetadata = (): { citations: Citation[], thinkingTime: number } => ({
    thinkingTime: 2450,
    citations: [
      {
        id: '1',
        documentName: 'Strategic Plan 2025.pdf',
        pageNumber: 12,
        textSnippet: 'Project Titan remains the primary driver for Q3 growth...',
        relevanceScore: 0.95
      },
      {
        id: '2',
        documentName: 'Budget Report.pdf',
        pageNumber: 4,
        textSnippet: 'Allocation for Cyberdyne collaboration increased by 15%...',
        relevanceScore: 0.88
      }
    ]
});

export const getMockGraphData = async (): Promise<GraphData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // In a real app, this would be: axios.get('/api/graph/entities')
  return MOCK_GRAPH_DATA;
};

export const uploadFiles = async (files: File[]): Promise<void> => {
  // In a real app, this would use FormData to POST files to the backend
  // const formData = new FormData();
  // files.forEach(f => formData.append('files', f));
  // await fetch('/api/ingest/upload', { method: 'POST', body: formData });
  
  await new Promise((resolve) => setTimeout(resolve, 1500 + (files.length * 200)));
  return;
};

export const triggerIngestion = async (files: string[]): Promise<void> => {
   // In real app: axios.post('/api/ingest/trigger', { files })
   return;
};