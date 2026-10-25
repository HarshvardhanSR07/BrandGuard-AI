# Deployment and security checklist (Gate 7)

Order: local end-to-end passes first, then deploy.

## 1. MongoDB Atlas
1. Create the cluster + database `brandguard`.
2. As an Atlas admin run `APP_DB_PASSWORD=<strong> mongosh "<admin uri>" --file scripts/atlas-setup.js`
   -> creates user `brandguard_app` whose role can only INSERT/FIND on `auditevents`, `revisions`, `reviewdecisions`.
   (Mongoose indexes are created by the app user via `createIndex`, already granted.)
3. Network Access: allow only Render's outbound IPs. Do not leave `0.0.0.0/0`.
4. Build the app's `MONGODB_URI` with `brandguard_app` (not the admin user).

## 2. Render (backend) environment variables
| Variable | Value |
|---|---|
| NODE_ENV | production |
| MONGODB_URI | Atlas URI for `brandguard_app` |
| JWT_SECRET | 48+ random bytes: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| JWT_EXPIRES_IN | 1h |
| BCRYPT_COST | 12 |
| AUDIT_HASH_CHAIN | on |
| CORS_ORIGINS | your exact Vercel URL(s), comma-separated, no trailing slash |
| REQUIRE_COMPLETE_ANALYSIS_FOR_APPROVAL | on (recommended for the demo story "no false green") |
Add the OpenRouter key here too (server-side only). The app refuses to start if JWT_SECRET is missing/short/placeholder.

Server bootstrap order: `loadEnv()` -> `connectDb()` -> `app.set('trust proxy', 1)` (Render is behind a proxy; needed so the login rate limiter sees real IPs)
-> `securityHeaders()` -> `corsAllowlist(env.CORS_ORIGINS)` -> `express.json({limit})` -> routes -> `errorHandler()`.

## 3. Vercel (frontend)
Set only the public API base URL (e.g. `VITE_API_URL`). No secrets in frontend env. Keep the JWT in memory, send `Authorization: Bearer`.

## 4. Seeding production-like demo data
Never run `seed:reset` against a shared/production DB (it refuses when NODE_ENV=production). Seed locally or on a dev cluster, or run
`npm run seed` once on an EMPTY demo database with an admin connection string. Credentials go to `.seed-credentials.local.json`; share them out-of-band.

## 5. Pre-demo verification
- [ ] `npm test` passes locally (all suites, incl. isolation + architecture)
- [ ] Log in as each of the 4 seeded users; check `/api/me/workspaces` roles match the seed table
- [ ] user2 (Alpha only) requesting a Beta workspace gets 403; an Alpha draft id under Beta gets 404
- [ ] Reviewer cannot approve own draft; creator gets 403 on review/analytics/audit
- [ ] `verifyChain` ok; tamper one event in Atlas shell as ADMIN, verify reports the broken seq (then restore/reseed)
- [ ] Atlas network access list contains no 0.0.0.0/0; no secrets in the Git history (`git log -p | grep -i secret`)
- [ ] CORS: browser from the Vercel origin works; a request with another Origin gets no CORS headers

## 6. Operations
- Disable a user: `npm run user:deactivate -- <email>` (also kills their tokens). Password change: `POST /api/me/password`.
- Audit head hash: periodically record `verifyChain().headHash` somewhere outside the database (e.g. the team's private notes) so tail truncation is detectable.
