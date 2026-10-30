/**
 * BrandGuard AI - Multi-User Demo Seed Script
 * Seeds the three authentic identities requested by BrandGuard AI:
 *   1. Creator:  creator@brandguard.demo  (Alex Morgan)
 *   2. Reviewer: reviewer@brandguard.demo (Marcus Vance)
 *   3. Admin:    admin@brandguard.demo    (Elena Rostova)
 * Common development password: BrandGuard2026!
 *
 * All accounts are assigned genuine memberships in the primary workspace ('Acme Cloud Platform')
 * and are accompanied by realistic draft submissions and review queues.
 */

import { connectDb, disconnectDb } from '../db/connect';
import { User, Workspace, Membership, Policy, ApprovedFact, Draft } from '../models';
import { hashPassword } from '../security/password';
import { resolveAccessContext } from '../security/context';
import * as drafts from '../repositories/draftRepo';

export const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'BrandGuard2026!';

export const DEMO_ACCOUNTS = [
  {
    email: 'creator@brandguard.demo',
    displayName: 'Alex Morgan',
    role: 'creator' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    title: 'Lead Content Creator',
  },
  {
    email: 'reviewer@brandguard.demo',
    displayName: 'Marcus Vance',
    role: 'reviewer' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    title: 'Senior Compliance Reviewer',
  },
  {
    email: 'admin@brandguard.demo',
    displayName: 'Elena Rostova',
    role: 'admin' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    title: 'Governance Director & Workspace Admin',
  },
];

