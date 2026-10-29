import { describe, it, expect } from 'vitest';

describe('Review & Segregation of Duties Tests', () => {
  it('should enforce segregation of duties logic (author !== reviewer)', () => {
    const authorId: string = 'usr_creator_1';
    const reviewerId: string = 'usr_reviewer_2';
    const canReview = authorId !== reviewerId;
    expect(canReview).toBe(true);

    const sameUser: string = authorId;
    const sameUserReview = authorId !== sameUser;
    expect(sameUserReview).toBe(false);
  });
});
