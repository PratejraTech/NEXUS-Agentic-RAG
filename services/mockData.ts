import { GraphData } from '../types';

export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    { id: '1', label: 'Strategic Plan 2025', type: 'Document', val: 5 },
    { id: '2', label: 'Project Titan', type: 'Event', val: 4 },
    { id: '3', label: 'Q3 Revenue', type: 'Concept', val: 3 },
    { id: '4', label: 'Sarah Connor', type: 'Person', val: 3 },
    { id: '5', label: 'Cyberdyne Systems', type: 'Organisation', val: 5 },
    { id: '6', label: 'AI Regulation', type: 'Concept', val: 3 },
    { id: '7', label: 'John Doe', type: 'Person', val: 2 },
    { id: '8', label: 'Infrastructure Upgrade', type: 'Event', val: 3 },
    { id: '9', label: 'Budget Report', type: 'Document', val: 4 },
    { id: '10', label: 'Cloud Migration', type: 'Concept', val: 3 },
    { id: '11', label: 'Security Protocol', type: 'Concept', val: 2 },
    { id: '12', label: 'Global Tech Corp', type: 'Organisation', val: 4 },
    { id: '13', label: 'Meeting Minutes', type: 'Document', val: 3 },
    { id: '14', label: 'Alice Smith', type: 'Person', val: 2 },
    { id: '15', label: 'Bob Jones', type: 'Person', val: 2 },
  ],
  links: [
    { source: '1', target: '2', type: 'MENTIONED_IN' },
    { source: '1', target: '3', type: 'MENTIONED_IN' },
    { source: '2', target: '4', type: 'LED_BY' },
    { source: '4', target: '5', type: 'WORKS_FOR' },
    { source: '2', target: '5', type: 'FUNDED_BY' },
    { source: '6', target: '1', type: 'RELATES_TO' },
    { source: '7', target: '5', type: 'WORKS_FOR' },
    { source: '2', target: '8', type: 'CAUSED_BY' },
    { source: '9', target: '3', type: 'DETAILS' },
    { source: '10', target: '5', type: 'PLANNED_BY' },
    { source: '11', target: '10', type: 'REQUIRES' },
    { source: '12', target: '5', type: 'PARTNER_OF' },
    { source: '13', target: '2', type: 'DOCUMENTS' },
    { source: '14', target: '12', type: 'WORKS_FOR' },
    { source: '15', target: '12', type: 'WORKS_FOR' },
    { source: '14', target: '2', type: 'PARTICIPATED_IN' },
  ]
};