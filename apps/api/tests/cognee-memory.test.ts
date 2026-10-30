import { CogneeMemoryService } from '../src/ai/cogneeMemoryService';

describe('Cognee Memory Layer & Per-User Personalization for LAX', () => {
  let cognee: CogneeMemoryService;

  beforeEach(() => {
    cognee = new CogneeMemoryService();
  });

  test('initializes default global brand knowledge and user profiles', () => {
    const stats = cognee.getMemoryStats();
    expect(stats.totalNodes).toBeGreaterThanOrEqual(7);
    expect(stats.personalizationActive).toBe(true);
    expect(stats.apiKeyPrefix).toContain('3dda...');
  });

  test('remembers and cognifies new memory nodes with relationships', () => {
    const initialStats = cognee.getMemoryStats();
    cognee.remember('Autumn campaign introduces certified organic cotton blend.', 'global_brand_knowledge', {
      name: 'Organic Cotton Claim',
      type: 'fact',
    });
    const { totalNodes, totalEdges } = cognee.cognify();
    expect(totalNodes).toBe(initialStats.totalNodes + 1);
    expect(totalEdges).toBeGreaterThanOrEqual(0);
  });

  test('recalls policy nodes and applies user personalization', () => {
    const result = cognee.recall('durability guarantee', {
      userId: 'usr_sarah_creator',
      role: 'creator',
    });

    expect(result.nodes.length).toBeGreaterThan(0);
    const hasProhibited = result.nodes.some((n) => n.name.includes('Prohibited') || n.content.includes('guarantee'));
    expect(hasProhibited).toBe(true);
    expect(result.personalizationSummary).toContain('Sarah Chen');
  });

  test('answers creator questions with creative rewrite alternatives', async () => {
    const response = await cognee.askLax('Is "lifetime durability guaranteed" on-brand?', {
      userId: 'usr_sarah_creator',
      name: 'Sarah Chen',
      role: 'creator',
    });

    expect(response.reply).toContain('Sarah');
    expect(response.reply.toLowerCase()).toContain('alternative');
    expect(response.pose).toBe('alert');
    expect(response.userProfile.role).toBe('creator');
  });

  test('answers reviewer questions with regulatory policy references', async () => {
    const response = await cognee.askLax('What are the rules for health claims?', {
      userId: 'usr_marcus_reviewer',
      name: 'Marcus Vance',
      role: 'reviewer',
    });

    expect(response.reply).toContain('FDA');
    expect(response.reply).toContain('HLTH-001');
    expect(response.pose).toBe('protect');
    expect(response.userProfile.role).toBe('reviewer');
  });

  test('personalizes memory across different users independently', async () => {
    // Creator turn
    await cognee.askLax('I love drafting Instagram captions for Summer Edit.', {
      userId: 'usr_sarah_creator',
      name: 'Sarah Chen',
      role: 'creator',
    });

    const sarahProfile = cognee.getUserProfile('usr_sarah_creator');
    expect(sarahProfile.rememberedContexts.length).toBeGreaterThan(0);

    // Reviewer profile remains distinct
    const marcusProfile = cognee.getUserProfile('usr_marcus_reviewer');
    expect(marcusProfile.name).toBe('Marcus Vance');
    expect(marcusProfile.role).toBe('reviewer');
  });

  test('answers general conversation and identity questions grounded in user context', async () => {
    const response = await cognee.askLax('Who am I?', {
      userId: 'usr_elena_admin',
      name: 'Elena Rostova',
      role: 'admin',
    });

    expect(response.reply).toContain('Elena Rostova');
    expect(response.reply).toContain('ADMIN');
    expect(response.pose).toBe('hero');
  });
});
