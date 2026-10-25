import { appendAuditEvent } from '../audit/auditLog';
import { getEnv } from '../config/env';
import { forbidden, notFound, validation } from '../errors';
import { Upload, type UploadRec } from '../models';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan, canAuthorAct, canReadDraft } from '../security/permissions';
import { isEditable } from '../security/stateMachine';
import { assertObjectId } from '../validation/ids';
import { uploadBody } from '../validation/schemas';
import { asRec, asRecs } from './common';
import { loadVisibleDraft } from './draftRepo';

/** Strip path parts and control characters; keep a short, safe display name. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '').replace(/^\.+/, '').trim().slice(0, 120);
  return cleaned || 'upload';
}

/**
 * Stores upload METADATA + extracted text only (no file bytes). Extraction/OCR runs elsewhere and passes the result
 * here. The text is flagged untrusted and capped; the type allowlist and size limit are enforced.
 */
export async function createUpload(ctx: AccessContext, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'upload:create');
  const env = getEnv();
  const body = uploadBody.parse(input);
  if (body.size > env.MAX_UPLOAD_BYTES) throw validation(`File is larger than the ${env.MAX_UPLOAD_BYTES} byte limit`);

  let extractedText = body.extractedText;
  const errors = [...body.errors];
  let extractionStatus = body.extractionStatus;
  if (Buffer.byteLength(extractedText, 'utf8') > env.MAX_EXTRACTED_TEXT_BYTES) {
    extractedText = Buffer.from(extractedText, 'utf8').subarray(0, env.MAX_EXTRACTED_TEXT_BYTES).toString('utf8');
    errors.push('Extracted text was truncated to the storage limit');
    if (extractionStatus === 'complete') extractionStatus = 'incomplete'; // truncated extraction is never "complete"
  }

  if (body.draftId) {
    const draft = await loadVisibleDraft(ctx, body.draftId);
    if (!canAuthorAct(ctx.role, ctx.userId, draft, 'upload:create')) throw forbidden('You can only attach uploads to your own drafts');
    if (!isEditable(draft.status)) throw forbidden('Uploads can only be attached while the draft is editable');
  }

  const upload = await Upload.create({
    workspaceId: ctx.workspaceId, uploaderId: ctx.userId, draftId: body.draftId ?? null,
    originalName: sanitizeFilename(body.originalName), mime: body.mime, size: body.size, sha256: body.sha256.toLowerCase(),
    extractionStatus, ocrStatus: body.ocrStatus, extractedText, errors, untrusted: true,
  });
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'upload.created',
    targetType: 'upload', targetId: String(upload._id), draftId: body.draftId,
    meta: { mime: body.mime, size: body.size, extractionStatus, ocrStatus: body.ocrStatus },
  });
  return upload.toObject();
}

/**
 * Visible to its uploader and to Admin. Everyone else only if the upload is attached to a draft they may see
 * (i.e. a submitted draft). Anything else is 404.
 */
export async function getUpload(ctx: AccessContext, uploadId: string) {
  assertCtx(ctx);
  assertObjectId(uploadId, 'uploadId');
  const upload = asRec<UploadRec>(await Upload.findOne({ _id: uploadId, workspaceId: ctx.workspaceId }).lean());
  if (!upload) throw notFound('Upload');
  if (ctx.role === 'admin' || String(upload.uploaderId) === ctx.userId) return upload;
  if (upload.draftId) {
    try {
      const draft = await loadVisibleDraft(ctx, String(upload.draftId));
      if (canReadDraft(ctx.role, ctx.userId, draft)) return upload;
    } catch { /* fall through to 404 */ }
  }
  throw notFound('Upload');
}

export async function listMyUploads(ctx: AccessContext) {
  assertCtx(ctx);
  assertCan(ctx.role, 'upload:create');
  return asRecs<UploadRec>(await Upload.find({ workspaceId: ctx.workspaceId, uploaderId: ctx.userId }).sort({ createdAt: -1 }).limit(100).lean());
}
