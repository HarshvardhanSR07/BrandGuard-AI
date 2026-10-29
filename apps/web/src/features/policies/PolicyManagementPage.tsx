import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  Search,
  Shield,
  Filter,
  Sparkles,
  X,
  Trash2,
  CheckCircle2,
  Archive,
  RotateCcw,
} from 'lucide-react';

interface PolicyRule {
  id: string;
  rule: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  status: 'active' | 'draft' | 'archived';
  version: string;
  updatedAt: string;
}

const INITIAL_RULES: PolicyRule[] = [
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
  {
    id: 'RUL-07',
    rule: '"Guaranteed 100% loss-free"',
    type: 'Pricing Claim',
    severity: 'high',
    status: 'active',
    version: 'v2.2',
    updatedAt: 'Jun 01, 2024',
  },
];

export const PolicyManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'prohibited' | 'disclaimers' | 'terminology' | 'pricing'>(
    'all'
  );
  const [query, setQuery] = useState('');
  const [rulesList, setRulesList] = useState<PolicyRule[]>(INITIAL_RULES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('Prohibited Phrase');
  const [ruleSeverity, setRuleSeverity] = useState<'high' | 'medium' | 'low'>('high');
  const [ruleDescription, setRuleDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const newRule: PolicyRule = {
      id: `RUL-0${rulesList.length + 1}`,
      rule: ruleName.startsWith('"') ? ruleName : `"${ruleName}"`,
      type: ruleType,
      severity: ruleSeverity,
      status: 'active',
      version: 'v2.2',
      updatedAt: 'Just now',
    };

    setRulesList((prev) => [newRule, ...prev]);
    setIsAddModalOpen(false);
    setRuleName('');
    setRuleDescription('');
    showToast(`Added brand policy rule: ${newRule.rule}`);
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRulesList((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'archived' : 'active' } : r
      )
    );
    const target = rulesList.find((r) => r.id === id);
    const newStatus = target?.status === 'active' ? 'Archived' : 'Active';
    showToast(`Rule ${target?.rule} status set to ${newStatus}.`);
  };

  const handleDeleteRule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = rulesList.find((r) => r.id === id);
    setRulesList((prev) => prev.filter((r) => r.id !== id));
    showToast(`Deleted rule: ${target?.rule}`);
  };

  const filteredRules = rulesList.filter((r) => {
    if (tab === 'prohibited' && r.type !== 'Prohibited Phrase') return false;
    if (tab === 'disclaimers' && r.type !== 'Required Disclaimer') return false;
    if (tab === 'terminology' && r.type !== 'Terminology') return false;
    if (tab === 'pricing' && r.type !== 'Pricing Claim') return false;
    if (
      query &&
      !r.rule.toLowerCase().includes(query.toLowerCase()) &&
      !r.type.toLowerCase().includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#12161c] text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-[#3f7449]/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          className="gap-1.5 rounded-full px-4 cursor-pointer"
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
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
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
          className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#3f7449]"
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7de]">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#736d64]">
                    No policy rules found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#faf7f2] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#12161c]">{rule.rule}</td>
                    <td className="py-3 px-4 text-[#4b5563]">{rule.type}</td>
                    <td className="py-3 px-4">
                      <Badge variant={rule.severity} size="sm">
                        {rule.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={rule.status === 'active' ? 'active' : 'draft'}
                        size="sm"
                      >
                        {rule.status === 'active' ? 'Active' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#736d64]">
                      {rule.version}
                    </td>
                    <td className="py-3 px-4 text-[#736d64] tabular-nums">{rule.updatedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(rule.id, e)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium border border-[#d9d1c5] bg-white hover:bg-[#ede6db] text-[#12161c] transition-colors cursor-pointer"
                          title="Toggle Active / Archive"
                        >
                          {rule.status === 'active' ? 'Archive' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRule(rule.id, e)}
                          className="p-1 rounded text-[#8c857b] hover:text-[#b8473c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e4ddd3] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee7de]">
              <h3 className="text-sm font-bold text-[#12161c] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#295d36]" />
                <span>Add Brand Policy Rule</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8c857b] hover:text-[#12161c] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Rule Keyword / Phrase
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Miracle cure, 100% guaranteed"
                  required
                  className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                    Category / Type
                  </label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
                  >
                    <option value="Prohibited Phrase">Prohibited Phrase</option>
                    <option value="Health Claim">Health Claim</option>
                    <option value="Pricing Claim">Pricing Claim</option>
                    <option value="Terminology">Terminology</option>
                    <option value="Required Disclaimer">Required Disclaimer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                    Severity
                  </label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
                  >
                    <option value="high">High (Blocker)</option>
                    <option value="medium">Medium (Warning)</option>
                    <option value="low">Low (Advisory)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Guideline Rationale & Guidance Note
                </label>
                <textarea
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  rows={2}
                  placeholder="State the regulatory background or SER grounding requirement..."
                  className="w-full p-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eee7de]">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button size="sm" variant="lime" type="submit" className="cursor-pointer">
                  Save Rule to Registry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
