import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resetEnvCache } from '../src/config/env';
import { connectDb, disconnectDb } from '../src/db/connect';
import { ApprovedFact, Membership, Policy, User, Workspace } from '../src/models';
import { hashPassword } from '../src/security/password';
import { resolveAccessContext, type AccessContext } from '../src/security/context';

export const PASSWORD = 'Test-Passw0rd!';
let mongod: MongoMemoryServer | undefined;

export async function startDb() {
  resetEnvCache();
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri('brandguard_test'));
}
export async function stopDb() {
  await disconnectDb();
  await mongod?.stop();
}
/** Raw driver deleteMany bypasses the append-only hooks on purpose (test cleanup only). */
export async function clearDb() {
  const cols = await mongoose.connection.db!.collections();
  await Promise.all(cols.map((c) => c.deleteMany({})));
}

export interface Fixture {
  ids: { user1: string; user2: string; user3: string; user4: string; alpha: string; beta: string };
  alphaAdmin: AccessContext;      // user1 in Alpha
  betaCreator: AccessContext;     // user1 in Beta
  alphaCreator: AccessContext;    // user2 in Alpha
  alphaReviewer: AccessContext;   // user3 in Alpha
  betaReviewer: AccessContext;    // user4 in Beta
  policyAlpha: string; factAlpha: string; policyBeta: string;
}

/** The locked seed matrix: user1 admin@Alpha + creator@Beta, user2 creator@Alpha, user3 reviewer@Alpha, user4 reviewer@Beta. */
export async function buildFixture(): Promise<Fixture> {
  const passwordHash = await hashPassword(PASSWORD);
  const mkUser = async (n: number) => String((await User.create({ email: `user${n}@brandguard.test`, displayName: `User ${n}`, passwordHash }))._id);
  const [user1, user2, user3, user4] = [await mkUser(1), await mkUser(2), await mkUser(3), await mkUser(4)];
  const alpha = String((await Workspace.create({ name: 'Alpha', brandName: 'Alpha Brand', isSynthetic: true }))._id);
  const beta = String((await Workspace.create({ name: 'Beta', brandName: 'Beta Brand', isSynthetic: true }))._id);
  const member = (userId: string, workspaceId: string, role: string) => Membership.create({ userId, workspaceId, role, status: 'active' });
  await member(user1, alpha, 'admin'); await member(user1, beta, 'creator');
  await member(user2, alpha, 'creator'); await member(user3, alpha, 'reviewer'); await member(user4, beta, 'reviewer');

  const past = new Date(Date.now() - 86_400_000);
  const pa = await Policy.create({ workspaceId: alpha, ruleKey: 'no-guaranteed', version: 1, category: 'prohibited_phrase', text: 'No guarantees', severity: 'high', phrases: ['guaranteed safe'], effectiveFrom: past });
  const pb = await Policy.create({ workspaceId: beta, ruleKey: 'no-cheapest', version: 1, category: 'prohibited_phrase', text: 'No cheapest', severity: 'high', phrases: ['cheapest'], effectiveFrom: past });
  const fa = await ApprovedFact.create({ workspaceId: alpha, factKey: 'price', version: 1, statement: 'Price is 799', sourceRef: 'synthetic://p', effectiveFrom: past });

  return {
    ids: { user1, user2, user3, user4, alpha, beta },
    alphaAdmin: await resolveAccessContext(user1, alpha),
    betaCreator: await resolveAccessContext(user1, beta),
    alphaCreator: await resolveAccessContext(user2, alpha),
    alphaReviewer: await resolveAccessContext(user3, alpha),
    betaReviewer: await resolveAccessContext(user4, beta),
    policyAlpha: String(pa._id), factAlpha: String(fa._id), policyBeta: String(pb._id),
  };
}

/** Expect a promise to reject with an AppError of this code. */
export async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e: any) {
    if (e?.code !== code) throw new Error(`expected error code ${code} but got ${e?.code ?? e?.name}: ${e?.message}`);
    return;
  }
  throw new Error(`expected error code ${code} but the call succeeded`);
}
