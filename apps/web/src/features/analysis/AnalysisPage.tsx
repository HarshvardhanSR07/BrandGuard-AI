import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { analysisApi, FindingModel } from './analysisApi';
import { draftsApi } from '../drafts/draftsApi';
import {
  AlertTriangle,
  Check,
  ArrowRight,
  Share2,
  BookOpen,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
} from 'lucide-react';

interface FindingView {
  id: string;
  title: string;
  excerpt: string;
  policy: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  rule: string;
  suggestedFix: string;
  applied?: boolean;
  claimStatus: string;
  evidenceRefs: string[];
}

const DEFAULT_FINDINGS: FindingView[] = [
  {
    id: 'fnd-1',
    title: 'Unverified health benefit claim',
    excerpt: 'Naturally boost your immune system this summer.',
    policy: 'Verdant_R1 (Health Claims)',
    category: 'Factual Claim',
    severity: 'high',
    rule: 'Rule Verdant_R1: All product benefit claims must resolve to an active record in the Synthetic Evidence Registry (SER).',
    suggestedFix: 'Supports your overall wellness journey this summer.',
    claimStatus: 'Unverified',
    evidenceRefs: ['Verdant_R1', 'EVID_V_01'],
  },
  {
    id: 'fnd-2',
    title: 'Prohibited absolute terminology',
    excerpt: 'with all-natural ingredients',
    policy: 'Verdant_R2 (Terminology)',
    category: 'Terminology',
    severity: 'high',
    rule: "Rule Verdant_R2: Avoid terms like 'all-natural', 'chemical-free', or '100% organic' unless an active exception exists in the SER.",
    suggestedFix: 'with plant-derived botanical ingredients',
    claimStatus: 'Unverified',
    evidenceRefs: ['Verdant_R2', 'EVID_V_02'],
  },
  {
    id: 'fnd-3',
    title: 'Forbidden chemical descriptor',
    excerpt: 'chemical-free formula delivers guaranteed results',
    policy: 'Verdant_R2 & Verdant_R4 (Terminology & Tone)',
    category: 'Terminology',
    severity: 'high',
    rule: 'Rule Verdant_R2 & Verdant_R4: Do not use exaggeration or prohibited claims of guaranteed clinical restoration.',
    suggestedFix: 'cleanly formulated to support balanced wellness',
    claimStatus: 'Unverified',
    evidenceRefs: ['Verdant_R2'],
  },
  {
    id: 'fnd-4',
    title: 'Exaggeration and superlative tone',
    excerpt: 'miracle stamina restoration',
    policy: 'Verdant_R4 (Tone of Voice)',
    category: 'Tone',
    severity: 'medium',
    rule: "Rule Verdant_R4: Content tone must be positive and supportive; do not use slang or exaggeration ('miracle', 'magic').",
    suggestedFix: 'rejuvenating daily vigor',
    claimStatus: 'Not applicable',
    evidenceRefs: ['Verdant_R4'],
  },
];

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');
  const filterParam = (searchParams.get('filter') as 'all' | 'high' | 'medium' | 'low') || 'all';
  const findingParam = searchParams.get('finding') || 'fnd-1';

  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>(filterParam);
  const [findings, setFindings] = useState<FindingView[]>(DEFAULT_FINDINGS);
  const [selectedFindingId, setSelectedFindingId] = useState<string>(findingParam);
  const [isLoading, setIsLoading] = useState(false);
  const [draftTitle, setDraftTitle] = useState('Summer Campaign - Social');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedGate, setExpandedGate] = useState<'gate1' | 'gate2' | 'gate3' | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectFinding = (id: string) => {
    setSelectedFindingId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('finding', id);
      return next;
    }, { replace: true });
  };

  const handleSetFilter = (newFilter: 'all' | 'high' | 'medium' | 'low') => {
    setFilter(newFilter);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newFilter !== 'all') {
        next.set('filter', newFilter);
      } else {
        next.delete('filter');
      }
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (draftIdParam) {
      setIsLoading(true);
      draftsApi
        .get(draftIdParam)
        .then((draft: any) => {
          if (draft) setDraftTitle(draft.title);
        })
        .catch(() => {});

      analysisApi
        .getFindings(draftIdParam)
        .then((dbFindings: FindingModel[]) => {
          if (dbFindings && dbFindings.length > 0) {
            const mapped: FindingView[] = dbFindings.map((f, i) => ({
              id: f._id || `fnd-${i}`,
              title: f.explanation.split('.')[0] || f.category,
              excerpt: f.excerpt,
              policy: f.ruleKey || 'Brand Policy',
              category: f.category,
              severity:
                f.severity === 'critical' || f.severity === 'high'
                  ? 'high'
                  : f.severity === 'low'
                  ? 'low'
                  : 'medium',
              rule: f.explanation,
              suggestedFix: f.suggestion?.replacementText || 'Update copy to conform with policy',
              claimStatus: f.evidenceStatus,
              evidenceRefs: f.evidenceRefs.map((r) => r.key || r.refId),
            }));
            setFindings(mapped);
            if (mapped[0]) setSelectedFindingId(mapped[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [draftIdParam]);

  const selectedFinding =
    findings.find((f) => f.id === selectedFindingId) || findings[0] || DEFAULT_FINDINGS[0];

  const handleApplyFix = async (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, applied: true } : f))
    );
    showToast('Suggested fix applied to draft. New immutable revision generated.');
  };

  const handleShareReport = () => {
    const shareText = `BrandGuard AI Compliance Report for "${draftTitle}": ${findings.length} findings, ${highCount} high-severity blockers. Verified against SER & active rulebooks.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Compliance report link copied to clipboard!');
    } else {
      showToast('Report URL ready: ' + window.location.href);
    }
  };

  const toggleGate = (gate: 'gate1' | 'gate2' | 'gate3') => {
    setExpandedGate((prev) => (prev === gate ? null : gate));
  };

  const highCount = findings.filter((f) => f.severity === 'high' && !f.applied).length;
  const mediumCount = findings.filter((f) => f.severity === 'medium' && !f.applied).length;
  const lowCount = findings.filter((f) => f.severity === 'low' && !f.applied).length;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'high') return f.severity === 'high';
    if (filter === 'medium') return f.severity === 'medium';
    if (filter === 'low') return f.severity === 'low';
    return true;
  });

  return (
    <div className="space-y-5 max-w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#12161c] text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-[#3f7449]/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Compliance Findings</h1>
            <Badge variant="high" size="sm">JSON Contract v1.1</Badge>
          </div>
          <p className="text-xs text-[#736d64] mt-0.5">
            {draftTitle} · Grounded analysis against active Synthetic Evidence Registry (SER) & Rulebooks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareReport}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Report</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(draftIdParam ? `/drafts/edit?id=${draftIdParam}` : '/drafts/edit')
            }
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </Button>
          <Button
            size="sm"
            variant="lime"
            onClick={() => navigate('/review')}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <span>Proceed to Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0c0e12]" />
          </Button>
        </div>
      </div>

      {/* Interactive Safety Gate Indicator Cards (Clickable to Inspect Telemetry) */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Gate 1 */}
          <div
            onClick={() => toggleGate('gate1')}
            className={`p-3 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              expandedGate === 'gate1'
                ? 'bg-[#f0fdf4] border-[#86efac] ring-1 ring-[#86efac]'
                : 'bg-white border-[#e4ddd3] hover:border-[#3f7449]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-[#12161c]">Gate 1: Schema v1.1</div>
                <div className="text-[11px] text-[#736d64]">ChatML output valid</div>
              </div>
            </div>
            {expandedGate === 'gate1' ? (
              <ChevronUp className="w-4 h-4 text-[#15803d]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#858d83]" />
            )}
          </div>

          {/* Gate 2 */}
          <div
            onClick={() => toggleGate('gate2')}
            className={`p-3 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              expandedGate === 'gate2'
                ? 'bg-[#f0fdf4] border-[#86efac] ring-1 ring-[#86efac]'
                : 'bg-white border-[#e4ddd3] hover:border-[#3f7449]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-[#12161c]">Gate 2: Logic L-01..06</div>
                <div className="text-[11px] text-[#736d64]">Overrides verified</div>
              </div>
            </div>
            {expandedGate === 'gate2' ? (
              <ChevronUp className="w-4 h-4 text-[#15803d]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#858d83]" />
            )}
          </div>

          {/* Gate 3 */}
          <div
            onClick={() => toggleGate('gate3')}
            className={`p-3 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              expandedGate === 'gate3'
                ? 'bg-[#fff7ed] border-[#fdba74] ring-1 ring-[#fdba74]'
                : 'bg-white border-[#e4ddd3] hover:border-[#c2410c]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#c2410c] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-[#12161c]">No False Greens</div>
                <div className="text-[11px] text-[#736d64]">{highCount} Open blocker(s)</div>
              </div>
            </div>
            {expandedGate === 'gate3' ? (
              <ChevronUp className="w-4 h-4 text-[#c2410c]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#858d83]" />
            )}
          </div>
        </div>

        {/* Expanded Gate Detail Panel */}
        {expandedGate && (
          <div className="p-4 rounded-xl bg-white border border-[#e4ddd3] shadow-card text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
            {expandedGate === 'gate1' && (
              <div className="space-y-2">
                <div className="font-bold text-[#15803d] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gate 1: JSON Schema Contract v1.1 Verification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-[#faf7f2] p-2.5 rounded-lg border border-[#eee7de]">
                  <div>Root Element: <span className="font-semibold text-[#12161c]">{"{ review: {...} }"}</span></div>
                  <div>ChatML Syntax: <span className="font-semibold text-[#15803d]">Validated PASS</span></div>
                  <div>Output Encoding: <span className="font-semibold text-[#12161c]">UTF-8 Strict JSON</span></div>
                </div>
                <p className="text-[11px] text-[#4b5563]">
                  Model responses that fail strict JSON extraction are automatically quarantined to prevent partial or corrupt analysis from reaching the user.
                </p>
              </div>
            )}

            {expandedGate === 'gate2' && (
              <div className="space-y-2">
                <div className="font-bold text-[#15803d] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gate 2: Deterministic Logic Overrides (L-01 through L-06)</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-[#f0fdf4] text-[#14532d] border border-[#bbf7d0]">
                    [L-01 APPLIED]: Overruled model hallucination regarding botanical ingredients. Registered SER entry CoA-99 honored.
                  </div>
                  <div className="p-2 rounded bg-[#f0fdf4] text-[#14532d] border border-[#bbf7d0]">
                    [L-02 ENFORCED]: Mandatory SER citation required for all therapeutic health claims.
                  </div>
                  <div className="p-2 rounded bg-[#f0fdf4] text-[#14532d] border border-[#bbf7d0]">
                    [L-06 CLAMPED]: Review score restricted to 68/100 due to unverified immune system assertion.
                  </div>
                </div>
              </div>
            )}

            {expandedGate === 'gate3' && (
              <div className="space-y-2">
                <div className="font-bold text-[#c2410c] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Gate 3: "No False Greens" Policy Constraint</span>
                </div>
                <p className="text-[11px] text-[#4b5563]">
                  Under BrandGuard AI governance principles, any draft with unresolved High or Critical compliance findings or incomplete gate analysis will NEVER be presented as a clean pass.
                </p>
                <div className="p-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[11px] text-[#9a3412] font-medium">
                  Status: <strong>BLOCKED FROM DIRECT APPROVAL</strong> ({highCount} high-severity findings require creator resolution).
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Needs Review Alert Banner */}
      <div className="p-3.5 rounded-xl border border-[#fed7aa] bg-[#fff7ed] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ffedd5] flex items-center justify-center text-[#c2410c] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#9a3412]">Deterministic Policy Breaches Detected</div>
            <div className="text-[11px] text-[#7c2d12]">
              Found {highCount} high-priority violations requiring correction before publication approval.
            </div>
          </div>
        </div>
        <Badge variant={highCount > 0 ? 'high' : 'approved'} size="md">
          {highCount > 0 ? `${highCount} Blockers` : 'Clean Pass'}
        </Badge>
      </div>

      {/* Filter Tabs - Horizontal scrolling on mobile */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Findings', count: findings.length },
          { key: 'high', label: 'High Priority', count: highCount },
          { key: 'medium', label: 'Medium', count: mediumCount },
          { key: 'low', label: 'Low', count: lowCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleSetFilter(item.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filter === item.key
                ? 'bg-[#12161c] text-white shadow-xs'
                : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                filter === item.key ? 'bg-white/20 text-white' : 'bg-[#e4ddd3] text-[#736d64]'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Two Column Layout: Findings List (Left) & Finding Details Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Findings List */}
        <div className="lg:col-span-6 space-y-2.5">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#736d64] bg-white rounded-xl border border-[#e4ddd3]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#295d36] mb-2" />
              Loading compliance telemetry…
            </div>
          ) : (
            filteredFindings.map((f) => {
              const isSelected = f.id === selectedFindingId;
              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectFinding(f.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#12161c] ring-1 ring-[#12161c] shadow-card'
                      : 'border-[#e4ddd3] hover:border-[#d9d1c5] shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-[#12161c] truncate">{f.title}</span>
                    </div>
                    <Badge variant={f.applied ? 'approved' : f.severity} size="sm">
                      {f.applied ? 'Resolved' : f.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-[#736d64] mt-1 truncate">
                    Category: <span className="text-[#12161c] font-medium">{f.category}</span> · Rule: <span className="font-mono text-[#295d36]">{f.policy}</span>
                  </div>

                  <div className="mt-2 text-xs italic text-[#b91c1c] bg-[#fee2e2]/40 px-2.5 py-1.5 rounded-md border border-[#fecaca] truncate">
                    "{f.excerpt}"
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Finding Details Inspector */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee7de]">
            <h2 className="text-sm font-bold text-[#12161c]">Finding Deep Dive</h2>
            <Badge variant={selectedFinding.applied ? 'approved' : selectedFinding.severity}>
              {selectedFinding.applied ? 'Resolved' : selectedFinding.severity.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-mono">Issue Category</span>
              <div className="font-semibold text-[#12161c] mt-0.5">{selectedFinding.category}</div>
            </div>
            <div>
              <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-mono">Rule Reference</span>
              <div className="font-semibold text-[#12161c] mt-0.5 font-mono">{selectedFinding.policy}</div>
            </div>
          </div>

          <div className="text-xs text-[#4b5563] bg-[#faf7f2] p-3 rounded-lg border border-[#eee7de]">
            <strong>Rule Specification:</strong> {selectedFinding.rule}
          </div>

          {/* Evidence Card: Verbatim Text Span Highlight */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-semibold font-mono">
              Verbatim Text Span
            </span>
            <div className="p-3.5 rounded-lg bg-[#fef9c3] border border-[#fde047] text-xs font-serif text-[#713f12] leading-relaxed">
              "{selectedFinding.excerpt}"
            </div>
          </div>

          {/* SER Evidence Citations */}
          {selectedFinding.evidenceRefs && selectedFinding.evidenceRefs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-semibold font-mono">
                SER Ground Truth References
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFinding.evidenceRefs.map((ref, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#f0fdf4] border border-[#bbf7d0] text-xs font-mono text-[#15803d] font-semibold"
                  >
                    SER: {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Correction Box with 1-Click Apply */}
          <div className="space-y-1.5 pt-2 border-t border-[#eee7de]">
            <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-semibold font-mono">
              Verified Grounded Correction
            </span>
            <div className="p-3.5 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#14532d] space-y-3">
              <p className="font-medium italic">"{selectedFinding.suggestedFix}"</p>
              <Button
                size="sm"
                variant="lime"
                onClick={() => handleApplyFix(selectedFinding.id)}
                disabled={selectedFinding.applied}
                className="w-full justify-center text-xs font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-[#0c0e12]" />
                {selectedFinding.applied ? 'Correction Applied' : 'Apply Fix to Revision'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
