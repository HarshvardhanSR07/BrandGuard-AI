/**
 * Seeds two isolated SYNTHETIC workspaces and four users:
 *
 *   User            Alpha (Lumora Skincare)   Beta (Voltix Mobility)
 *   user1 (Asha)    admin                     creator
 *   user2 (Ben)     creator                   -
 *   user3 (Chitra)  reviewer                  -
 *   user4 (Dev)     -                         reviewer
 *
 * Passwords come from SEED_PASSWORD_USER1..4 or are generated randomly and written to .seed-credentials.local.json
 * (git-ignored). Nothing here is real brand data. Refuses to wipe data when NODE_ENV=production.
 *
 *   npm run seed          # insert (fails if users already exist)
 *   npm run seed:reset    # drop the seeded collections first (never in production)
 */
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import mongoose from 'mongoose';
import { loadEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { appendAuditEvent } from '../audit/auditLog';
import { ApprovedFact, Membership, Policy, User, Workspace } from '../models';
import { hashPassword } from '../security/password';
import { resolveAccessContext } from '../security/context';
import * as drafts from '../repositories/draftRepo';
import type { Role } from '../types';

const USERS = [
  { key: 'user1', email: 'user1@brandguard.test', displayName: 'Asha (synthetic)' },
  { key: 'user2', email: 'user2@brandguard.test', displayName: 'Ben (synthetic)' },
  { key: 'user3', email: 'user3@brandguard.test', displayName: 'Chitra (synthetic)' },
  { key: 'user4', email: 'user4@brandguard.test', displayName: 'Dev (synthetic)' },
] as const;

const MEMBERS: Array<{ user: string; ws: 'alpha' | 'beta'; role: Role }> = [
  { user: 'user1', ws: 'alpha', role: 'admin' },
  { user: 'user1', ws: 'beta', role: 'creator' },
  { user: 'user2', ws: 'alpha', role: 'creator' },
  { user: 'user3', ws: 'alpha', role: 'reviewer' },
  { user: 'user4', ws: 'beta', role: 'reviewer' },
];

const DAY = 86_400_000;

async function main() {
  const env = loadEnv();
  const reset = process.argv.includes('--reset');
  if (reset && env.NODE_ENV === 'production') throw new Error('Refusing to --reset in production');
  await connectDb();

  if (reset) {
    for (const name of ['users', 'workspaces', 'memberships', 'policies', 'approvedfacts', 'drafts', 'revisions', 'analyses', 'findings', 'reviewdecisions', 'auditevents', 'uploads']) {
      await mongoose.connection.collection(name).deleteMany({}); // raw driver: bypasses append-only hooks on purpose
    }
  }
  if ((await User.countDocuments({})) > 0) throw new Error('Database already has users. Use --reset on a dev database.');

  // ---- users (passwords never committed) ----
  const credentials: Record<string, { email: string; password: string }> = {};
  const userIds: Record<string, string> = {};
  for (const [i, u] of USERS.entries()) {
    const password = process.env[`SEED_PASSWORD_USER${i + 1}`] || randomBytes(12).toString('base64url');
    credentials[u.key] = { email: u.email, password };
    const doc = await User.create({ email: u.email, displayName: u.displayName, passwordHash: await hashPassword(password) });
    userIds[u.key] = String(doc._id);
  }

  // ---- workspaces ----
  const alpha = await Workspace.create({ name: 'Alpha', brandName: 'Lumora Skincare (synthetic)', isSynthetic: true });
  const beta = await Workspace.create({ name: 'Beta', brandName: 'Voltix Mobility (synthetic)', isSynthetic: true });
  const wsId = { alpha: String(alpha._id), beta: String(beta._id) };

  for (const m of MEMBERS) {
    await Membership.create({ userId: userIds[m.user], workspaceId: wsId[m.ws], role: m.role, status: 'active' });
  }

  // ---- policies & facts: DIFFERENT per workspace so identical text yields different findings ----
  const now = new Date();
  const mk = (ws: 'alpha' | 'beta') => ({ workspaceId: wsId[ws], effectiveFrom: new Date(now.getTime() - 30 * DAY), status: 'active' as const, version: 1 });

  await Policy.insertMany([
    { ...mk('alpha'), ruleKey: 'no-guaranteed-safe', category: 'prohibited_phrase', severity: 'critical', text: 'Never claim a product is "guaranteed safe".', phrases: ['guaranteed safe', '100% safe'], suggestedReplacement: 'gentle on skin' },
    { ...mk('alpha'), ruleKey: 'term-serum', category: 'terminology', severity: 'low', text: 'Use "serum", not "potion".', phrases: ['potion'], suggestedReplacement: 'serum' },
    { ...mk('alpha'), ruleKey: 'disclaimer-patch-test', category: 'disclaimer', severity: 'high', text: 'Every product post must include: "Patch test before use."', phrases: ['patch test before use'] },
    { ...mk('beta'), ruleKey: 'no-cheapest', category: 'prohibited_phrase', severity: 'high', text: 'Never claim to be "the cheapest".', phrases: ['the cheapest', 'cheapest ever'], suggestedReplacement: 'great value' },
    { ...mk('beta'), ruleKey: 'term-ride-credit', category: 'terminology', severity: 'low', text: 'Use "ride credit", not "free rides".', phrases: ['free rides'], suggestedReplacement: 'ride credit' },
    { ...mk('beta'), ruleKey: 'disclaimer-tnc', category: 'disclaimer', severity: 'high', text: 'Every offer must include: "T&Cs apply."', phrases: ['t&cs apply'] },
  ]);

  await ApprovedFact.insertMany([
    // Alpha price history: v1 (INR 599) was retired 30 days ago, v2 (INR 799) is current. Lets you demo "stale" evidence.
    { ...mk('alpha'), factKey: 'serum-price', version: 1, statement: 'The Glow Serum costs INR 599 (synthetic).', sourceRef: 'synthetic://alpha/price-list-2025', status: 'retired' as const, effectiveFrom: new Date(now.getTime() - 400 * DAY), effectiveTo: new Date(now.getTime() - 30 * DAY) },
    { ...mk('alpha'), factKey: 'serum-price', version: 2, statement: 'The Glow Serum costs INR 799 (synthetic).', sourceRef: 'synthetic://alpha/price-list-2026' },
    { ...mk('beta'), factKey: 'ride-credit', statement: 'New riders receive INR 100 ride credit (synthetic).', sourceRef: 'synthetic://beta/offer-sheet-2026' },
  ]);

  for (const ws of ['alpha', 'beta'] as const) {
    await appendAuditEvent({ workspaceId: wsId[ws], actorId: null, action: 'policy.created', targetType: 'seed', meta: { seed: true, note: 'synthetic seed data' } });
  }

  // ---- a few drafts, created through the real repositories (so they exercise the same rules) ----
  const ben = await resolveAccessContext(userIds.user2, wsId.alpha);
  const asha = await resolveAccessContext(userIds.user1, wsId.beta);
  await drafts.createDraft(ben, { title: 'Unsubmitted launch post (synthetic)', channel: 'social', text: 'Our new potion is guaranteed safe for everyone!' });
  const submitted = await drafts.createDraft(ben, { title: 'Submitted campaign copy (synthetic)', channel: 'web', text: 'Meet the Glow Serum, now only INR 599. Patch test before use.' });
  await drafts.submitDraft(ben, String(submitted._id));
  await drafts.createDraft(asha, { title: 'Beta promo draft (synthetic)', channel: 'ad', text: 'The cheapest rides in town, free rides for everyone!' });

  writeFileSync('.seed-credentials.local.json', JSON.stringify({ alphaWorkspaceId: wsId.alpha, betaWorkspaceId: wsId.beta, users: credentials }, null, 2), { mode: 0o600 });
  console.log('Seed complete. Credentials written to .seed-credentials.local.json (git-ignored).');
  console.log(`Alpha workspace id: ${wsId.alpha}\nBeta workspace id:  ${wsId.beta}`);
  await disconnectDb();
}

main().catch(async (e) => {
  console.error('Seed failed:', e instanceof Error ? e.message : e);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
