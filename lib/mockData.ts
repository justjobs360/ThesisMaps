import type { Paper } from '@/types/paper';
import type { ThesisProject, OutlineSection, ResearchGap } from '@/types/thesis';
import type { AdminUser, AdminStats, FeedbackItem, FlagItem } from '@/types/admin';
import type { GraphData } from '@/types/graph';

export const MOCK_PAPERS: Paper[] = [
  {
    id: 'p1',
    doi: '10.1145/3411764.3445775',
    title: 'Attention Is All You Need: Transformers in Modern NLP',
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    authors: [{ name: 'Ashish Vaswani', hIndex: 45 }, { name: 'Noam Shazeer' }, { name: 'Niki Parmar' }],
    year: 2017,
    citationCount: 98423,
    referenceCount: 42,
    openAccess: true,
    fieldsOfStudy: ['Computer Science', 'Artificial Intelligence', 'Natural Language Processing'],
    source: 'semantic_scholar',
    url: 'https://arxiv.org/abs/1706.03762',
  },
  {
    id: 'p2',
    doi: '10.1038/s41586-021-03820-1',
    title: 'Highly accurate protein structure prediction with AlphaFold',
    abstract: 'Proteins are essential to life, and understanding their structure is key to understanding how they function.',
    authors: [{ name: 'John Jumper' }, { name: 'Richard Evans' }, { name: 'Alexander Pritzel' }],
    year: 2021,
    citationCount: 24891,
    referenceCount: 98,
    openAccess: true,
    fieldsOfStudy: ['Biology', 'Computational Biology', 'Machine Learning'],
    source: 'openalex',
    url: 'https://www.nature.com/articles/s41586-021-03820-1',
  },
  {
    id: 'p3',
    doi: '10.1162/neco.1997.9.8.1735',
    title: 'Long Short-Term Memory',
    abstract: 'Learning to store information over extended time intervals via recurrent backpropagation takes a very long time.',
    authors: [{ name: 'Sepp Hochreiter' }, { name: 'Jürgen Schmidhuber' }],
    year: 1997,
    citationCount: 67432,
    referenceCount: 35,
    openAccess: false,
    fieldsOfStudy: ['Computer Science', 'Neuroscience', 'Machine Learning'],
    source: 'semantic_scholar',
    url: 'https://www.mitpressjournals.org/doi/10.1162/neco.1997.9.8.1735',
  },
  {
    id: 'p4',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    arxivId: '1810.04805',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
    authors: [{ name: 'Jacob Devlin' }, { name: 'Ming-Wei Chang' }, { name: 'Kenton Lee' }],
    year: 2018,
    citationCount: 52341,
    referenceCount: 56,
    openAccess: true,
    fieldsOfStudy: ['Computer Science', 'Natural Language Processing'],
    source: 'arxiv',
    url: 'https://arxiv.org/abs/1810.04805',
  },
  {
    id: 'p5',
    doi: '10.1038/s41591-020-0783-x',
    title: 'Deep learning for computational biology',
    abstract: 'Deep learning methods have recently been applied to computational biology problems with great success.',
    authors: [{ name: 'Christof Angermueller' }, { name: 'Tanel Pärnamaa' }],
    year: 2016,
    citationCount: 2341,
    referenceCount: 89,
    openAccess: false,
    fieldsOfStudy: ['Computational Biology', 'Machine Learning'],
    source: 'crossref',
    url: 'https://www.nature.com/articles/s41591-020-0783-x',
  },
];

export const MOCK_PROJECT: ThesisProject = {
  id: 'proj1',
  userId: 'user1',
  title: 'The Role of Transformer Architectures in Modern NLP Systems',
  field: 'Computer Science / Artificial Intelligence',
  currentStage: 'literature_review',
  metadata: {},
  createdAt: '2024-01-15T10:30:00Z',
};

export const MOCK_OUTLINE_SECTIONS: OutlineSection[] = [
  { id: 's1', projectId: 'proj1', title: 'Introduction', orderIndex: 0, parentId: null, paperCount: 5, coverageScore: 82, createdAt: '2024-01-15T10:30:00Z' },
  { id: 's2', projectId: 'proj1', title: 'Background & Related Work', orderIndex: 1, parentId: null, paperCount: 12, coverageScore: 74, createdAt: '2024-01-15T10:30:00Z' },
  { id: 's3', projectId: 'proj1', title: 'Transformer Architecture Overview', orderIndex: 2, parentId: null, paperCount: 8, coverageScore: 91, createdAt: '2024-01-15T10:30:00Z' },
  { id: 's4', projectId: 'proj1', title: 'Self-Attention Mechanisms', orderIndex: 0, parentId: 's3', paperCount: 4, coverageScore: 88, createdAt: '2024-01-15T10:30:00Z' },
  { id: 's5', projectId: 'proj1', title: 'Methodology', orderIndex: 3, parentId: null, paperCount: 3, coverageScore: 45, createdAt: '2024-01-15T10:30:00Z' },
  { id: 's6', projectId: 'proj1', title: 'Conclusion', orderIndex: 4, parentId: null, paperCount: 0, coverageScore: 0, createdAt: '2024-01-15T10:30:00Z' },
];