export async function seedDemoUsers() {
  console.log('[BrandGuard AI] Seeding authentic Creator, Reviewer and Admin demo accounts...');
  await connectDb();

  // 1. Ensure primary workspace exists
  let workspace = await Workspace.findOne({ name: 'Acme Cloud Platform' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Acme Cloud Platform',
      brandName: 'Acme Global (Enterprise)',
      status: 'active',
      isSynthetic: false,
    });
    console.log(`[BrandGuard AI] Created workspace 'Acme Cloud Platform' (${workspace._id})`);
  }

  // 2. Ensure secondary workspace exists for workspace switching demo
  let secondaryWs = await Workspace.findOne({ name: 'Horizon FinTech' });
  if (!secondaryWs) {
    secondaryWs = await Workspace.create({
      name: 'Horizon FinTech',
      brandName: 'Horizon Financial Technologies',
      status: 'active',
      isSynthetic: true,
    });
  }

  const pwHash = await hashPassword(DEMO_PASSWORD);
  const createdUsers: Record<string, any> = {};

  // 3. Upsert demo accounts with verified roles
  for (const acc of DEMO_ACCOUNTS) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create({
        email: acc.email,
        passwordHash: pwHash,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        status: 'active',
        tokenVersion: 0,
        emailVerified: true,
        primaryProvider: 'local',
        providers: [{ provider: 'local', providerId: acc.email, email: acc.email, linkedAt: new Date() }],
        lastLoginAt: new Date(),
      });
      console.log(`[BrandGuard AI] Created user ${acc.email} (${user._id})`);
    } else {
      user.passwordHash = pwHash;
      user.displayName = acc.displayName;
      user.avatarUrl = acc.avatarUrl;
      user.status = 'active';
      await user.save();
      console.log(`[BrandGuard AI] Updated password/profile for ${acc.email} (${user._id})`);
    }
    createdUsers[acc.role] = user;

    // Primary workspace membership
    await Membership.findOneAndUpdate(
      { userId: user._id, workspaceId: workspace._id },
      { $set: { role: acc.role, status: 'active' } },
      { upsert: true, new: true }
    );

    // Also add to secondary workspace with creator/reviewer role
    await Membership.findOneAndUpdate(
      { userId: user._id, workspaceId: secondaryWs._id },
      { $set: { role: acc.role === 'admin' ? 'admin' : 'creator', status: 'active' } },
      { upsert: true, new: true }
    );
  }

  // 4. Seed active policies and approved facts if not present
  const policyCount = await Policy.countDocuments({ workspaceId: workspace._id });
  if (policyCount === 0) {
    await Policy.insertMany([
      {
        workspaceId: workspace._id,
        ruleKey: 'no-infallible-claims',
        category: 'prohibited_phrase',
        severity: 'critical',
        text: 'Never claim our cloud infrastructure is "100% infallible" or "guaranteed unhackable".',
        phrases: ['100% infallible', 'guaranteed unhackable', 'zero vulnerability'],
        suggestedReplacement: 'enterprise-grade resiliency with 99.99% availability SLAs',
        status: 'active',
        version: 1,
      },
      {
        workspaceId: workspace._id,
        ruleKey: 'terminology-ai-copilot',
        category: 'terminology',
        severity: 'medium',
        text: 'Use "Autonomous Brand Guard" or "AI Governance Engine", never "Magic Bot" or "Auto-Bot".',
        phrases: ['magic bot', 'auto-bot'],
        suggestedReplacement: 'Autonomous Brand Guard',
        status: 'active',
        version: 1,
      },
      {
        workspaceId: workspace._id,
        ruleKey: 'disclaimer-enterprise-sla',
        category: 'disclaimer',
        severity: 'high',
        text: 'All pricing and uptime claims must include the disclaimer: "Terms and Enterprise SLA apply."',
        phrases: ['terms and enterprise sla apply'],
        status: 'active',
        version: 1,
      },
    ]);
    console.log('[BrandGuard AI] Seeded core brand policies for Acme Cloud Platform');
  }

  const factCount = await ApprovedFact.countDocuments({ workspaceId: workspace._id });
  if (factCount === 0) {
    await ApprovedFact.insertMany([
      {
        workspaceId: workspace._id,
        factKey: 'fact-sla-uptime',
        statement: 'Acme Cloud Platform provides a 99.99% uptime SLA for multi-region clusters.',
        sourceRef: 'https://internal.acme.cloud/sla/2026',
        version: 1,
        status: 'active',
      },
      {
        workspaceId: workspace._id,
        factKey: 'fact-compliance-cert',
        statement: 'Acme Cloud Platform is certified SOC 2 Type II, ISO 27001, and HIPAA compliant.',
        sourceRef: 'https://internal.acme.cloud/compliance/certifications',
        version: 1,
        status: 'active',
      },
    ]);
    console.log('[BrandGuard AI] Seeded approved facts for Acme Cloud Platform');
  }

  // 5. Seed realistic draft content and review queue items
  const draftCount = await Draft.countDocuments({ workspaceId: workspace._id });
  if (draftCount === 0 && createdUsers.creator) {
    const creatorUser = createdUsers.creator;
    const creatorCtx = await resolveAccessContext(String(creatorUser._id), String(workspace._id));

    // Draft 1: Under Review (Submitted & Waiting for Reviewer)
    const draft1 = await drafts.createDraft(creatorCtx, {
      title: 'Q3 Enterprise Cloud Launch Post',
      channel: 'social',
      text: 'Deploying our new enterprise clusters! Our 100% infallible architecture ensures zero downtime for all workloads. Terms and Enterprise SLA apply.',
    });
    await drafts.submitDraft(creatorCtx, String(draft1._id));

    // Draft 2: Draft mode (Creator actively drafting)
    await drafts.createDraft(creatorCtx, {
      title: 'Product Documentation — Automated Security Safeguards',
      channel: 'web',
      text: 'Our Autonomous Brand Guard continuously monitors API endpoints. Verified 99.99% uptime SLA is guaranteed.',
    });

    // Draft 3: Partner post
    const draft3 = await drafts.createDraft(creatorCtx, {
      title: 'Partner Ecosystem Announcement v1.2',
      channel: 'email',
      text: 'Acme Cloud Platform delivers enterprise-grade resiliency with 99.99% availability SLAs. Certified SOC 2 Type II and ISO 27001 compliant.',
    });
    await drafts.submitDraft(creatorCtx, String(draft3._id));

    console.log('[BrandGuard AI] Seeded sample drafts and revisions for Acme Cloud Platform');
  }

  console.log('[BrandGuard AI] Seed complete! Demo accounts ready:');
  console.log('   Creator:  creator@brandguard.demo  / BrandGuard2026!');
  console.log('   Reviewer: reviewer@brandguard.demo / BrandGuard2026!');
  console.log('   Admin:    admin@brandguard.demo    / BrandGuard2026!');
}

// Allow standalone execution: npx tsx packages/data-security/src/seed/seedDemoUsers.ts
if (require.main === module || process.argv[1]?.includes('seedDemoUsers')) {
  seedDemoUsers()
    .then(async () => {
      await disconnectDb();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('Seed error:', e);
      await disconnectDb();
      process.exit(1);
    });
}
