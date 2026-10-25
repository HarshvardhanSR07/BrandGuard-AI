import { useAuthStore } from '../features/auth/authStore';

export const useWorkspace = () => {
  const { workspaces, activeWorkspaceId, setWorkspace } = useAuthStore();
  const current = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return {
    workspace: current,
    workspaces,
    setWorkspace,
  };
};
