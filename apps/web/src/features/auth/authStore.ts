import { create } from 'zustand';
import { api } from '../../lib/apiClient';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'reviewer' | 'admin';
  initials: string;
  avatarUrl?: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  brandName?: string;
  plan: string;
  membersCount: number;
  role: 'creator' | 'reviewer' | 'admin';
}

interface AuthState {
  user: UserProfile;
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'microsoft', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setWorkspace: (id: string) => void;
  checkSession: () => Promise<void>;
  devSwitchAccount: (role: 'creator' | 'reviewer' | 'admin') => Promise<void>;
}

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  { id: 'ws_acme_global', name: 'Acme Cloud Platform', brandName: 'Acme Global', plan: 'Enterprise', membersCount: 24, role: 'creator' },
  { id: 'ws_horizon_fintech', name: 'Horizon FinTech', brandName: 'Horizon Financial', plan: 'Enterprise', membersCount: 12, role: 'creator' },
  { id: 'ws_bioshield', name: 'BioShield Health', brandName: 'BioShield Health', plan: 'Team', membersCount: 8, role: 'creator' },
];

const DEFAULT_CREATOR: UserProfile = {
  id: 'usr_alex_creator',
  name: 'Alex Morgan',
  email: 'creator@brandguard.demo',
  role: 'creator',
  initials: 'AM',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
};

