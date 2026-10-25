import bcrypt from 'bcryptjs';
import { getEnv } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getEnv().BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummy: Promise<string> | undefined;
/** A real bcrypt hash compared against when the email is unknown, so unknown-email and wrong-password take the same time. */
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword('not-a-real-password-' + Math.random());
  return dummy;
}
