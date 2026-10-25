import { useAuthStore } from '../features/auth/authStore';

export const useAuth = () => {
  const { user, loginAs } = useAuthStore();
  return {
    user,
    role: user.role,
    isCreator: user.role === 'creator',
    isReviewer: user.role === 'reviewer',
    isAdmin: user.role === 'admin',
    loginAs,
  };
};