const DEMO_CREDENTIALS: Record<'creator' | 'reviewer' | 'admin', { email: string; name: string; initials: string; avatarUrl: string }> = {
  creator: {
    email: 'creator@brandguard.demo',
    name: 'Alex Morgan',
    initials: 'AM',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  reviewer: {
    email: 'reviewer@brandguard.demo',
    name: 'Marcus Vance',
    initials: 'MV',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  admin: {
    email: 'admin@brandguard.demo',
    name: 'Elena Rostova',
    initials: 'ER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getInitialState() {
  if (typeof localStorage === 'undefined') {
    return { user: DEFAULT_CREATOR, isAuthenticated: true, activeWorkspaceId: 'ws_acme_global' };
  }
  try {
    const raw = localStorage.getItem('bg_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { user: parsed, isAuthenticated: true, activeWorkspaceId: localStorage.getItem('bg_active_workspace') || 'ws_acme_global' };
    }
  } catch {
    // fallback
  }
  return { user: DEFAULT_CREATOR, isAuthenticated: true, activeWorkspaceId: 'ws_acme_global' };
}

const initial = getInitialState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial.user,
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspaceId: initial.activeWorkspaceId,
  isAuthenticated: initial.isAuthenticated,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.login(email, password);
      const apiUser = res.user;
      const workspaces: WorkspaceItem[] = (apiUser.workspaces || []).map((w: any) => ({
        id: w.workspaceId || w.id,
        name: w.name,
        brandName: w.brandName,
        plan: 'Enterprise',
        membersCount: 12,
        role: w.role as any,
      }));

      const activeWsId = workspaces[0]?.id || get().activeWorkspaceId || 'ws_acme_global';
      const assignedRole = (workspaces.find((w) => w.id === activeWsId)?.role || apiUser.activeRole || 'creator') as 'creator' | 'reviewer' | 'admin';

      const profile: UserProfile = {
        id: apiUser.id,
        name: apiUser.displayName || email.split('@')[0],
        email: apiUser.email,
        role: assignedRole,
        initials: getInitials(apiUser.displayName || email),
        avatarUrl: apiUser.avatarUrl || DEMO_CREDENTIALS[assignedRole]?.avatarUrl,
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bg_user_profile', JSON.stringify(profile));
        localStorage.setItem('bg_active_workspace', activeWsId);
      }
      api.setWorkspace(activeWsId);

      set({
        user: profile,
        workspaces: workspaces.length > 0 ? workspaces : DEFAULT_WORKSPACES,
        activeWorkspaceId: activeWsId,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      // In dev fallback mode if offline: match demo accounts
      const matched = Object.entries(DEMO_CREDENTIALS).find(([_, c]) => c.email.toLowerCase() === email.toLowerCase());
      if (matched && password === 'BrandGuard2026!') {
        const role = matched[0] as 'creator' | 'reviewer' | 'admin';
        const profile: UserProfile = {
          id: `usr_${role}_demo`,
          name: matched[1].name,
          email: matched[1].email,
          role,
          initials: matched[1].initials,
          avatarUrl: matched[1].avatarUrl,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('bg_user_profile', JSON.stringify(profile));
        }
        set({ user: profile, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      set({ isLoading: false, error: err?.message || 'Login failed' });
      throw err;
    }
  },

  loginWithOAuth: async (provider: 'google' | 'microsoft', idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = provider === 'google' ? await api.loginGoogle(idToken) : await api.loginMicrosoft(idToken);
      const apiUser = res.user;
      const workspaces: WorkspaceItem[] = (apiUser.workspaces || []).map((w: any) => ({
        id: w.workspaceId || w.id,
        name: w.name,
        brandName: w.brandName,
        plan: 'Enterprise',
        membersCount: 12,
        role: w.role as any,
      }));

      const activeWsId = workspaces[0]?.id || get().activeWorkspaceId;
      const assignedRole = (workspaces.find((w) => w.id === activeWsId)?.role || apiUser.activeRole || 'creator') as 'creator' | 'reviewer' | 'admin';

      const profile: UserProfile = {
        id: apiUser.id,
        name: apiUser.displayName || apiUser.email.split('@')[0],
        email: apiUser.email,
        role: assignedRole,
        initials: getInitials(apiUser.displayName || apiUser.email),
        avatarUrl: apiUser.avatarUrl,
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bg_user_profile', JSON.stringify(profile));
        localStorage.setItem('bg_active_workspace', activeWsId);
      }
      api.setWorkspace(activeWsId);

      set({
        user: profile,
        workspaces: workspaces.length > 0 ? workspaces : DEFAULT_WORKSPACES,
        activeWorkspaceId: activeWsId,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || `${provider} authentication failed` });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('bg_user_profile');
        localStorage.removeItem('bg_access_token');
      }
      set({
        user: DEFAULT_CREATOR,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  setWorkspace: (workspaceId: string) => {
    const ws = get().workspaces.find((w) => w.id === workspaceId);
    const newRole = ws?.role || get().user.role;
    api.setWorkspace(workspaceId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bg_active_workspace', workspaceId);
    }
    set((state) => ({
      activeWorkspaceId: workspaceId,
      user: { ...state.user, role: newRole },
    }));
  },

  checkSession: async () => {
    try {
      const res = await api.getCurrentUser();
      if (res?.user) {
        const apiUser = res.user;
        const workspaces: WorkspaceItem[] = (apiUser.workspaces || []).map((w: any) => ({
          id: w.workspaceId || w.id,
          name: w.name,
          brandName: w.brandName,
          plan: 'Enterprise',
          membersCount: 12,
          role: w.role as any,
        }));
        const activeWsId = get().activeWorkspaceId;
        const assignedRole = (workspaces.find((w) => w.id === activeWsId)?.role || apiUser.activeRole || 'creator') as 'creator' | 'reviewer' | 'admin';

        const profile: UserProfile = {
          id: apiUser.id,
          name: apiUser.displayName,
          email: apiUser.email,
          role: assignedRole,
          initials: getInitials(apiUser.displayName),
          avatarUrl: apiUser.avatarUrl,
        };

        set({
          user: profile,
          workspaces: workspaces.length > 0 ? workspaces : DEFAULT_WORKSPACES,
          isAuthenticated: true,
        });
      }
    } catch {
      // session inactive or offline
    }
  },

  devSwitchAccount: async (role: 'creator' | 'reviewer' | 'admin') => {
    const cred = DEMO_CREDENTIALS[role];
    try {
      await get().login(cred.email, 'BrandGuard2026!');
    } catch {
      // Offline fallback
      const profile: UserProfile = {
        id: `usr_${role}_demo`,
        name: cred.name,
        email: cred.email,
        role,
        initials: cred.initials,
        avatarUrl: cred.avatarUrl,
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bg_user_profile', JSON.stringify(profile));
      }
      set({ user: profile, isAuthenticated: true, isLoading: false, error: null });
    }
  },
}));
