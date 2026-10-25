import type { Model } from 'mongoose';
import { conflict, notFound } from '../errors';
import { appendAuditEvent } from '../audit/auditLog';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan, type Action } from '../security/permissions';
import type { AuditAction } from '../types';
import { assertObjectId } from '../validation/ids';
import { T } from './common';

interface Config {
  Model: Model<any>;
  keyField: 'ruleKey' | 'factKey';
  readAction: Action;
  manageAction: Action;
  targetType: 'policy' | 'fact';
  auditCreated: AuditAction;
  auditRetired: AuditAction;
  parse: (input: unknown) => Record<string, any>;
}

/** Shared logic for policies and approved facts: workspace-scoped, versioned, immutable content. */
export function createVersionedRepo(cfg: Config) {
  const { Model, keyField } = cfg;

  /** Current = active and inside the effective window. This is what analyses pin and what the AI may cite. */
  async function listActive(ctx: AccessContext) {
    assertCtx(ctx);
    assertCan(ctx.role, cfg.readAction);
    const now = new Date();
    return Model.find({
      workspaceId: ctx.workspaceId,
      status: 'active',
      effectiveFrom: T({ $lte: now }),
      $or: [{ effectiveTo: null }, { effectiveTo: T({ $gt: now }) }],
    })
      .sort({ [keyField]: 1 })
      .lean();
  }

  /** Admin only: every version including retired ones (history). */
  async function listAllVersions(ctx: AccessContext) {
    assertCtx(ctx);
    assertCan(ctx.role, cfg.manageAction);
    return Model.find({ workspaceId: ctx.workspaceId }).sort({ [keyField]: 1, version: -1 }).lean();
  }

  async function getById(ctx: AccessContext, id: string) {
    assertCtx(ctx);
    assertCan(ctx.role, cfg.readAction);
    assertObjectId(id);
    const doc = await Model.findOne({ _id: id, workspaceId: ctx.workspaceId }).lean();
    if (!doc) throw notFound(cfg.targetType);
    return doc;
  }

  /** Creates version n+1 of a key (or version 1) and retires the previously active version. Content is never edited in place. */
  async function createVersion(ctx: AccessContext, input: unknown) {
    assertCtx(ctx);
    assertCan(ctx.role, cfg.manageAction);
    const body = cfg.parse(input);
    const key: string = body[keyField];
    const latest = await Model.findOne({ workspaceId: ctx.workspaceId, [keyField]: key }).sort({ version: -1 }).lean();
    const previouslyActive = latest && (latest as any).status === 'active' ? latest : null;
    const now = new Date();

    if (previouslyActive) {
      await Model.updateOne(
        { _id: (previouslyActive as any)._id, workspaceId: ctx.workspaceId },
        { $set: { status: 'retired', effectiveTo: (previouslyActive as any).effectiveTo ?? now } },
      );
    }
    try {
      const created = await Model.create({
        ...body,
        workspaceId: ctx.workspaceId,
        version: ((latest as any)?.version ?? 0) + 1,
        status: 'active',
        effectiveFrom: body.effectiveFrom ?? now,
        effectiveTo: body.effectiveTo ?? null,
        createdBy: ctx.userId,
      });
      await appendAuditEvent({
        workspaceId: ctx.workspaceId,
        actorId: ctx.userId,
        action: cfg.auditCreated,
        targetType: cfg.targetType,
        targetId: String(created._id),
        meta: { key, version: created.version },
      });
      return created.toObject();
    } catch (err: any) {
      if (previouslyActive) {
        // restore the previous active version so the key is never left without one because of a failed insert
        await Model.updateOne(
          { _id: (previouslyActive as any)._id, workspaceId: ctx.workspaceId },
          { $set: { status: 'active', effectiveTo: (previouslyActive as any).effectiveTo ?? null } },
        );
      }
      if (err?.code === 11000) throw conflict('A concurrent change created this version first; retry');
      throw err;
    }
  }

  async function retire(ctx: AccessContext, id: string) {
    assertCtx(ctx);
    assertCan(ctx.role, cfg.manageAction);
    assertObjectId(id);
    const now = new Date();
    const doc = await Model.findOneAndUpdate(
      { _id: id, workspaceId: ctx.workspaceId, status: 'active' },
      { $set: { status: 'retired', effectiveTo: now } },
      { new: true },
    ).lean();
    if (!doc) throw notFound(cfg.targetType);
    await appendAuditEvent({
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      action: cfg.auditRetired,
      targetType: cfg.targetType,
      targetId: id,
      meta: { key: (doc as any)[keyField], version: (doc as any).version },
    });
    return doc;
  }

  return { listActive, listAllVersions, getById, createVersion, retire };
}
