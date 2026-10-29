/**
 * Seeds the official SER (Synthetic Evidence Registry) and Brand Rulebooks
 * for VerdantCo, NorthstarFin, and BrightPath into MongoDB.
 */

import { connectDb, disconnectDb } from '../db/connect';
import { Workspace, Policy, ApprovedFact, User, Membership } from '../models';
import { appendAuditEvent } from '../audit/auditLog';
import { SER_AND_RULEBOOKS } from '@brandguard/shared';
import type { PolicyCategory, Severity } from '../types';

function mapCategory(cat: string): PolicyCategory {
  switch (cat.toLowerCase()) {
    case 'tone':
      return 'tone';
    case 'terminology':
      return 'terminology';
    case 'factual claim':
      return 'claim';
    default:
      return 'claim';
  }
}

function mapSeverity(priority: number): Severity {
  return priority === 1 ? 'critical' : 'medium';
}

export async function seedSERAndRulebooks() {
  console.log('[BrandGuard AI] Seeding official Rulebooks & Synthetic Evidence Registry...');
  await connectDb();

  const brandWorkspaces: Record<string, any> = {};

  // 1. Ensure Workspaces exist for all three brands
  for (const brand of ['VerdantCo', 'NorthstarFin', 'BrightPath']) {
    let ws = await Workspace.findOne({ name: brand });
    if (!ws) {
      ws = await Workspace.create({
        name: brand,
        brandName: brand,
        isSynthetic: true,
      });
      console.log(`[BrandGuard AI] Created workspace: ${brand} (${ws._id})`);
    } else {
      console.log(`[BrandGuard AI] Workspace ${brand} exists (${ws._id})`);
    }
    brandWorkspaces[brand] = ws;
  }

  // 2. Ensure default demo users have active membership in all brands
  const users = await User.find({}).limit(4);
  for (const [brand, ws] of Object.entries(brandWorkspaces)) {
    for (const u of users) {
      const existing = await Membership.findOne({ userId: u._id, workspaceId: ws._id });
      if (!existing) {
        await Membership.create({
          userId: u._id,
          workspaceId: ws._id,
          role: u.email.includes('user1') ? 'admin' : u.email.includes('user3') ? 'reviewer' : 'creator',
          status: 'active',
        });
      }
    }
  }

  const now = new Date();

  // 3. Seed Rulebooks (Policies)
  for (const [brand, rules] of Object.entries(SER_AND_RULEBOOKS.rulebooks)) {
    const ws = brandWorkspaces[brand];
    if (!ws) continue;

    for (const r of rules) {
      const existing = await Policy.findOne({ workspaceId: ws._id, ruleKey: r.rule_id, version: 1 });
      if (!existing) {
        await Policy.create({
          workspaceId: ws._id,
          ruleKey: r.rule_id,
          version: 1,
          category: mapCategory(r.category),
          severity: mapSeverity(r.priority),
          text: r.text,
          status: 'active',
          effectiveFrom: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // Active for 6 months
          phrases: [],
        });
        console.log(`  + Policy: ${brand} -> ${r.rule_id} (${r.category})`);
      }
    }

    await appendAuditEvent({
      workspaceId: ws._id,
      actorId: null,
      action: 'policy.created',
      targetType: 'seed',
      meta: { brand, rulesCount: rules.length },
    });
  }

  // 4. Seed Synthetic Evidence Registry (Approved Facts)
  for (const [brand, evidenceMap] of Object.entries(SER_AND_RULEBOOKS.evidence_registry)) {
    const ws = brandWorkspaces[brand];
    if (!ws) continue;

    for (const [evidKey, evidData] of Object.entries(evidenceMap)) {
      const existing = await ApprovedFact.findOne({ workspaceId: ws._id, factKey: evidKey, version: 1 });
      if (!existing) {
        const isExpired = evidData.status.toLowerCase() === 'expired';
        const effectiveTo = evidData.effective_to ? new Date(evidData.effective_to) : null;

        await ApprovedFact.create({
          workspaceId: ws._id,
          factKey: evidKey,
          version: 1,
          statement: evidData.fact,
          sourceRef: `ser://${brand}/${evidKey}`,
          status: isExpired ? 'retired' : 'active',
          effectiveFrom: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          effectiveTo: effectiveTo,
        });
        console.log(`  + Fact: ${brand} -> ${evidKey} [${evidData.status}]`);
      }
    }
  }

  console.log('[BrandGuard AI] Rulebooks & SER seed complete!');
}

if (require.main === module) {
  seedSERAndRulebooks()
    .then(async () => {
      await disconnectDb();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[BrandGuard AI] Seeding failed:', err);
      await disconnectDb().catch(() => undefined);
      process.exit(1);
    });
}
