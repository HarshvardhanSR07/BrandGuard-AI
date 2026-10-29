import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Sparkles,
  X,
  BookOpen,
  FileCheck2,
} from 'lucide-react';

interface RecurringIssue {
  id: string;
  name: string;
  count: number;
  delta: string;
  isIncrease: boolean;
}

interface GuidelineSuggestion {
  id: string;
  title: string;
  desc: string;
  category: string;
  adopted: boolean;
}

const BASE_RECURRING_ISSUES: RecurringIssue[] = [
  { id: '1', name: 'Unverified health claims', count: 24, delta: '+12%', isIncrease: true },
  { id: '2', name: 'Missing disclaimers', count: 18, delta: '+6%', isIncrease: true },
  { id: '3', name: 'Prohibited phrases', count: 12, delta: '-4%', isIncrease: false },
  { id: '4', name: 'Pricing claims', count: 9, delta: '+2%', isIncrease: true },
  { id: '5', name: 'Unapproved terminology', count: 7, delta: '-3%', isIncrease: false },
];

const INITIAL_SUGGESTIONS: GuidelineSuggestion[] = [
  {
    id: 'prop-1',
    title: 'Add examples for immune claims',
    desc: 'Based on 24 occurrences in Social campaigns',
    category: 'Health Claim',
    adopted: false,
  },
  {
    id: 'prop-2',
    title: 'Clarify disclaimer requirements',
    desc: 'Based on 18 occurrences in Print brochures',
    category: 'Disclaimer',
    adopted: false,
  },
  {
    id: 'prop-3',
    title: 'Formalize plant-derived exceptions in SER',
    desc: 'Based on 12 recurring botanical descriptor flags',
    category: 'Terminology',
    adopted: false,
  },
];

