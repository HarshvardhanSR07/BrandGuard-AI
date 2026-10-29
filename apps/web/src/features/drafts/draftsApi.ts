import { api } from '../../lib/apiClient';

export interface DraftModel {
  _id: string;
  workspaceId: string;
  authorId: string;
  title: string;
  channel: string;
  status: 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
  currentRevisionId: string;
  currentRevisionNo: number;
  text?: string;
  createdAt: string;
  updatedAt?: string;
}

export const draftsApi = {
  list: (params?: Record<string, string>) => api.listContent(params),
  get: (id: string) => api.getContent(id),
  revisions: (id: string) => api.getRevisions(id),
  create: (data: { title: string; channel?: string; text: string }) => api.createContent(data),
  revise: (id: string, text: string) => api.reviseContent(id, text),
  submit: (id: string) => api.submitContent(id),
  analyse: (id: string, brand?: string) => api.analyseContent(id, brand),
};
