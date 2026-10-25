import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TrendingUp, Plus, ArrowUpRight, ArrowDownRight, Check, Sparkles } from 'lucide-react';

interface RecurringIssue {
  id: string;
  name: string;
  count: number;
  delta: string;
  isIncrease: boolean;
}

const RECURRING_ISSUES: RecurringIssue[] = [
  { id: '1', name: 'Unverified health claims', count: 24, delta: '+12%', isIncrease: true },
  { id: '2', name: 'Missing disclaimers', count: 18, delta: '+6%', isIncrease: true },
  { id: '3', name: 'Prohibited phrases', count: 12, delta: '-4%', isIncrease: false },
  { id: '4', name: 'Pricing claims', count: 9, delta: '+2%', isIncrease: true },
  { id: '5', name: 'Unapproved terminology', count: 7, delta: '-3%', isIncrease: false },
];

export const GovernanceDashboard: React.FC = () => {
  const [adoptedProposal, setAdoptedProposal] = useState<Record<string, boolean>>({});

  const handleAdopt = (id: string) => {
    setAdoptedProposal((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Screen 09 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Governance</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Identify patterns, recurring violation clusters, and improve brand guidelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
          <Button size="sm" variant="dark" className="gap-1.5 rounded-full px-4 text-xs">
            <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Propose Guideline</span>
          </Button>
        </div>
      </div>

      {/* Two Column Layout matching Screen 09 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recurring Issues Ledger (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#12161c]">Recurring Issues</h2>
            <p className="text-[11px] text-[#736d64]">Frequency of flagged violations across all drafts</p>
          </div>

          <div className="divide-y divide-[#eee7de]">
            {RECURRING_ISSUES.map((issue) => (
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
                    {issue.count}
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
            ))}
          </div>
        </div>

        {/* Right Column: Trend Graph & Suggested Updates (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Trend Chart Card matching Screen 09 */}
          <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#12161c]">Violation Resolution Trend</span>
              <span className="text-[10px] text-[#736d64] font-mono">May 1 – May 30</span>
            </div>

            {/* Simulated Line Chart SVG */}
            <div className="h-36 w-full pt-2">
              <svg className="w-full h-full" viewBox="0 0 300 100" fill="none">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f3ede2" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f3ede2" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#f3ede2" strokeDasharray="3 3" />

                {/* Trend line */}
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
            <h3 className="text-xs font-bold text-[#12161c] uppercase tracking-wider">
              Suggested Guideline Updates
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-[#faf7f2] border border-[#eee7de] flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-[#12161c]">Add examples for immune claims</div>
                  <div className="text-[11px] text-[#736d64]">Based on 24 occurrences in Social campaigns</div>
                </div>
                <Button
                  size="sm"
                  variant={adoptedProposal['prop-1'] ? 'outline' : 'lime'}
                  onClick={() => handleAdopt('prop-1')}
                  className="text-xs px-3"
                >
                  {adoptedProposal['prop-1'] ? 'Adopted' : 'Review'}
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[#faf7f2] border border-[#eee7de] flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-[#12161c]">Clarify disclaimer requirements</div>
                  <div className="text-[11px] text-[#736d64]">Based on 18 occurrences in Print brochures</div>
                </div>
                <Button
                  size="sm"
                  variant={adoptedProposal['prop-2'] ? 'outline' : 'lime'}
                  onClick={() => handleAdopt('prop-2')}
                  className="text-xs px-3"
                >
                  {adoptedProposal['prop-2'] ? 'Adopted' : 'Review'}
                </Button>
              </div>
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
    </div>
  );
};
