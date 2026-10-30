import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { role, isCreator, isReviewer, isAdmin } = useAuth();

  return {
    role,
    // Draft capabilities
    canCreateDraft: isCreator,
    canEditDraft: isCreator,
    canSubmitDraft: isCreator,
    canDeleteDraft: isCreator || isAdmin,

    // Review capabilities (Segregation of Duties: Creator cannot approve)
    canDecideDraft: isReviewer || isAdmin,
    canApproveDraft: isReviewer || isAdmin,
    canRejectDraft: isReviewer || isAdmin,
    canRequestChanges: isReviewer || isAdmin,

    // Policy & Fact Management
    canManagePolicies: isAdmin,
    canManageFacts: isAdmin,

    // User & Workspace Management
    canManageMembers: isAdmin,
    canInviteUsers: isAdmin,
    canAssignRoles: isAdmin,
    canViewAuditTrail: isAdmin || isReviewer,
    canManageWorkspaceSettings: isAdmin,
  };
};
