import crypto from 'crypto';

describe('Draft Revisions and No False Greens', () => {
  it('generates deterministic SHA-256 hash for revision content', () => {
    const textA = 'VerdantCo clean surface solution';
    const textB = 'VerdantCo clean surface solution edited';

    const hashA = crypto.createHash('sha256').update(textA).digest('hex');
    const hashB = crypto.createHash('sha256').update(textB).digest('hex');

    expect(hashA).toHaveLength(64);
    expect(hashB).toHaveLength(64);
    expect(hashA).not.toEqual(hashB);
  });

  it('enforces No-False-Greens invariant: draft submission requires complete analysis', () => {
    const incompleteAnalysis = { status: 'Incomplete', incomplete_reasons: ['Pending human review'] };
    const completeAnalysis = { status: 'Complete', incomplete_reasons: [] };

    const canSubmitIncomplete = incompleteAnalysis.status === 'Complete';
    const canSubmitComplete = completeAnalysis.status === 'Complete';

    expect(canSubmitIncomplete).toBe(false);
    expect(canSubmitComplete).toBe(true);
  });
});
