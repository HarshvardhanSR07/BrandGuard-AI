# BrandGuard AI Database Schema

Multi-tenant MongoDB data model with mandatory `workspaceId` indexing across all tenant-scoped collections.

## Collections
1. **users**: Platform credentials, email, password hash, global flags.
2. **workspaces**: Tenant accounts, brand names, slug, settings.
3. **memberships**: `userId` + `workspaceId` + `role` (Admin, Compliance Officer, Reviewer, Content Creator, Viewer).
4. **policies**: Brand guidelines, rules, categories, severity, forbidden terms.
5. **approved_facts**: Ground truth corporate claims, authorized metrics, citations.
6. **content_drafts**: Draft text, titles, channels, author, review status.
7. **draft_versions**: Immutable revision snapshots of draft content.
8. **findings**: Discovered violations, confidence, cited evidence, suggested fix.
9. **review_decisions**: Segregation-of-duty reviewer approvals, rejections, notes.
10. **audit_events**: Cryptographic HMAC-SHA256 hash-chained immutable audit log.
