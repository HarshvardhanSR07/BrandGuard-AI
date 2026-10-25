import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertTriangle, Check, ArrowRight, Share2, BookOpen, RotateCcw } from 'lucide-react';

interface Finding {
  id: string;
  title: string;
  excerpt: string;
  policy: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  rule: string;
  suggestedFix: string;
  applied?: boolean;
}

const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'fnd-1',
    title: 'Unverified health claim',
    excerpt: 'Naturally boost your immune system this summer.',
    policy: 'Health Claims (v2.1)',
    category: 'Unverified Claim',
    severity: 'high',
    rule: 'Brand guidelines prohibit claiming direct immune boosting without verified clinical trials.',
    suggestedFix: 'Supports your overall wellness journey this summer.',
  },
  {
    id: 'fnd-2',
    title: 'Missing required disclaimer',
    excerpt: 'Our advanced formula helps you stay healthy, energized.',
    policy: 'Disclaimers (v2.1)',
    category: 'Missing Disclaimer',
    severity: 'high',
    rule: 'Mandatory FDA disclaimer required for all dietary and wellness supplements.',
    suggestedFix:
      'Our advanced formula supports daily energy and active lifestyles. *These statements have not been evaluated by the FDA.',
  },
  {
    id: 'fnd-3',
    title: 'Prohibited phrase',
    excerpt: 'infallible defense against seasonal fatigue',
    policy: 'Prohibited Phrases (v2.1)',
    category: 'Prohibited Term',
    severity: 'high',
    rule: 'Words like "infallible", "miracle", or "cure" are strictly forbidden in marketing copy.',
    suggestedFix: 'designed to help maintain natural stamina and vigor',
  },
  {
    id: 'fnd-4',
    title: 'Unverified pricing claim',
    excerpt: '50% better results than any alternative',
    policy: 'Pricing Claims (v2.0)',
    category: 'Pricing & Comparative',
    severity: 'medium',
    rule: 'Comparative efficiency claims must reference documented benchmark studies.',
    suggestedFix: 'delivered up to 140% measured efficiency gains in documented pilot benchmarks',
  },
  {
    id: 'fnd-5',
    title: 'Terminology inconsistency',
    excerpt: 'revolutionary miracle cure',
    policy: 'Brand Voice (v2.0)',
    category: 'Terminology',
    severity: 'medium',
    rule: 'Use "wellness journey" instead of clinical disease terms.',
    suggestedFix: 'scientifically crafted wellness formula',
  },
];

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [findings, setFindings] = useState<Finding[]>(INITIAL_FINDINGS);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('fnd-1');

  const selectedFinding =
    findings.find((f) => f.id === selectedFindingId) || findings[0];

  const handleApplyFix = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, applied: true } : f))
    );
  };

  const highCount = findings.filter((f) => f.severity === 'high' && !f.applied).length;
  const mediumCount = findings.filter((f) => f.severity === 'medium' && !f.applied).length;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'high') return f.severity === 'high';
    if (filter === 'medium') return f.severity === 'medium';
    if (filter === 'low') return f.severity === 'low';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Warning Alert matching Screen 05 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Analysis Results</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Summer Campaign - Social · Automated deterministic scan completed against 18 brand policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </Button>
          <Button
            size="sm"
            variant="lime"
            onClick={() => navigate('/review')}
            className="text-xs gap-1.5"
          >
            <span>Proceed to Review</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0c0e12]" />
          </Button>
        </div>
      </div>

      {/* Needs Review Alert Banner */}
      <div className="p-3.5 rounded-xl border border-[#fed7aa] bg-[#fff7ed] flex items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ffedd5] flex items-center justify-center text-[#c2410c] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#9a3412]">Needs Review</div>
            <div className="text-[11px] text-[#7c2d12]">
              We found {highCount} high-priority issues and {mediumCount} medium-priority issues.
            </div>
          </div>
        </div>
        <Badge variant={highCount > 0 ? 'high' : 'approved'} size="md">
          {highCount > 0 ? `${highCount} Prohibited` : 'Ready for Sign-off'}
        </Badge>
      </div>

      {/* Filter Tabs matching Screen 05 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Findings', count: findings.length },
          { key: 'high', label: 'High', count: highCount },
          { key: 'medium', label: 'Medium', count: mediumCount },
          { key: 'low', label: 'Low', count: 0 },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
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

      {/* Two Column Layout: Findings List (Left) & Finding Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Findings List (6 cols) */}
        <div className="lg:col-span-6 space-y-2.5">
          {filteredFindings.map((f) => {
            const isSelected = f.id === selectedFindingId;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFindingId(f.id)}
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
                  Policy: <span className="text-[#12161c] font-medium">{f.policy}</span>
                </div>

                <div className="mt-2 text-xs italic text-[#b91c1c] bg-[#fee2e2]/40 px-2.5 py-1.5 rounded-md border border-[#fecaca] truncate">
                  "{f.excerpt}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Finding Details Inspector (6 cols) matching Screen 05 */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee7de]">
            <h2 className="text-sm font-bold text-[#12161c]">Finding Details</h2>
            <Badge variant={selectedFinding.applied ? 'approved' : selectedFinding.severity}>
              {selectedFinding.applied ? 'Resolved' : selectedFinding.severity.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#736d64] uppercase tracking-wider">Category</span>
              <div className="font-semibold text-[#12161c] mt-0.5">{selectedFinding.category}</div>
            </div>
            <div>
              <span className="text-[10px] text-[#736d64] uppercase tracking-wider">Policy</span>
              <div className="font-semibold text-[#12161c] mt-0.5">{selectedFinding.policy}</div>
            </div>
          </div>

          <div className="text-xs text-[#736d64] italic">
            "{selectedFinding.rule}"
          </div>

          {/* Evidence Card: Highlighter Style */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-semibold">
              Evidence Span
            </span>
            <div className="p-3.5 rounded-lg bg-[#fef9c3] border border-[#fde047] text-xs font-serif text-[#713f12] leading-relaxed">
              "{selectedFinding.excerpt}"
            </div>
          </div>

          {/* Suggested Correction Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#736d64] uppercase tracking-wider font-semibold">
              Suggested Correction (Grounded Fact)
            </span>
            <div className="p-3.5 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#14532d] space-y-3">
              <p className="font-medium italic">"{selectedFinding.suggestedFix}"</p>
              <Button
                size="sm"
                variant="lime"
                onClick={() => handleApplyFix(selectedFinding.id)}
                disabled={selectedFinding.applied}
                className="w-full justify-center text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-[#0c0e12]" />
                {selectedFinding.applied ? 'Correction Applied' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
