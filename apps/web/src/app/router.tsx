import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { AppLayout } from '../components/layout/AppLayout';
import { PageSkeleton } from '../components/layout/PageSkeleton';

// Route-based code splitting for minimal initial bundle and fast page transitions
const LandingPage = lazy(() =>
  import('../features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const DraftListPage = lazy(() =>
  import('../features/drafts/DraftListPage').then((m) => ({ default: m.DraftListPage }))
);
const DraftEditorPage = lazy(() =>
  import('../features/drafts/DraftEditorPage').then((m) => ({ default: m.DraftEditorPage }))
);
const AnalysisPage = lazy(() =>
  import('../features/analysis/AnalysisPage').then((m) => ({ default: m.AnalysisPage }))
);
const ReviewQueuePage = lazy(() =>
  import('../features/review/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage }))
);
const ReviewDetailPage = lazy(() =>
  import('../features/review/ReviewDetailPage').then((m) => ({ default: m.ReviewDetailPage }))
);
const PolicyManagementPage = lazy(() =>
  import('../features/policies/PolicyManagementPage').then((m) => ({ default: m.PolicyManagementPage }))
);
const GovernanceDashboard = lazy(() =>
  import('../features/governance/GovernanceDashboard').then((m) => ({ default: m.GovernanceDashboard }))
);
const ApprovedFactsPage = lazy(() =>
  import('../features/policies/ApprovedFactsPage').then((m) => ({ default: m.ApprovedFactsPage }))
);
const WorkspacePage = lazy(() =>
  import('../features/workspaces/WorkspacePage').then((m) => ({ default: m.WorkspacePage }))
);
const AuditLogPage = lazy(() =>
  import('../features/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage }))
);
const UsersAndRolesPage = lazy(() =>
  import('../features/members/UsersAndRolesPage').then((m) => ({ default: m.UsersAndRolesPage }))
);
import { RequireRole } from '../components/auth/RequireRole';

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageSkeleton />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // Screen 01: Landing Page / Introduction
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/landing',
    element: withSuspense(LandingPage),
  },
  // Screen 02: Login & Authentication
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/sso-callback',
    element: <AuthenticateWithRedirectCallback signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard" />,
  },
  // Main Application Shell
  {
    element: <AppLayout />,
    children: [
      // Screen 03: Executive / Role-based Dashboard
      {
        path: 'dashboard',
        element: withSuspense(DashboardPage),
      },
      // Screen 04: Content Review & Drafts List
      {
        path: 'drafts',
        element: withSuspense(DraftListPage),
      },
      // Screen 05: Draft Editor
      {
        path: 'drafts/new',
        element: withSuspense(DraftEditorPage),
      },
      {
        path: 'drafts/edit',
        element: withSuspense(DraftEditorPage),
      },
      // Screen 06: Findings & Real-Time AI Analysis
      {
        path: 'analysis',
        element: withSuspense(AnalysisPage),
      },
      // Screen 07: Review Queue Workstation (Reviewer & Admin only)
      {
        path: 'review',
        element: (
          <RequireRole allowedRoles={['reviewer', 'admin']}>
            {withSuspense(ReviewQueuePage)}
          </RequireRole>
        ),
      },
      // Screen 08: Review Details & Decision Studio (Reviewer & Admin only)
      {
        path: 'review/:id',
        element: (
          <RequireRole allowedRoles={['reviewer', 'admin']}>
            {withSuspense(ReviewDetailPage)}
          </RequireRole>
        ),
      },
      // Screen 09: Brand Policies & Rulebooks
      {
        path: 'policies',
        element: withSuspense(PolicyManagementPage),
      },
      // Screen 10: Approved Facts Ground Truth (SER)
      {
        path: 'approved-facts',
        element: withSuspense(ApprovedFactsPage),
      },
      // Screen 11: Governance Insights & Error Clustering
      {
        path: 'governance',
        element: withSuspense(GovernanceDashboard),
      },
      // Screen 12: Cryptographic Audit Trail
      {
        path: 'audit',
        element: withSuspense(AuditLogPage),
      },
      // Users & Roles Management (Admin only)
      {
        path: 'members',
        element: (
          <RequireRole allowedRoles={['admin']}>
            {withSuspense(UsersAndRolesPage)}
          </RequireRole>
        ),
      },
      // Screen 13: Workspace Settings & Integrations
      {
        path: 'settings',
        element: withSuspense(WorkspacePage),
      },
      // Fallback
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
