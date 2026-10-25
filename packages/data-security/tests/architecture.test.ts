/**
 * Enforces the isolation boundary structurally:
 *  - Mongoose models may only be imported by repositories, services, audit, security/context, seed and models themselves.
 *  - The AuditEvent model and appendAuditEvent are used only inside src/audit and src/repositories (single writer).
 *  - Nothing in src/http or the public index imports a model.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}
const files = walk(SRC).map((p) => ({ rel: relative(SRC, p).replace(/\\/g, '/'), text: readFileSync(p, 'utf8') }));
const importsModels = (t: string) => /from\s+['"](?:\.{1,2}\/)+models(?:\/[A-Za-z]+)?['"]/.test(t);
const importsAuditModel = (t: string) => /\bAuditEvent\b/.test(t) && importsModels(t);
const callsAppend = (t: string) => /\bappendAuditEvent\b/.test(t);

describe('architecture boundaries', () => {
  it('only data-layer folders import Mongoose models', () => {
    const allowed = (rel: string) => /^(models|repositories|services|audit|seed)\//.test(rel) || rel === 'security/context.ts' || rel === 'db/connect.ts';
    const offenders = files.filter((f) => importsModels(f.text) && !allowed(f.rel)).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
  it('http layer and public index never import models or mongoose directly', () => {
    const offenders = files.filter((f) => (f.rel.startsWith('http/') || f.rel === 'index.ts') && (importsModels(f.text) || /from\s+['"]mongoose['"]/.test(f.text))).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
  it('the AuditEvent model is touched only by src/audit (single writer/reader)', () => {
    const offenders = files.filter((f) => importsAuditModel(f.text) && !f.rel.startsWith('audit/') && !f.rel.startsWith('models/') && !f.rel.startsWith('seed/')).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
  it('appendAuditEvent is called only from repositories, the audit module and the seed', () => {
    const offenders = files.filter((f) => callsAppend(f.text) && !/^(repositories|audit|seed)\//.test(f.rel)).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
  it('appendAuditEvent is not part of the public API', () => {
    const index = files.find((f) => f.rel === 'index.ts')!.text;
    expect(index).not.toMatch(/appendAuditEvent/);
  });
  it('no repository function is exported without taking an AccessContext first (spot check by source)', () => {
    const repoFiles = files.filter((f) => f.rel.startsWith('repositories/') && !/common|versionedRepo|evidence/.test(f.rel));
    for (const f of repoFiles) {
      const fns = [...f.text.matchAll(/export async function (\w+)\(([^)]*)\)/g)];
      for (const [, name, args] of fns) expect(args.trim().startsWith('ctx: AccessContext'), `${f.rel}:${name}`).toBe(true);
    }
  });
});
