export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  thinkingTime?: number; // ms
}

export interface Citation {
  id: string;
  documentName: string;
  pageNumber: number;
  textSnippet: string;
  relevanceScore: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Person' | 'Concept' | 'Organisation' | 'Event' | 'Document';
  val: number; // For visualization size
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string; // Relation type
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface IngestionStep {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  details?: string;
}

export interface PipelineStatus {
  isActive: boolean;
  progress: number;
  currentAgent: string;
  steps: IngestionStep[];
}
