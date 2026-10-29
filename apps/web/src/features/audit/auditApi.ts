import { api } from '../../lib/apiClient';

export interface AuditEventModel {
  _id: string;
  workspaceId: string;
  seq: number;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  draftId: string | null;
  at: string;
  prevHash: string;
  hash: string;
  meta: any;
}

export const auditApi = {
  getEvents: () => api.getAuditEvents(),
  verifyChain: () => api.verifyAuditChain(),
};
