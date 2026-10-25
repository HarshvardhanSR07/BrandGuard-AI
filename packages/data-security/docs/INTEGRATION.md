# Integration guide (for Members 1, 2, 4)

Import ONLY from `src/index.ts` (or the built package). Never import models or Mongoose in routes (ESLint rule in `.eslintrc.cjs`; copy it).

## Server bootstrap
```ts
import express from 'express';
import { loadEnv, connectDb, createAuthRouter, errorHandler } from './data-security'; // path to this package's src/index
loadEnv();                      // throws (process won't start) if JWT_SECRET etc. are missing/unsafe
await connectDb();
const app = express();
app.use(express.json({ limit: '1mb' }));   // also add helmet + CORS limited to the Vercel origin
app.use('/api', createAuthRouter());       // POST /api/auth/login, GET /api/me/workspaces
// ... your routes ...
app.use(errorHandler());                   // LAST
```

## Route pattern
```ts
import { authenticate, workspaceContext, requirePermission, asyncHandler, getCtx, drafts, reviews } from './data-security';

// workspace comes from the path (/api/workspaces/:workspaceId/...) or the X-Workspace-Id header
app.post('/api/content', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
  res.status(201).json(await drafts.createDraft(getCtx(req), req.body));      // repo validates with Zod itself
}));
app.patch('/api/issues/:id', authenticate(), workspaceContext(), requirePermission('draft:decide'),
  asyncHandler(async (req, res) => res.json(await reviews.decideFinding(getCtx(req), req.params.id, req.body))));
```

## Endpoint -> function map
| Endpoint | Function |
|---|---|
| POST /api/auth/login, GET /api/me/workspaces | `createAuthRouter()` (`login`, `listMyWorkspaces`) |
| GET /api/policies/active | `policies.listActive(ctx)` (facts: `facts.listActive`) |
| POST /api/content | `drafts.createDraft` ; revise `drafts.reviseDraft` ; submit `drafts.submitDraft` ; list `drafts.listDrafts` |
| POST /api/content/:id/analyse | `analyses.startAnalysis` -> `analyses.recordFindings` -> `analyses.finalizeAnalysis` |
| GET /api/content/:id/issues | `analyses.listFindings(ctx, draftId)` |
| PATCH /api/issues/:id | `reviews.decideFinding` ; whole draft: `reviews.decideDraft` |
| POST /api/uploads | `uploads.createUpload` (extraction/OCR runs in your code; pass the result in; no file bytes stored) |
| GET /api/analytics/summary | `analytics.summary` (recurrence is inside `.recurring`) |
| Audit / admin | `listAuditEvents`, `verifyChain`, `members.*`, `policies.createVersion`, `facts.createVersion` |

## Rules that bite
- Token: `Authorization: Bearer <jwt>`. Frontend keeps it in memory (reload = re-login). Never in URLs/logs.
- Errors are `{ error: { code, message } }`. 401 unauthenticated, 403 forbidden / not a member, 404 not found OR not visible (deliberate), 409 conflict/invalid transition, 422 evidence invalid, 429 rate limit.
- AI member: pass `evidenceRefs` as `{kind:'policy'|'fact', refId}` that were returned in the analysis' pinned sources; set `evidenceStatus` yourself; call `finalizeAnalysis` with the REAL `aiStatus`/`ocrStatus`. Status `complete` cannot be forced.
- Treat `upload.extractedText` as untrusted (prompt injection). Never put draft text in audit `meta`.
- Frontend: show role per workspace from `/api/me/workspaces`; hide UI by role, but the backend is the enforcement.