export const GovernanceDashboard: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<string>('30days');
  const [suggestions, setSuggestions] = useState<GuidelineSuggestion[]>(INITIAL_SUGGESTIONS);
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Guideline Proposal State
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalCategory, setProposalCategory] = useState('Health Claim');
  const [proposalRationale, setProposalRationale] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTimePeriod(val);
    const label = e.target.options[e.target.selectedIndex].text;
    showToast(`Updated analytics metrics for: ${label}`);
  };

  const handleAdopt = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, adopted: !s.adopted } : s))
    );
    const target = suggestions.find((s) => s.id === id);
    const nextState = !target?.adopted;
    showToast(
      nextState
        ? `Guideline adopted: "${target?.title}". Queued for release.`
        : `Proposal marked as under review.`
    );
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim()) return;

    const newSuggestion: GuidelineSuggestion = {
      id: `prop-${Date.now()}`,
      title: proposalTitle,
      desc: proposalRationale || `Proposed based on ${proposalCategory} audit trends`,
      category: proposalCategory,
      adopted: false,
    };

    setSuggestions((prev) => [newSuggestion, ...prev]);
    setIsProposeOpen(false);
    setProposalTitle('');
    setProposalRationale('');
    showToast(`Guideline proposal submitted to brand governance committee!`);
  };

  // Scale multipliers for time period selection
  const multiplier = timePeriod === '90days' ? 2.8 : timePeriod === 'alltime' ? 6.2 : 1;
  const dateRangeLabel =
    timePeriod === '90days'
      ? 'Mar 1 – May 30 (90 Days)'
      : timePeriod === 'alltime'
      ? 'All Time Historical'
      : 'May 1 – May 30 (Last 30 Days)';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#12161c] text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-[#3f7449]/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header matching Screen 09 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Governance</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Identify patterns, recurring violation clusters, and improve brand guidelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timePeriod}
            onChange={handlePeriodChange}
            className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none focus:border-[#3f7449] cursor-pointer"
          >
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="alltime">All time</option>
          </select>
          <Button
            size="sm"
            variant="dark"
            onClick={() => setIsProposeOpen(true)}
            className="gap-1.5 rounded-full px-4 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Propose Guideline</span>
          </Button>
        </div>
      </div>

      {/* Two Column Layout matching Screen 09 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recurring Issues Ledger (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-sm font-bold text-[#12161c]">Recurring Issues</h2>
              <p className="text-[11px] text-[#736d64]">
                Frequency of flagged violations across all drafts
              </p>
            </div>
            <span className="text-[10px] font-mono font-medium text-[#295d36] bg-[#edf5e8] px-2 py-0.5 rounded">
              {dateRangeLabel}
            </span>
          </div>

          <div className="divide-y divide-[#eee7de]">
            {BASE_RECURRING_ISSUES.map((issue) => {
              const scaledCount = Math.round(issue.count * multiplier);
              return (
                <div
                  key={issue.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#faf7f2] px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        issue.isIncrease ? 'bg-[#b91c1c]' : 'bg-[#15803d]'
                      }`}
                    />
                    <span className="text-xs font-medium text-[#12161c]">{issue.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#12161c] tabular-nums">
                      {scaledCount}
                    </span>
                    <div
                      className={`flex items-center text-xs font-semibold tabular-nums ${
                        issue.isIncrease ? 'text-[#b91c1c]' : 'text-[#15803d]'
                      }`}
                    >
                      {issue.isIncrease ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{issue.delta}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Trend Graph & Suggested Updates (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Trend Chart Card matching Screen 09 */}
          <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#12161c]">Violation Resolution Trend</span>
              <span className="text-[10px] text-[#736d64] font-mono">{dateRangeLabel}</span>
            </div>

            {/* Simulated Line Chart SVG */}
            <div className="h-36 w-full pt-2">
              <svg className="w-full h-full" viewBox="0 0 300 100" fill="none">
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f3ede2" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f3ede2" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#f3ede2" strokeDasharray="3 3" />

                <path
                  d="M0,80 Q60,75 100,55 T200,35 T300,15"
                  stroke="#a3e635"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="55" r="4" fill="#a3e635" />
                <circle cx="200" cy="35" r="4" fill="#a3e635" />
                <circle cx="300" cy="15" r="5" fill="#12161c" stroke="#a3e635" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Suggested Guideline Updates matching Screen 09 */}
          <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#12161c] uppercase tracking-wider">
                Suggested Guideline Updates ({suggestions.length})
              </h3>
              <span className="text-[10px] text-[#736d64]">Click to adopt proposal</span>
            </div>

            <div className="space-y-2">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#faf7f2] border border-[#eee7de] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#12161c] flex items-center gap-1.5 truncate">
                      <span>{item.title}</span>
                      {item.adopted && (
                        <span className="text-[9px] font-mono bg-[#dcfce7] text-[#15803d] px-1.5 py-0.2 rounded font-bold">
                          Adopted
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#736d64] truncate">{item.desc}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={item.adopted ? 'outline' : 'lime'}
                    onClick={() => handleAdopt(item.id)}
                    className="text-xs px-3 cursor-pointer shrink-0"
                  >
                    {item.adopted ? 'Adopted' : 'Review'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Quote matching Screen 09 */}
          <div className="p-4 rounded-xl border border-[#e4ddd3] bg-gradient-to-r from-[#faf7f2] to-white flex items-center justify-between">
            <div className="font-display italic text-lg text-[#12161c]">
              "Guidelines evolve. Brands endure."
            </div>
            <Sparkles className="w-5 h-5 text-[#a3e635]" />
          </div>
        </div>
      </div>

      {/* Propose Guideline Modal */}
      {isProposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e4ddd3] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee7de]">
              <h3 className="text-sm font-bold text-[#12161c] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#295d36]" />
                <span>Propose Guideline Revision</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProposeOpen(false)}
                className="text-[#8c857b] hover:text-[#12161c] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Guideline Title / Proposed Rule
                </label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g. Standardize disclaimers on solar savings"
                  required
                  className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Policy Category
                </label>
                <select
                  value={proposalCategory}
                  onChange={(e) => setProposalCategory(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
                >
                  <option value="Health Claim">Health Claim</option>
                  <option value="Disclaimer">Required Disclaimer</option>
                  <option value="Terminology">Terminology & Words to Avoid</option>
                  <option value="Pricing Claim">Pricing & Yield Claims</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Governance Rationale & Observed Violation Data
                </label>
                <textarea
                  value={proposalRationale}
                  onChange={(e) => setProposalRationale(e.target.value)}
                  rows={3}
                  placeholder="Explain why this guideline change is necessary based on audit findings..."
                  className="w-full p-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eee7de]">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsProposeOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button size="sm" variant="lime" type="submit" className="cursor-pointer">
                  Submit Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
