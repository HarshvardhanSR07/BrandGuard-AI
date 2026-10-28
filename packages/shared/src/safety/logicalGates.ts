import { BrandGuardAIReviewSchema } from '../schemas/analysis.schema';
import type {
  BrandGuardAIReview,
  BrandGuardFinding,
} from '../types/analysis.types';

export type AgentRoutingPath = 'PATH_A' | 'PATH_B' | 'PATH_C';

export interface GateEvaluationResult {
  review: BrandGuardAIReview;
  path: AgentRoutingPath;
  action: string;
  appliedGates: string[];
  structuralFailure: boolean;
}

export interface PromptContext {
  brand_id: string;
  rules: unknown;
  ser: unknown;
  draft_text: string;
}

/**
 * Step B: Prompt Construction
 * Formats system, user, and assistant prompts adhering strictly to ChatML.
 */
export function buildChatMLPrompt(ctx: PromptContext): {
  systemMessage: string;
  userMessage: string;
  fullChatMLPrompt: string;
} {
  const systemMessage =
    'You are a Brand Governance AI. Review the draft against Rules and SER. Return ONLY valid JSON matching BrandGuardReview_v1.1 schema.';
  const userMessage = `Brand: ${ctx.brand_id} Rules: ${JSON.stringify(ctx.rules)} SER: ${JSON.stringify(ctx.ser)} Draft: ${ctx.draft_text}`;

  const fullChatMLPrompt = `<|im_start|>system\n${systemMessage}<|im_end|>\n<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;

  return { systemMessage, userMessage, fullChatMLPrompt };
}

/**
 * Gate 1: Structural Validation & Gate 2: Deterministic Logical Gates (L-01 to L-06)
 *
 * Rules:
 *  - Gate 1: Validate against JSON_Schema_v1.1. If invalid: status="Incomplete", human_review_required=true, incomplete_reasons=["Structural failure: ..."]
 *  - L-01: If status == "Incomplete" -> Set human_review_required = true
 *  - L-03: If any claim_status is Unverified, Stale, or Conflicting -> Set status = "Incomplete" AND human_review_required = true
 *  - L-04: If severity is High or Critical AND corrected_text == null -> Set human_review_required = true
 *  - L-05: If evidence_reference does not exist in live SER database -> Set claim_status = "Unverified" -> Triggers L-03
 *  - L-06: If finding_id values are not unique within the report -> Set status = "Incomplete"
 */
export function evaluateLogicalGates(
  rawOutput: unknown,
  serValidKeys: Set<string> | string[],
  fallbackMeta?: {
    brand_id?: string;
    model_version?: string;
    rulebook_version?: string;
  }
): GateEvaluationResult {
  const serSet = serValidKeys instanceof Set ? serValidKeys : new Set(serValidKeys);
  const appliedGates: string[] = [];

  // Parse if raw string
  let parsedJson: any = rawOutput;
  if (typeof rawOutput === 'string') {
    try {
      parsedJson = JSON.parse(rawOutput.trim());
    } catch (e: any) {
      const review: BrandGuardAIReview = {
        review_id: crypto.randomUUID(),
        brand_id: fallbackMeta?.brand_id || 'Unknown',
        status: 'Incomplete',
        human_review_required: true,
        incomplete_reasons: ['Structural failure: Invalid JSON format'],
        findings: [],
        model_version: fallbackMeta?.model_version || 'brandguard-ai-model-qwen3-4b',
        rulebook_version: fallbackMeta?.rulebook_version || 'v1.1',
        timestamp: new Date().toISOString(),
      };
      return {
        review,
        path: 'PATH_C',
        action: 'Structural failure: Invalid JSON. Retry once; if failure persists, route to Human Moderator with error "AI System Failure."',
        appliedGates: ['Gate 1: Structural Validation'],
        structuralFailure: true,
      };
    }
  }

  // Gate 1: Schema Validation
  const validation = BrandGuardAIReviewSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');

    const review: BrandGuardAIReview = {
      review_id: parsedJson?.review_id && typeof parsedJson.review_id === 'string' && parsedJson.review_id.length === 36 ? parsedJson.review_id : crypto.randomUUID(),
      brand_id: parsedJson?.brand_id || fallbackMeta?.brand_id || 'Unknown',
      status: 'Incomplete',
      human_review_required: true,
      incomplete_reasons: [`Structural failure: Invalid JSON format (${errorDetails})`],
      findings: [],
      model_version: parsedJson?.model_version || fallbackMeta?.model_version || 'brandguard-ai-model-qwen3-4b',
      rulebook_version: parsedJson?.rulebook_version || fallbackMeta?.rulebook_version || 'v1.1',
      timestamp: new Date().toISOString(),
    };

    return {
      review,
      path: 'PATH_C',
      action: 'Structural failure: Invalid schema contract. Retry once; if failure persists, route to Human Moderator with error "AI System Failure."',
      appliedGates: ['Gate 1: Structural Validation'],
      structuralFailure: true,
    };
  }

  // Deep clone to apply overrides deterministically
  const review: BrandGuardAIReview = JSON.parse(JSON.stringify(validation.data));
  const incompleteReasons = new Set<string>(review.incomplete_reasons || []);

  // L-06: Check finding_id uniqueness within the report
  const seenFindingIds = new Set<number>();
  for (const f of review.findings) {
    if (seenFindingIds.has(f.finding_id)) {
      if (!appliedGates.includes('L-06')) appliedGates.push('L-06');
      review.status = 'Incomplete';
      incompleteReasons.add(`L-06: Duplicate finding_id ${f.finding_id} detected in report`);
    } else {
      seenFindingIds.add(f.finding_id);
    }
  }

  // L-05: If evidence_reference does not exist in live SER database -> claim_status = "Unverified"
  for (const f of review.findings) {
    for (const ref of f.evidence_references) {
      if (!serSet.has(ref)) {
        if (!appliedGates.includes('L-05')) appliedGates.push('L-05');
        f.claim_status = 'Unverified';
        incompleteReasons.add(`L-05: Evidence reference "${ref}" not found in active SER database`);
        break;
      }
    }
  }

  // L-03: If any claim_status is Unverified, Stale, or Conflicting -> status = "Incomplete" AND human_review_required = true
  const invalidClaims = review.findings.filter((f: BrandGuardFinding) =>
    ['Unverified', 'Stale', 'Conflicting'].includes(f.claim_status)
  );
  if (invalidClaims.length > 0) {
    if (!appliedGates.includes('L-03')) appliedGates.push('L-03');
    review.status = 'Incomplete';
    review.human_review_required = true;
    for (const f of invalidClaims) {
      incompleteReasons.add(`L-03: Finding #${f.finding_id} has ${f.claim_status} claim status`);
    }
  }

  // L-04: If severity is High or Critical AND corrected_text == null -> human_review_required = true
  const criticalWithoutFix = review.findings.filter(
    (f: BrandGuardFinding) =>
      ['High', 'Critical'].includes(f.severity) &&
      (f.corrected_text === null || f.corrected_text === undefined || f.corrected_text === '')
  );
  if (criticalWithoutFix.length > 0) {
    if (!appliedGates.includes('L-04')) appliedGates.push('L-04');
    review.human_review_required = true;
  }

  // L-01: If status == "Incomplete" -> human_review_required = true
  if (review.status === 'Incomplete') {
    if (!appliedGates.includes('L-01')) appliedGates.push('L-01');
    review.human_review_required = true;
  }

  review.incomplete_reasons = Array.from(incompleteReasons);

  // Agent Decision Tree Routing
  let path: AgentRoutingPath;
  let action: string;

  if (review.status === 'Complete' && !review.human_review_required) {
    path = 'PATH_A';
    action = 'Mark as "Brand Approved."';
  } else {
    path = 'PATH_B';
    action = 'Route to Human Moderator with the findings list attached.';
  }

  return {
    review,
    path,
    action,
    appliedGates,
    structuralFailure: false,
  };
}
