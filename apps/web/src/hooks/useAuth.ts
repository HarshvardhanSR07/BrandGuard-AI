import { useAuthStore } from '../features/auth/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithOAuth,
    logout,
    setWorkspace,
    devSwitchAccount,
  } = useAuthStore();

  const role = user?.role || 'creator';

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    error,
    isCreator: role === 'creator',
    isReviewer: role === 'reviewer',
    isAdmin: role === 'admin',
    login,
    loginWithOAuth,
    logout,
    setWorkspace,
    devSwitchAccount,
    // Backward-compatible for legacy tests/triggers
    loginAs: (targetRole: 'creator' | 'reviewer' | 'admin') => devSwitchAccount(targetRole),
  };
};
