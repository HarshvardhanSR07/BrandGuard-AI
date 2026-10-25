import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  createAuthRouter,
  errorHandler,
  authenticate,
  workspaceContext,
  requirePermission,
  asyncHandler,
  getCtx,
  drafts,
  analyses,
  reviews,
  uploads,
  analytics,
  policies,
  facts,
  listAuditEvents,
  verifyChain,
} from '@brandguard/data-security';

export const createApp = (): Application => {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Auth Router (POST /api/auth/login, GET /api/me/workspaces, POST /api/auth/change-password)
  app.use('/api', createAuthRouter());

  // Policies & Facts
  app.get('/api/policies/active', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await policies.listActive(getCtx(req)));
  }));

  app.get('/api/facts/active', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await facts.listActive(getCtx(req)));
  }));

  // Content Drafts
  app.get('/api/content', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await drafts.listDrafts(getCtx(req), req.query as any));
  }));

  app.post('/api/content', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.status(201).json(await drafts.createDraft(getCtx(req), req.body));
  }));

  app.post('/api/content/:id/revise', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await drafts.reviseDraft(getCtx(req), req.params.id, req.body));
  }));

  app.post('/api/content/:id/submit', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await drafts.submitDraft(getCtx(req), req.params.id));
  }));

  // Analysis & Findings
  app.get('/api/content/:id/issues', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await analyses.listFindings(getCtx(req), req.params.id));
  }));

  // Review & Decisions (Segregation of Duties enforced in reviewRepo)
  app.patch('/api/issues/:id', authenticate(), workspaceContext(), requirePermission('draft:decide'), asyncHandler(async (req, res) => {
    res.json(await reviews.decideFinding(getCtx(req), req.params.id, req.body));
  }));

  app.post('/api/content/:id/decide', authenticate(), workspaceContext(), requirePermission('draft:decide'), asyncHandler(async (req, res) => {
    res.json(await reviews.decideDraft(getCtx(req), req.params.id, req.body));
  }));

  // Uploads
  app.post('/api/uploads', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.status(201).json(await uploads.createUpload(getCtx(req), req.body));
  }));

  // Analytics & Error Clusters
  app.get('/api/analytics/summary', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await analytics.summary(getCtx(req)));
  }));

  // Audit Hash Chain
  app.get('/api/audit', authenticate(), workspaceContext(), requirePermission('workspace:read'), asyncHandler(async (req, res) => {
    res.json(await listAuditEvents(getCtx(req)));
  }));

  app.post('/api/audit/verify', authenticate(), workspaceContext(), requirePermission('workspace:read'), asyncHandler(async (req, res) => {
    res.json(await verifyChain(getCtx(req).workspaceId));
  }));

  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'BrandGuard AI API', timestamp: new Date().toISOString() });
  });

  // Centralized Error Handler
  app.use(errorHandler());

  return app;
};
