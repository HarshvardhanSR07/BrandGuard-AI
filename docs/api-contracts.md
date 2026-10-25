# BrandGuard AI API Contracts

All endpoints accept and return JSON unless otherwise stated. Authentication is performed via `Authorization: Bearer <token>` and workspace context via `X-Workspace-Id: <workspaceId>`.

## Core Routes
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Obtain JWT access & refresh tokens
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/drafts` - List content drafts for active workspace
- `POST /api/drafts` - Create content draft
- `POST /api/analysis/run` - Trigger compliance analysis on draft
- `GET /api/reviews/queue` - Reviewer approval queue
- `POST /api/reviews/decision` - Submit approve / reject / request changes decision
- `GET /api/governance/dashboard` - Platform compliance metrics & recurring error clusters
