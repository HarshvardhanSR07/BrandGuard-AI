import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RequireRoleProps {
  allowedRoles: Array<'creator' | 'reviewer' | 'admin'>;
  redirectTo?: string;
  children?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  redirectTo = '/dashboard',
  children,
}) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
