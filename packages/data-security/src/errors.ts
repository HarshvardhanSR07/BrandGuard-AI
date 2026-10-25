export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT'
  | 'INVALID_TRANSITION' | 'SELF_REVIEW_FORBIDDEN' | 'EVIDENCE_INVALID' | 'RATE_LIMITED' | 'INTERNAL';

/** The only error type routes should expect from this package (plus ZodError, handled by errorHandler). */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthenticated = (msg = 'Authentication required') => new AppError('UNAUTHENTICATED', msg, 401);
export const forbidden = (msg = 'You do not have permission to do this') => new AppError('FORBIDDEN', msg, 403);
/** Deliberately generic: the same response for "does not exist" and "exists in another workspace". */
export const notFound = (what = 'Resource') => new AppError('NOT_FOUND', `${what} not found`, 404);
export const validation = (msg: string, details?: unknown) => new AppError('VALIDATION', msg, 400, details);
export const conflict = (msg: string) => new AppError('CONFLICT', msg, 409);
export const invalidTransition = (from: string, to: string) =>
  new AppError('INVALID_TRANSITION', `Cannot move from "${from}" to "${to}"`, 409);
export const selfReview = () =>
  new AppError('SELF_REVIEW_FORBIDDEN', 'You cannot review your own draft', 403);
export const evidenceInvalid = (msg: string) => new AppError('EVIDENCE_INVALID', msg, 422);
