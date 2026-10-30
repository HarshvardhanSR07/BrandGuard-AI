/**
 * BrandGuard AI - Frontend API Client
 * Connects apps/web to the Express + MongoDB backend on http://localhost:4000/api
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;
  private workspaceId: string | null = null;
  private cache = new Map<string, { data: any; expiry: number }>();
  private inflight = new Map<string, Promise<any>>();

  constructor() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      this.token = localStorage.getItem('bg_access_token');
      this.workspaceId = localStorage.getItem('bg_active_workspace');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    this.clearCache();
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      if (token) {
        localStorage.setItem('bg_access_token', token);
      } else {
        localStorage.removeItem('bg_access_token');
      }
    }
  }

  public setWorkspace(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.clearCache();
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem('bg_active_workspace', workspaceId);
    }
  }

  public clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, ttlMs = 0): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const cacheKey = `${method}:${endpoint}:${this.workspaceId || ''}`;

    // Return cached response if valid for GET requests
    if (method === 'GET' && ttlMs > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }
    }

    // Inflight deduplication for concurrent identical GET requests
    if (method === 'GET' && this.inflight.has(cacheKey)) {
      return this.inflight.get(cacheKey) as Promise<T>;
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (this.workspaceId) {
      headers.set('x-workspace-id', this.workspaceId);
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(err.message || `Request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Invalidate cache on mutations
        if (method !== 'GET') {
          if (endpoint.includes('/content') || endpoint.includes('/issues') || endpoint.includes('/review')) {
            this.clearCache('/content');
            this.clearCache('/review');
            this.clearCache('/analytics');
          }
        } else if (ttlMs > 0) {
          this.cache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
        }

        return data as T;
      } finally {
        this.inflight.delete(cacheKey);
      }
    })();

    if (method === 'GET') {
      this.inflight.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  // Health
  public async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`http://localhost:4000/health`);
    return res.json();
  }

  // Auth
  public async login(email: string, password: string) {
    const data = await this.request<{ token: string; expiresIn: number; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public async getMyWorkspaces() {
    return this.request<{ workspaces: any[] }>('/me/workspaces', {}, 60000);
  }

  // Policies & Facts (cached for 30s)
  public async getActivePolicies() {
    return this.request<any[]>('/policies/active', {}, 30000);
  }

  public async getActiveFacts() {
    return this.request<any[]>('/facts/active', {}, 30000);
  }

  // Drafts & Content (cached for 10s)
  public async listContent(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<any[]>(`/content${query}`, {}, 10000);
  }

  public async getContent(id: string) {
    return this.request<any>(`/content/${id}`, {}, 5000);
  }

  public async getRevisions(id: string) {
    return this.request<any[]>(`/content/${id}/revisions`, {}, 5000);
  }

  public async createContent(data: { title: string; channel?: string; text: string }) {
    return this.request<any>('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async submitContent(id: string) {
    return this.request<any>(`/content/${id}/submit`, {
      method: 'POST',
    });
  }

  public async reviseContent(id: string, text: string) {
    return this.request<any>(`/content/${id}/revise`, {
      method: 'POST',
      body: JSON.stringify({ text, source: 'manual' }),
    });
  }

  // End-to-End Compliance Analysis & Specialist Governance Review
  public async analyseContent(id: string, brand = 'VerdantCo') {
    return this.request<{
      analysis: any;
      review: any;
      path: string;
      action: string;
      appliedGates: string[];
    }>(`/content/${id}/analyse?brand=${encodeURIComponent(brand)}`, {
      method: 'POST',
    });
  }

  public async runGovernanceReview(brand_id: string, draft_text: string) {
    return this.request<{
      review: any;
      path: string;
      action: string;
      appliedGates: string[];
      structuralFailure: boolean;
    }>('/governance/review', {
      method: 'POST',
      body: JSON.stringify({ brand_id, draft_text }),
    });
  }

  // Review Queue & Segregation of Duties
  public async getReviewQueue() {
    return this.request<any[]>('/reviews/queue', {}, 10000);
  }

  // Findings & Reviews
  public async getFindings(contentId: string) {
    return this.request<any[]>(`/content/${contentId}/issues`, {}, 5000);
  }

  public async decideFinding(issueId: string, decision: { decision: 'accept' | 'dismiss'; rationale?: string }) {
    return this.request<any>(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(decision),
    });
  }

  public async decideContent(
    contentId: string,
    decision: { decision: 'approve' | 'request_changes' | 'reject'; rationale?: string }
  ) {
    return this.request<any>(`/content/${contentId}/decide`, {
      method: 'POST',
      body: JSON.stringify(decision),
    });
  }

  // Analytics & Audit
  public async getAnalyticsSummary() {
    return this.request<{
      draftsByStatus: Record<string, number>;
      findingsBySeverity: Record<string, number>;
      findingsByDisposition: Record<string, number>;
      findingsByEvidenceStatus: Record<string, number>;
      recurring: Array<{ category: string; ruleKey: string | null; findings: number; draftCount: number }>;
    }>('/analytics/summary', {}, 20000);
  }

  // LAX Guardian & Cognee Memory Engine
  public async getLaxMemory(userId?: string) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request<{
      status: string;
      memoryKey: string;
      engine?: string;
      personalizationActive?: boolean;
      userProfile?: {
        userId: string;
        name: string;
        role: string;
        preferredTone: string;
        interactionCount: number;
        rememberedContexts: string[];
      };
      stats?: {
        totalDatasets: number;
        totalNodes: number;
        totalEdges: number;
        userProfilesCount: number;
        apiKeyPrefix: string;
        engine: string;
      };
      retentionPolicies: string[];
      syncedAt: string;
    }>(`/lax/memory${q}`, {}, 10000);
  }

  public async chatWithLax(
    message: string,
    userContext?: { userId?: string; userName?: string; role?: string; workspaceId?: string }
  ) {
    return this.request<{
      reply: string;
      pose: 'approve' | 'protect' | 'alert' | 'analyze' | 'hero';
      memoryTimestamp: string;
      memoryReference: string;
      userProfile?: {
        userId: string;
        name: string;
        role: string;
        dataset: string;
      };
      cogneeStats?: {
        totalDatasets: number;
        totalNodes: number;
        totalEdges: number;
        recalledNodesCount: number;
        memoryMode: string;
      };
    }>('/lax/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        userId: userContext?.userId,
        userName: userContext?.userName,
        role: userContext?.role,
        workspaceId: userContext?.workspaceId,
      }),
    });
  }

  public async forgetLaxMemory(userId: string) {
    return this.request<{ success: boolean; message: string }>('/lax/memory/forget', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  public async getAuditEvents() {
    return this.request<any[]>('/audit', {}, 15000);
  }

  public async verifyAuditChain() {
    return this.request<{
      ok: boolean;
      count?: number;
      headSeq?: number;
      headHash?: string;
      brokenAtSeq?: number;
      reason?: string;
    }>('/audit/verify', {
      method: 'POST',
    });
  }

  // Session & Auth
  public async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me', {}, 0);
  }

  public async logout() {
    try {
      await this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
      this.clearCache();
    }
  }

  public async loginGoogle(idToken: string, options?: { linkAccount?: boolean; password?: string }) {
    const data = await this.request<{ token: string; expiresIn: string; user: any; isNewUser?: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, ...options }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  public async loginMicrosoft(idToken: string, options?: { linkAccount?: boolean; password?: string }) {
    const data = await this.request<{ token: string; expiresIn: string; user: any; isNewUser?: boolean }>('/auth/microsoft', {
      method: 'POST',
      body: JSON.stringify({ idToken, ...options }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  // Member Management & Invitations (Admin only)
  public async getMembers(workspaceId?: string) {
    const ep = workspaceId ? `/workspaces/${workspaceId}/members` : '/members';
    return this.request<{ members: any[]; invitations: any[] }>(ep, {}, 0);
  }

  public async inviteMember(data: { email: string; role: string }, workspaceId?: string) {
    const ep = workspaceId ? `/workspaces/${workspaceId}/members` : '/members';
    return this.request<any>(ep, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async changeMemberRole(userId: string, role: string, workspaceId?: string) {
    const ep = workspaceId ? `/workspaces/${workspaceId}/members/${userId}` : `/members/${userId}`;
    return this.request<any>(ep, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public async removeMember(userId: string, workspaceId?: string) {
    const ep = workspaceId ? `/workspaces/${workspaceId}/members/${userId}` : `/members/${userId}`;
    return this.request<any>(ep, {
      method: 'DELETE',
    });
  }

  public async revokeInvitation(invitationId: string, workspaceId?: string) {
    const ep = workspaceId ? `/workspaces/${workspaceId}/invitations/${invitationId}` : `/invitations/${invitationId}`;
    return this.request<any>(ep, {
      method: 'DELETE',
    });
  }

  // Policy & Fact Management (Admin only)
  public async createPolicy(policyData: any) {
    return this.request<any>('/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  }

  public async deletePolicy(key: string) {
    return this.request<any>(`/policies/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  public async createFact(factData: any) {
    return this.request<any>('/facts', {
      method: 'POST',
      body: JSON.stringify(factData),
    });
  }

  public async deleteFact(key: string) {
    return this.request<any>(`/facts/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
