import { describe, it, expect, vi } from 'vitest';
import { api } from '../lib/apiClient';

describe('Navigation, Performance & Client Caching Invariants', () => {
  it('deduplicates simultaneous identical API requests', async () => {
    let fetchCount = 0;
    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => [{ id: 'R1', title: 'Test Policy' }],
      };
    }) as any;

    try {
      api.clearCache();
      // Dispatch 3 concurrent requests to getActivePolicies
      const [res1, res2, res3] = await Promise.all([
        api.getActivePolicies(),
        api.getActivePolicies(),
        api.getActivePolicies(),
      ]);

      expect(res1).toEqual(res2);
      expect(res2).toEqual(res3);
      // Inflight deduplication ensures only 1 HTTP network call was made!
      expect(fetchCount).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('serves subsequent cached responses within TTL without re-fetching', async () => {
    let fetchCount = 0;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => [{ id: 'F1', claim: 'Approved Fact' }],
      };
    }) as any;

    try {
      api.clearCache();
      // First call fetches from network
      await api.getActiveFacts();
      expect(fetchCount).toBe(1);

      // Second immediate call uses memory cache
      const cached = await api.getActiveFacts();
      expect(cached).toEqual([{ id: 'F1', claim: 'Approved Fact' }]);
      expect(fetchCount).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('invalidates cache when mutation occurs', async () => {
    let fetchCount = 0;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      fetchCount++;
      if (init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ id: 'new_draft', status: 'draft' }),
        };
      }
      return {
        ok: true,
        json: async () => [{ id: 'draft_1', title: 'Draft' }],
      };
    }) as any;

    try {
      api.clearCache();
      await api.listContent();
      expect(fetchCount).toBe(1);

      // Mutation clears cache
      await api.createContent({ title: 'New Test Draft', text: 'Clean copy' });

      // Next listContent should re-fetch fresh data
      await api.listContent();
      expect(fetchCount).toBe(3);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
