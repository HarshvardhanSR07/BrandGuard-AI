import crypto from 'crypto';

describe('Audit Hash Chain & Cryptographic Verification', () => {
  const GENESIS_HASH = '0'.repeat(64);

  function computeHash(payload: Record<string, unknown>, prevHash: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(prevHash + ':' + serialized).digest('hex');
  }

  it('builds a continuous tamper-evident hash chain from genesis', () => {
    const event1 = { seq: 1, action: 'draft.created', draftId: 'DRF-001' };
    const hash1 = computeHash(event1, GENESIS_HASH);

    const event2 = { seq: 2, action: 'draft.revised', draftId: 'DRF-001' };
    const hash2 = computeHash(event2, hash1);

    expect(hash1).toHaveLength(64);
    expect(hash2).toHaveLength(64);
    expect(hash1).not.toBe(hash2);
  });

  it('detects tampering when an intermediate payload or hash is modified', () => {
    const event1 = { seq: 1, action: 'draft.created', draftId: 'DRF-001' };
    const hash1 = computeHash(event1, GENESIS_HASH);

    const event2 = { seq: 2, action: 'draft.revised', draftId: 'DRF-001' };
    const hash2 = computeHash(event2, hash1);

    // Attacker alters event 1
    const tamperedEvent1 = { seq: 1, action: 'draft.approved', draftId: 'DRF-001' };
    const recomputedHash1 = computeHash(tamperedEvent1, GENESIS_HASH);

    expect(recomputedHash1).not.toBe(hash1);
    // Chain broken at seq 2 because prevHash won't match
    const verifyHash2 = computeHash(event2, recomputedHash1);
    expect(verifyHash2).not.toBe(hash2);
  });
});