export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    { id: 'p1', paper: MOCK_PAPERS[0]!, type: 'seed' },
    { id: 'p2', paper: MOCK_PAPERS[1]!, type: 'influential' },
    { id: 'p3', paper: MOCK_PAPERS[2]!, type: 'cited' },
    { id: 'p4', paper: MOCK_PAPERS[3]!, type: 'citing', isBookmarked: true },
    { id: 'p5', paper: MOCK_PAPERS[4]!, type: 'cited' },
  ],
  edges: [
    { id: 'e1', source: 'p1', target: 'p3', type: 'citation' },
    { id: 'e2', source: 'p4', target: 'p1', type: 'citation' },
    { id: 'e3', source: 'p1', target: 'p2', type: 'semantic_similarity' },
    { id: 'e4', source: 'p2', target: 'p5', type: 'citation' },
    { id: 'e5', source: 'p3', target: 'p5', type: 'semantic_similarity' },
  ],
};

export const MOCK_RESEARCH_GAPS: ResearchGap[] = [
  { id: 'g1', clusterName: 'Multilingual Transformer Models', keywords: ['multilingual', 'cross-lingual', 'low-resource'], gapScore: 0.87, paperCount: 3, isHighGap: true },
  { id: 'g2', clusterName: 'Efficiency & Compression', keywords: ['pruning', 'distillation', 'quantization', 'efficient transformers'], gapScore: 0.72, paperCount: 6, isHighGap: true },
  { id: 'g3', clusterName: 'Interpretability & Explainability', keywords: ['attention visualization', 'probing', 'mechanistic interpretability'], gapScore: 0.58, paperCount: 8, isHighGap: false },
  { id: 'g4', clusterName: 'Long-context Processing', keywords: ['long documents', 'sliding window', 'sparse attention'], gapScore: 0.91, paperCount: 2, isHighGap: true },
];

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 1847,
  newUsersLast30d: 234,
  activeUsersLast7d: 412,
  totalProjects: 2931,
  totalPapersSaved: 48293,
  totalSearchesLast30d: 7821,
  openFeedbackTickets: 12,
  pendingFlags: 3,
};

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: 'u1', email: 'alice@cambridge.ac.uk', name: 'Alice Thompson', role: 'user', status: 'active', plan: 'pro', createdAt: '2024-01-10T09:00:00Z', lastActiveAt: '2024-07-20T14:30:00Z', projectCount: 3 },
  { id: 'u2', email: 'bob@mit.edu', name: 'Bob Zhang', role: 'user', status: 'active', plan: 'free', createdAt: '2024-02-15T11:00:00Z', lastActiveAt: '2024-07-19T09:15:00Z', projectCount: 1 },
  { id: 'u3', email: 'carol@oxford.ac.uk', name: 'Carol Davies', role: 'admin', status: 'active', plan: 'pro', createdAt: '2023-11-01T08:00:00Z', lastActiveAt: '2024-07-20T16:45:00Z', projectCount: 5 },
  { id: 'u4', email: 'david@ucl.ac.uk', name: 'David Osei', role: 'user', status: 'suspended', plan: 'free', createdAt: '2024-03-20T13:00:00Z', lastActiveAt: '2024-06-10T10:00:00Z', projectCount: 0 },
];

export const MOCK_FEEDBACK: FeedbackItem[] = [
  { id: 'f1', userId: 'u1', userEmail: 'alice@cambridge.ac.uk', userName: 'Alice Thompson', type: 'bug', subject: 'Graph not loading after 500 nodes', message: 'When I have more than 500 papers in my graph, the page freezes and never loads.', status: 'open', createdAt: '2024-07-18T10:00:00Z' },
  { id: 'f2', userId: 'u2', userEmail: 'bob@mit.edu', userName: 'Bob Zhang', type: 'feature', subject: 'Export to Zotero', message: 'It would be great to export papers directly to Zotero or Mendeley.', status: 'in_progress', createdAt: '2024-07-15T14:30:00Z' },
];

export const MOCK_FLAGS: FlagItem[] = [
  { id: 'fl1', flaggedBy: 'u1', flaggedByEmail: 'alice@cambridge.ac.uk', entityType: 'paper', entityId: 'p3', reason: 'Incorrect metadata — wrong year and authors listed', status: 'pending', createdAt: '2024-07-19T09:00:00Z' },
  { id: 'fl2', flaggedBy: 'u2', flaggedByEmail: 'bob@mit.edu', entityType: 'comment', entityId: 'c1', reason: 'Spam content', status: 'pending', createdAt: '2024-07-17T15:00:00Z' },
];
