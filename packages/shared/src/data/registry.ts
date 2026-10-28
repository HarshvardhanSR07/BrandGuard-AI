import serAndRulebooks from './SER_and_Rulebooks.json';

export interface RuleDefinition {
  rule_id: string;
  text: string;
  priority: number;
  category: string;
}

export interface EvidenceRecord {
  fact: string;
  status: 'Active' | 'Expired';
  effective_to: string | null;
}

export interface SERAndRulebooksData {
  rulebooks: Record<string, RuleDefinition[]>;
  evidence_registry: Record<string, Record<string, EvidenceRecord>>;
}

export const SER_AND_RULEBOOKS = serAndRulebooks as SERAndRulebooksData;

/**
 * Returns active rules for a specific brand.
 */
export function getBrandRules(brandId: string): RuleDefinition[] {
  return SER_AND_RULEBOOKS.rulebooks[brandId] || [];
}

/**
 * Returns the SER evidence records for a specific brand.
 */
export function getBrandSER(brandId: string): Record<string, EvidenceRecord> {
  return SER_AND_RULEBOOKS.evidence_registry[brandId] || {};
}

/**
 * Returns the set of valid SER record IDs for a specific brand (or across all brands).
 */
export function getBrandSERKeys(brandId?: string): Set<string> {
  const keys = new Set<string>();
  if (brandId && SER_AND_RULEBOOKS.evidence_registry[brandId]) {
    for (const key of Object.keys(SER_AND_RULEBOOKS.evidence_registry[brandId])) {
      keys.add(key);
    }
  } else {
    for (const b of Object.values(SER_AND_RULEBOOKS.evidence_registry)) {
      for (const key of Object.keys(b)) {
        keys.add(key);
      }
    }
  }
  return keys;
}

/**
 * Checks whether an evidence reference exists in the active registry.
 */
export function isValidEvidenceReference(evidenceRef: string, brandId?: string): boolean {
  return getBrandSERKeys(brandId).has(evidenceRef);
}
