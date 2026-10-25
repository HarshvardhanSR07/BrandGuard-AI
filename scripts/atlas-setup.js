// MongoDB Atlas hardening. Run with mongosh as an Atlas admin user (NOT the app user):
//   mongosh "<admin connection string>" --file scripts/atlas-setup.js
// Creates: a custom role limiting the audit collection to insert+find, and a least-privilege app user.
// Replace APP_PASSWORD (or set env APP_DB_PASSWORD) first. Never commit the real password.
const DB = 'brandguard';
const APP_PASSWORD = process.env.APP_DB_PASSWORD || 'REPLACE_ME';
if (APP_PASSWORD === 'REPLACE_ME') throw new Error('Set APP_DB_PASSWORD before running');

const d = db.getSiblingDB(DB);
const COLLECTIONS_RW = ['users', 'workspaces', 'memberships', 'policies', 'approvedfacts', 'drafts', 'analyses', 'findings', 'uploads'];
const COLLECTIONS_INSERT_ONLY = ['auditevents', 'revisions', 'reviewdecisions']; // append-only collections: insert + find, never update/remove

const privileges = [
  ...COLLECTIONS_RW.map((c) => ({ resource: { db: DB, collection: c }, actions: ['find', 'insert', 'update', 'remove', 'createIndex', 'collStats'] })),
  ...COLLECTIONS_INSERT_ONLY.map((c) => ({ resource: { db: DB, collection: c }, actions: ['find', 'insert', 'createIndex', 'collStats'] })),
];
// NOTE: the seed script (--reset) needs remove on append-only collections; run it with an admin user on dev databases only.

try { d.dropRole('brandguardApp'); } catch (e) { /* not found */ }
d.createRole({ role: 'brandguardApp', privileges, roles: [] });
try { d.dropUser('brandguard_app'); } catch (e) { /* not found */ }
d.createUser({ user: 'brandguard_app', pwd: APP_PASSWORD, roles: [{ role: 'brandguardApp', db: DB }] });
print('Created role brandguardApp and user brandguard_app (audit/revision/decision collections are insert+find only).');
print('Next: Atlas UI -> Network Access -> add ONLY your Render outbound IPs (not 0.0.0.0/0).');
