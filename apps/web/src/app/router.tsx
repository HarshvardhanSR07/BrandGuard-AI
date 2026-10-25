import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DraftListPage } from '../features/drafts/DraftListPage';
import { DraftEditorPage } from '../features/drafts/DraftEditorPage';
import { AnalysisPage } from '../features/analysis/AnalysisPage';
import { ReviewQueuePage } from '../features/review/ReviewQueuePage';
import { ReviewDetailPage } from '../features/review/ReviewDetailPage';
import { PolicyManagementPage } from '../features/policies/PolicyManagementPage';
import { GovernanceDashboard } from '../features/governance/GovernanceDashboard';
import { ApprovedFactsPage } from '../features/policies/ApprovedFactsPage';
import { WorkspacePage } from '../features/workspaces/WorkspacePage';
import { AuditLogPage } from '../features/audit/AuditLogPage';

export const router = createBrowserRouter([
  // Screen 01: Landing Page / Introduction
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  // Screen 02: Login & Authentication
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Main Application Shell
  {
    element: <AppLayout />,
    children: [
      // Screen 03: Role-based Dashboard
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      // Screen 04: Drafts List
      {
        path: 'drafts',
        element: <DraftListPage />,
      },
      // Screen 05: Draft Editor
      {
        path: 'drafts/new',
        element: <DraftEditorPage />,
      },
      {
        path: 'drafts/edit',
        element: <DraftEditorPage />,
      },
      // Screen 06: Analysis Results
      {
        path: 'analysis',
        element: <AnalysisPage />,
      },
      // Screen 07: Review Queue
      {
        path: 'review',
        element: <ReviewQueuePage />,
      },
      // Screen 08: Review Details
      {
        path: 'review/:id',
        element: <ReviewDetailPage />,
      },
      // Screen 09: Brand Policies
      {
        path: 'policies',
        element: <PolicyManagementPage />,
      },
      // Screen 10: Governance & Recurring Issues
      {
        path: 'governance',
        element: <GovernanceDashboard />,
      },
      // Screen 11: Approved Facts Ground Truth
      {
        path: 'approved-facts',
        element: <ApprovedFactsPage />,
      },
      // Screen 12: Workspace Settings
      {
        path: 'settings',
        element: <WorkspacePage />,
      },
      // Screen 13: Audit Log & Cryptographic Chain
      {
        path: 'audit',
        element: <AuditLogPage />,
      },
      // Fallback
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
