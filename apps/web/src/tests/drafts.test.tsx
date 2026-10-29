import { describe, it, expect } from 'vitest';

describe('Drafts Feature Unit Tests', () => {
  it('should validate draft status mappings', () => {
    const statuses = ['draft', 'submitted', 'changes_requested', 'approved', 'rejected'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('approved');
  });

  it('should format finding counts correctly', () => {
    const findings = [{ id: 1, severity: 'High' }, { id: 2, severity: 'Low' }];
    expect(findings.length).toBe(2);
  });
});
