# BrandGuard AI: Database + Security package

Owner: Member 3 (database) / security layer. Mongoose models, workspace-scoped repositories, auth, RBAC, state machine,
hash-chained audit log, seed data and tests. Routes (Member 1), UI (Member 2) and AI/OCR (Member 4) plug into this.

## Quick start
```bash
npm install
cp .env.example .env        # set MONGODB_URI and a JWT_SECRET (>= 32 random chars)
npm run seed:reset          # 2 synthetic workspaces, 4 users; credentials -> .seed-credentials.local.json (git-ignored)
npm test                    # unit + integration (mongodb-memory-server downloads a MongoDB binary on first run)
```

## STATUS: read this first
- Verified by actually running: permission matrix, draft state machine, audit hash-chain logic (21 unit tests passed).
- Written but NOT yet executed (no network when this was built, so deps were not installable): everything that needs
  Mongoose/Express/Zod, i.e. models, repositories, middleware, seed and the integration tests in `tests/integration`.
  **First thing to do: `npm install && npm run typecheck && npm test` and fix anything that surfaces.**
- Added in the completion pass (also not yet executed): password change, user deactivation script, security headers + CORS allowlist,
  Atlas role/user script, optional approval guard (`REQUIRE_COMPLETE_ANALYSIS_FOR_APPROVAL`), deployment guide.
- Remaining follow-ups: store the audit head hash outside the DB, transactions for multi-step writes (needs Atlas replica set).
- Belongs to other members: prompt-injection tests and evidence-supports-claim checks (Member 4), routes (Member 1), UI (Member 2).

## Layout
`src/models` schemas+indexes | `src/security` permissions, state machine, JWT, password, AccessContext | `src/repositories` all data access
| `src/audit` hash chain + single writer | `src/http` Express middleware + login router | `src/seed` | `docs/` design + integration | `tests/`

Read `docs/DEPLOYMENT.md` for Atlas/Render/Vercel setup (`scripts/atlas-setup.js` creates the least-privilege DB user), `docs/INTEGRATION.md` to wire routes, and `docs/DESIGN.md` for the locked rules.
