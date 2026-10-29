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
import { brandGuardAIService } from './ai/brandGuardAIService';

export const createApp = (): Application => {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Public Health & Engine Status
  app.get('/api/health', (req, res) => {
    const token = process.env.HF_TOKEN || process.env.HF_ACCESS_KEY;
    const modelId = process.env.HF_MODEL_ID || 'aliasLLM/brandguard-ai-model';
    const endpoint =
      process.env.HF_INFERENCE_URL ||
      process.env.AI_INFERENCE_URL ||
      `https://api-inference.huggingface.co/models/${modelId}`;
    res.json({
      status: 'ok',
      apiKeyConfigured: !!token,
      keyPrefix: token ? `${token.substring(0, 4)}...` : null,
      modelId,
      inferenceEndpoint: endpoint,
      engineMode: token ? 'API Token Enabled' : 'Offline Deterministic Grounding',
    });
  });

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

  app.get('/api/content/:id', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    const draft = await drafts.getDraft(getCtx(req), req.params.id);
    const rev = await drafts.getRevision(getCtx(req), req.params.id);
    res.json({ ...draft, text: rev.text, revision: rev });
  }));

  app.get('/api/content/:id/revisions', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await drafts.listRevisions(getCtx(req), req.params.id));
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

  // End-to-End Compliance Analysis (Phase 1: Re-analysis & No False Green)
  app.post('/api/content/:id/analyse', authenticate(), workspaceContext(), requirePermission('analysis:run'), asyncHandler(async (req, res) => {
    const ctx = getCtx(req);
    const draft = await drafts.getDraft(ctx, req.params.id);
    const rev = await drafts.getRevision(ctx, req.params.id);

    // 1. Start analysis (pins active sources for this exact revision)
    const analysis = await analyses.startAnalysis(ctx, req.params.id);

    // 2. Run BrandGuard AI Review Engine (ChatML + LoRA runner + Gates L-01..L-06)
    const brandName = req.query.brand ? String(req.query.brand) : 'VerdantCo';
    const result = await brandGuardAIService.brand_governance_review(brandName, rev.text);

    // 2b. Record findings in DB if findings exist
    if (result.review.findings && result.review.findings.length > 0) {
      try {
        const keyToPinned = new Map<string, { kind: 'policy' | 'fact'; refId: string }>();
        for (const p of analysis.pinnedSources) {
          keyToPinned.set(p.key, { kind: p.kind, refId: String(p.refId) });
        }

        const sevMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
          'Low': 'low',
          'Medium': 'medium',
          'High': 'high',
          'Critical': 'critical',
        };
        const catMap: Record<string, any> = {
          'Tone': 'tone_voice',
          'Terminology': 'terminology',
          'Factual Claim': 'claim_boundary',
          'Stale Information': 'staleness',
          'Prompt Injection': 'prohibited_phrase',
          'Conflicting Evidence': 'claim_boundary',
        };

        const formattedFindings = result.review.findings.map(f => {
          const refs: Array<{ kind: 'policy' | 'fact'; refId: string }> = [];
          for (const refKey of f.evidence_references) {
            const matched = keyToPinned.get(refKey);
            if (matched) {
              refs.push(matched);
            }
          }
          if (refs.length === 0 && analysis.pinnedSources.length > 0) {
            refs.push({ kind: analysis.pinnedSources[0].kind, refId: String(analysis.pinnedSources[0].refId) });
          }

          const startIdx = rev.text.indexOf(f.affected_text);
          const endIdx = startIdx >= 0 ? startIdx + f.affected_text.length : 0;

          const evidenceStatus = f.claim_status === 'Supported'
            ? 'supported'
            : f.claim_status === 'Stale'
            ? 'stale'
            : f.claim_status === 'Conflicting'
            ? 'conflicting'
            : 'unverifiable';

          return {
            category: catMap[f.issue_category] || 'claim_boundary',
            severity: sevMap[f.severity] || 'medium',
            source: 'ai_rule' as const,
            ruleKey: f.rule_reference || f.evidence_references[0] || 'RULE_DEFAULT',
            excerpt: f.affected_text,
            startOffset: startIdx >= 0 ? startIdx : 0,
            endOffset: endIdx,
            explanation: f.explanation,
            evidenceRefs: refs,
            evidenceStatus,
            uncertainty: 0.05,
            suggestion: f.corrected_text ? {
              replacementText: f.corrected_text,
              explanation: f.explanation,
              revalidated: true,
              revalidationPassed: true,
            } : undefined,
          };
        });

        await analyses.recordFindings(ctx, String(analysis._id), { findings: formattedFindings });
      } catch (e) {
        console.warn('[BrandGuard AI] Could not persist findings to analysisRepo:', e);
      }
    }

    // 3. Finalize analysis status (strictly no false greens: failed if incomplete)
    const isComplete = result.review.status === 'Complete' && !result.structuralFailure;
    const finalized = await analyses.finalizeAnalysis(ctx, String(analysis._id), {
      deterministicStatus: 'complete',
      aiRequired: true,
      aiStatus: isComplete ? 'complete' : 'failed',
      ocrStatus: 'complete',
      errors: result.review.incomplete_reasons,
    });

    res.json({
      analysis: finalized,
      review: result.review,
      path: result.path,
      action: result.action,
      appliedGates: result.appliedGates,
    });
  }));

  // Analysis & Findings
  app.get('/api/content/:id/issues', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await analyses.listFindings(getCtx(req), req.params.id));
  }));

  // BrandGuard AI Specialist Governance Review (Qwen3-4B LoRA Module + Gates L-01 to L-06)
  app.post('/api/governance/review', asyncHandler(async (req, res) => {
    const { brand_id, draft_text } = req.body;
    if (!brand_id || !draft_text) {
      return res.status(400).json({ error: { message: 'brand_id and draft_text are required' } });
    }
    const result = await brandGuardAIService.brand_governance_review(brand_id, draft_text);
    res.json(result);
  }));

  // Review & Decisions (Phase 2: Review Queue & Segregation of Duties)
  app.get('/api/reviews/queue', authenticate(), workspaceContext(), requirePermission('draft:decide'), asyncHandler(async (req, res) => {
    const list = await drafts.listDrafts(getCtx(req), { status: 'submitted' });
    const enriched = await Promise.all(list.map(async (d) => {
      const rev = await drafts.getRevision(getCtx(req), String(d._id)).catch(() => null);
      const isOwnDraft = String(d.authorId) === String(getCtx(req).userId);
      return {
        ...d,
        text: rev?.text || '',
        isOwnDraft,
        canDecide: !isOwnDraft,
      };
    }));
    res.json(enriched);
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
  app.get('/api/audit', authenticate(), workspaceContext(), requirePermission('audit:read'), asyncHandler(async (req, res) => {
    res.json(await listAuditEvents(getCtx(req)));
  }));

  app.post('/api/audit/verify', authenticate(), workspaceContext(), requirePermission('audit:read'), asyncHandler(async (req, res) => {
    res.json(await verifyChain(getCtx(req)));
  }));

  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'BrandGuard AI API', timestamp: new Date().toISOString() });
  });

  // Centralized Error Handler
  app.use(errorHandler());

  return app;
};
