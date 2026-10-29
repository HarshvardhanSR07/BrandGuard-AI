import { api } from '../../lib/apiClient';

export interface FindingModel {
  _id: string;
  workspaceId: string;
  draftId: string;
  revisionId: string;
  analysisId: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  ruleKey?: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
  explanation: string;
  evidenceRefs: Array<{ kind: 'policy' | 'fact'; refId: string; key?: string; version?: number }>;
  evidenceStatus: 'supported' | 'contradicted' | 'stale' | 'conflicting' | 'unverifiable' | 'not_applicable';
  uncertainty?: number;
  suggestion?: {
    replacementText: string;
    explanation?: string;
    ready?: boolean;
  };
  disposition: 'open' | 'accepted' | 'dismissed';
}

export const analysisApi = {
  getFindings: (draftId: string) => api.getFindings(draftId),
  runGovernanceReview: (brand_id: string, draft_text: string) =>
    api.runGovernanceReview(brand_id, draft_text),
  analyseContent: (draftId: string, brand?: string) =>
    api.analyseContent(draftId, brand),
};
