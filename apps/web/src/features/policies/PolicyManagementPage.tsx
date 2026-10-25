import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Shield, Filter } from 'lucide-react';

interface PolicyRule {
  id: string;
  rule: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  status: 'active' | 'draft' | 'archived';
  version: string;
  updatedAt: string;
}

const RULES_DATA: PolicyRule[] = [
  {
    id: 'RUL-01',
    rule: '"Miracle"',
    type: 'Prohibited Phrase',
    severity: 'high',
    status: 'active',
    version: 'v2.1',
    updatedAt: 'May 17, 2024',
  },
  {
    id: 'RUL-02',
    rule: '"Boosts immune system"',
    type: 'Health Claim',
    severity: 'high',
    status: 'active',
    version: 'v2.1',
    updatedAt: 'May 12, 2024',
  },
  {
    id: 'RUL-03',
    rule: '"50% better results"',
    type: 'Pricing Claim',
    severity: 'high',
    status: 'active',
    version: 'v2.0',
    updatedAt: 'Apr 28, 2024',
  },
  {
    id: 'RUL-04',
    rule: '"Clinically proven"',
    type: 'Terminology',
    severity: 'medium',
    status: 'active',
    version: 'v2.0',
    updatedAt: 'Apr 28, 2024',
  },
  {
    id: 'RUL-05',
    rule: '"No side effects"',
    type: 'Prohibited Phrase',
    severity: 'high',
    status: 'active',
    version: 'v2.1',
    updatedAt: 'Mar 20, 2024',
  },
  {
    id: 'RUL-06',
    rule: '"Results may vary"',
    type: 'Required Disclaimer',
    severity: 'high',
    status: 'active',
    version: 'v2.1',
    updatedAt: 'Mar 20, 2024',
  },
];

export const PolicyManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'prohibited' | 'disclaimers' | 'terminology' | 'pricing'>('all');
  const [query, setQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredRules = RULES_DATA.filter((r) => {
    if (tab === 'prohibited' && r.type !== 'Prohibited Phrase') return false;
    if (tab === 'disclaimers' && r.type !== 'Required Disclaimer') return false;
    if (tab === 'terminology' && r.type !== 'Terminology') return false;
    if (tab === 'pricing' && r.type !== 'Pricing Claim') return false;
    if (query && !r.rule.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 08 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Brand Policies</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Manage guidelines, rules, and approved terminology across all channels.
          </p>
        </div>
        <Button
          size="sm"
          variant="dark"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 rounded-full px-4"
        >
          <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>Add Rule</span>
        </Button>
      </div>

      {/* Filter Tabs matching Screen 08 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Rules' },
          { key: 'prohibited', label: 'Prohibited Phrases' },
          { key: 'disclaimers', label: 'Disclaimers' },
          { key: 'terminology', label: 'Terminology' },
          { key: 'pricing', label: 'Pricing Claims' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              tab === t.key
                ? 'bg-[#12161c] text-white shadow-xs'
                : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-[#736d64] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search rule keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#a3e635]"
        />
      </div>

      {/* Rules Table matching Screen 08 */}
      <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf7f2] border-b border-[#eee7de] text-[#736d64] font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rule / Keyword</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7de]">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#faf7f2] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#12161c]">{rule.rule}</td>
                  <td className="py-3 px-4 text-[#4b5563]">{rule.type}</td>
                  <td className="py-3 px-4">
                    <Badge variant={rule.severity} size="sm">
                      {rule.severity.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="active" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#736d64]">{rule.version}</td>
                  <td className="py-3 px-4 text-[#736d64] tabular-nums">{rule.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
