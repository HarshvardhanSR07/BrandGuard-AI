# Design: database + security (locked decisions)

## Layers
1. Authentication: bcrypt hashes, 1h HS256 JWT carrying only `sub` + `tokenVersion`; seeded users only; no signup.
2. Membership: DB lookup of `{userId, workspaceId, status:'active'}` on every request -> `AccessContext` (role from DB, never from token).
3. Permission: one role x action matrix (`security/permissions.ts`), deny by default.
4. Scoped repositories: every function takes an `AccessContext` first; all queries include `workspaceId`; by-id reads use `{_id, workspaceId}`; mismatch = 404.
5. State machine in the data layer; 6. Audit: one writer, append-only, per-workspace SHA-256 hash chain.

Global Mongoose settings: `sanitizeFilter=true` (operator injection), `strictQuery='throw'` (a dropped workspace filter can never be silent).
Own operator queries use `mongoose.trusted()`.

## Permission matrix
| Action | Admin | Creator | Reviewer |
|---|---|---|---|
| Read policies/facts | yes | yes | yes |
| Manage policies, facts, membership | yes | no | no |
| Create / edit / submit / analyse / upload (own draft only) | no | yes | yes |
| Read unsubmitted drafts | yes (read-only) | own | own |
| Read submitted+ drafts, findings | yes | yes | yes |
| Decide on draft/finding | no | no | yes, only if actor != author and status = submitted |
| Analytics, audit log | yes (all) | no | yes (submitted drafts only) |

## Draft states
`draft -> submitted -> approved | rejected | changes_requested -> (author revises) -> submitted`. No `in_review`. Approved/rejected are terminal.
Edits create immutable revisions. Findings, analyses, uploads, audit events inherit the draft's visibility.

## Collections
users, workspaces, memberships (unique userId+workspaceId), policies & approvedFacts (versioned, immutable content, one active per key),
drafts, revisions (append-only), analyses (pin exact policy/fact versions), findings (evidenceStatus taxonomy), reviewDecisions (append-only),
auditEvents (unique workspaceId+seq, append-only, prevHash/hash), uploads (metadata + capped untrusted extracted text, no file bytes).

## Safeguards
- Analysis status is computed in the data layer: failed/unavailable AI or OCR can never yield `complete`.
- Findings may cite only sources pinned to their analysis, existing in the same workspace; `supported`/`contradicted` need current sources;
  a valid id is not proof of support (the AI/evidence module decides that, this layer refuses impossible states).
- Suggestions are `ready` only if revalidated and passed.
- Last active admin can never be removed/demoted. Admins assign existing users only.
- Audit chain limits: detects edits, mid-chain deletion, reordering; not tail truncation or a full rewrite by someone with DB write access.
  Production hardening: Atlas user with insert+find only on `auditevents`, external head-hash storage.
