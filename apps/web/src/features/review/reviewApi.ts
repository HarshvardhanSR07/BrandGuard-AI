import { api } from '../../lib/apiClient';

export interface ReviewQueueItem {
  _id: string;
  workspaceId: string;
  authorId: string;
  title: string;
  channel: string;
  status: string;
  currentRevisionNo: number;
  text: string;
  isOwnDraft: boolean;
  canDecide: boolean;
  submittedAt?: string;
  createdAt: string;
}

export const reviewApi = {
  getQueue: () => api.getReviewQueue(),
  decideDraft: (
    draftId: string,
    decision: { decision: 'approve' | 'request_changes' | 'reject'; rationale?: string }
  ) => api.decideContent(draftId, decision),
  decideFinding: (
    findingId: string,
    decision: { decision: 'accept' | 'dismiss'; rationale?: string }
  ) => api.decideFinding(findingId, decision),
};
