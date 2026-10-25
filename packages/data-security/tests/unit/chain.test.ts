import { describe, expect, it } from 'vitest';
import { canonicalJson, computeEventHash, GENESIS_HASH, verifyEvents, type ChainedEvent, type HashableEvent } from '../../src/audit/chain';

function buildChain(n: number): ChainedEvent[] {
  const out: ChainedEvent[] = [];
  let prev = GENESIS_HASH;
  for (let seq = 1; seq <= n; seq++) {
    const e: HashableEvent = {
      workspaceId: 'w1', seq, actorId: 'u1', action: 'draft.created', targetType: 'draft', targetId: `d${seq}`,
      draftId: `d${seq}`, at: new Date(1_700_000_000_000 + seq * 1000).toISOString(), meta: { b: 2, a: { z: 1, y: [1, 2] } },
    };
    const hash = computeEventHash(e, prev);
    out.push({ ...e, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

describe('canonicalJson', () => {
  it('is independent of key order and drops undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: undefined } })).toBe(canonicalJson({ a: { d: 1 }, b: 1 }));
    expect(canonicalJson({ a: 1 })).toBe('{"a":1}');
  });
});

describe('audit hash chain', () => {
  it('verifies an intact chain', () => {
    const r = verifyEvents(buildChain(5));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.count).toBe(5); expect(r.headSeq).toBe(5); }
  });
  it('verifies an empty chain', () => {
    expect(verifyEvents([]).ok).toBe(true);
  });
  it('treats a missing meta and {} identically (storage may drop empty objects)', () => {
    const e: HashableEvent = { workspaceId: 'w', seq: 1, actorId: null, action: 'x', targetType: null, targetId: null, draftId: null, at: 'now', meta: {} };
    expect(computeEventHash(e, GENESIS_HASH)).toBe(computeEventHash({ ...e, meta: undefined }, GENESIS_HASH));
  });
  it('detects a modified event and names the first broken seq', () => {
    const c = buildChain(5);
    c[2] = { ...c[2], action: 'draft.approved' };
    const r = verifyEvents(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAtSeq).toBe(3);
  });
  it('detects a deleted event in the middle', () => {
    const c = buildChain(5);
    c.splice(1, 1);
    const r = verifyEvents(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAtSeq).toBe(2);
  });
  it('detects reordering and a rewritten prevHash', () => {
    const c = buildChain(4);
    expect(verifyEvents([c[0], c[2], c[1], c[3]]).ok).toBe(false);
    const d = buildChain(3);
    d[1] = { ...d[1], prevHash: 'f'.repeat(64) };
    expect(verifyEvents(d).ok).toBe(false);
  });
  it('documented limit: a truncated TAIL is not detected by the chain alone', () => {
    expect(verifyEvents(buildChain(5).slice(0, 3)).ok).toBe(true);
  });
});
