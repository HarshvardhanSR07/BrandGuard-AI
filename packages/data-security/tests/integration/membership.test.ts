import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Membership, User } from '../../src/models';
import * as members from '../../src/repositories/membershipRepo';
import { policyRepo } from '../../src/repositories/policyRepo';
import { factRepo } from '../../src/repositories/factRepo';
import { resolveAccessContext } from '../../src/security/context';
import { hashPassword } from '../../src/security/password';
import { buildFixture, clearDb, expectCode, startDb, stopDb, type Fixture } from '../helpers';

let f: Fixture;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => { await clearDb(); f = await buildFixture(); });

describe('membership management', () => {
  it('only admins manage membership', async () => {
    await expectCode(members.listMembers(f.alphaCreator), 'FORBIDDEN');
    await expectCode(members.addMember(f.alphaReviewer, { email: 'user4@brandguard.test', role: 'creator' }), 'FORBIDDEN');
    await expectCode(members.removeMember(f.alphaCreator, f.ids.user3), 'FORBIDDEN');
  });

  it('admin assigns an EXISTING seeded user, and never creates accounts', async () => {
    const added = await members.addMember(f.alphaAdmin, { email: 'user4@brandguard.test', role: 'creator' });
    expect(added.role).toBe('creator');
    const ctx = await resolveAccessContext(f.ids.user4, f.ids.alpha);
    expect(ctx.role).toBe('creator');
    await expectCode(members.addMember(f.alphaAdmin, { email: 'stranger@example.com', role: 'creator' }), 'NOT_FOUND');
    expect(await User.countDocuments({ email: 'stranger@example.com' })).toBe(0);
    await expectCode(members.addMember(f.alphaAdmin, { email: 'user4@brandguard.test', role: 'admin' }), 'CONFLICT'); // already a member
  });

  it('the last active admin cannot be removed or demoted', async () => {
    await expectCode(members.removeMember(f.alphaAdmin, f.ids.user1), 'CONFLICT');
    await expectCode(members.changeRole(f.alphaAdmin, f.ids.user1, { role: 'creator' }), 'CONFLICT');
    expect((await Membership.findOne({ userId: f.ids.user1, workspaceId: f.ids.alpha }).lean())!.role).toBe('admin');
  });

  it('with two admins, one may be removed; the survivor is then protected', async () => {
    await members.changeRole(f.alphaAdmin, f.ids.user3, { role: 'admin' });
    await members.removeMember(f.alphaAdmin, f.ids.user3);
    await expectCode(members.removeMember(f.alphaAdmin, f.ids.user1), 'CONFLICT');
  });

  it('a removed member immediately loses access (role is re-read every request)', async () => {
    await members.removeMember(f.alphaAdmin, f.ids.user2);
    await expectCode(resolveAccessContext(f.ids.user2, f.ids.alpha), 'FORBIDDEN');
  });

  it('role changes take effect on the next context (token never carries the role)', async () => {
    await members.changeRole(f.alphaAdmin, f.ids.user2, { role: 'reviewer' });
    expect((await resolveAccessContext(f.ids.user2, f.ids.alpha)).role).toBe('reviewer');
  });

  it('admin actions apply only to the admin\'s own workspace', async () => {
    // user1 is admin in Alpha only; acting on Beta membership through the Alpha context finds nothing
    await expectCode(members.removeMember(f.alphaAdmin, f.ids.user4), 'NOT_FOUND');
    expect((await Membership.findOne({ userId: f.ids.user4, workspaceId: f.ids.beta }).lean())!.status).toBe('active');
  });
});

describe('policy and fact versioning', () => {
  const rule = { ruleKey: 'no-guaranteed', category: 'prohibited_phrase', text: 'v2 text', severity: 'critical', phrases: ['guaranteed'] };
  it('only admins manage; everyone reads', async () => {
    await expectCode(policyRepo.createVersion(f.alphaCreator, rule), 'FORBIDDEN');
    await expectCode(factRepo.createVersion(f.alphaReviewer, { factKey: 'p', statement: 's', sourceRef: 'r' }), 'FORBIDDEN');
    expect(await policyRepo.listActive(f.alphaCreator)).toHaveLength(1);
  });
  it('creating a new version retires the old one and keeps exactly one active', async () => {
    const v2 = await policyRepo.createVersion(f.alphaAdmin, rule);
    expect(v2.version).toBe(2);
    const active = await policyRepo.listActive(f.alphaReviewer);
    expect(active).toHaveLength(1);
    expect(active[0].version).toBe(2);
    expect(await policyRepo.listAllVersions(f.alphaAdmin)).toHaveLength(2);
  });
  it('workspaces never see each other\'s policies or facts', async () => {
    const beta = await policyRepo.listActive(f.betaCreator);
    expect(beta.map((p: any) => p.ruleKey)).toEqual(['no-cheapest']);
    await expectCode(policyRepo.getById(f.betaCreator, f.policyAlpha), 'NOT_FOUND');
    expect(await factRepo.listActive(f.betaReviewer)).toHaveLength(0);
  });
  it('a policy retired by an admin disappears from the active list', async () => {
    await policyRepo.retire(f.alphaAdmin, f.policyAlpha);
    expect(await policyRepo.listActive(f.alphaCreator)).toHaveLength(0);
    await expectCode(policyRepo.retire(f.alphaAdmin, f.policyBeta), 'NOT_FOUND'); // other workspace's id
  });
});

describe('passwords', () => {
  it('stores a bcrypt hash and never returns it by default', async () => {
    const u = await User.findOne({ email: 'user1@brandguard.test' }).lean();
    expect((u as any).passwordHash).toBeUndefined();
    const withHash = await User.findOne({ email: 'user1@brandguard.test' }).select('+passwordHash').lean();
    expect(withHash!.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await hashPassword('x')).not.toBe(await hashPassword('x')); // salted
  });
});
