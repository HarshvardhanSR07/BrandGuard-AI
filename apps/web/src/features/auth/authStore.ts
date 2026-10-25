import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'reviewer' | 'admin' | 'compliance_officer';
  initials: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  plan: string;
  membersCount: number;
}

interface AuthState {
  user: UserProfile;
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string;
  loginAs: (role: 'creator' | 'reviewer' | 'admin') => void;
  setWorkspace: (id: string) => void;
}

const PERSONAS: Record<string, UserProfile> = {
  creator: {
    id: 'usr_sarah_creator',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.brand',
    role: 'creator',
    initials: 'SC',
  },
  reviewer: {
    id: 'usr_marcus_reviewer',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.brand',
    role: 'reviewer',
    initials: 'MV',
  },
  admin: {
    id: 'usr_elena_admin',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.brand',
    role: 'admin',
    initials: 'ER',
  },
};

const WORKSPACES: WorkspaceItem[] = [
  { id: 'ws_acme_global', name: 'Acme Cloud Platform', plan: 'Enterprise', membersCount: 24 },
  { id: 'ws_horizon_fintech', name: 'Horizon FinTech', plan: 'Enterprise', membersCount: 12 },
  { id: 'ws_bioshield', name: 'BioShield Health', plan: 'Team', membersCount: 8 },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: PERSONAS.creator,
  workspaces: WORKSPACES,
  activeWorkspaceId: 'ws_acme_global',
  loginAs: (role) => set({ user: PERSONAS[role] || PERSONAS.creator }),
  setWorkspace: (id) => set({ activeWorkspaceId: id }),
}));
