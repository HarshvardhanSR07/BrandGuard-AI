import { validation } from '../errors';

/** Strict 24-hex check. (mongoose's isValid() also accepts any 12-char string, which we do not want.) */
export const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function assertObjectId(value: unknown, name = 'id'): string {
  if (typeof value !== 'string' || !OBJECT_ID_RE.test(value)) throw validation(`${name} is not a valid id`);
  return value;
}

/** Compare ids that may be ObjectId | string. */
export const sameId = (a: unknown, b: unknown): boolean => String(a) === String(b);
