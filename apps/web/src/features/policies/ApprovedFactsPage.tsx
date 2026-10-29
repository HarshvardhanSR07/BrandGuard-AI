import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  Search,
  Database,
  ShieldCheck,
  Sparkles,
  X,
  Copy,
  Trash2,
  FileCheck2,
} from 'lucide-react';

interface FactItem {
  id: string;
  claim: string;
  category: string;
  source: string;
  reference: string;
  status: 'active' | 'review' | 'expired';
}

const INITIAL_FACTS: FactItem[] = [
  {
    id: 'FCT-01',
    claim: '"Supports overall wellness"',
    category: 'Health Claim',
    source: 'Clinical Study CS-2024-A',
    reference: 'Dec 31, 2025',
    status: 'active',
  },
  {
    id: 'FCT-02',
    claim: '"Contains Vitamin C & Botanicals"',
    category: 'Product Detail',
    source: 'Product Specification CoA-99',
    reference: 'Dec 31, 2025',
    status: 'active',
  },
  {
    id: 'FCT-03',
    claim: '"$49 for 30 capsules"',
    category: 'Pricing',
    source: 'Pricing Sheet v2.1',
    reference: 'Jun 30, 2025',
    status: 'active',
  },
  {
    id: 'FCT-04',
    claim: '"Suitable for adults 18+"',
    category: 'General',
    source: 'Product Label Review Board',
    reference: 'Dec 31, 2025',
    status: 'active',
  },
  {
    id: 'FCT-05',
    claim: '"Sustainably harvested in Oregon"',
    category: 'Product Detail',
    source: 'Agricultural Origin Audit 2024',
    reference: 'Oct 15, 2026',
    status: 'active',
  },
];

export const ApprovedFactsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'health' | 'pricing' | 'details' | 'general'>('all');
  const [query, setQuery] = useState('');
  const [factsList, setFactsList] = useState<FactItem[]>(INITIAL_FACTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Fact Form State
  const [claimText, setClaimText] = useState('');
  const [category, setCategory] = useState('Health Claim');
  const [source, setSource] = useState('');
  const [validDate, setValidDate] = useState('Dec 31, 2026');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;

    const newFact: FactItem = {
      id: `FCT-0${factsList.length + 1}`,
      claim: claimText.startsWith('"') ? claimText : `"${claimText}"`,
      category,
      source: source || 'Verified Internal Spec',
      reference: validDate || 'Dec 31, 2026',
      status: 'active',
    };

    setFactsList((prev) => [newFact, ...prev]);
    setIsAddModalOpen(false);
    setClaimText('');
    setSource('');
    showToast(`Registered approved fact: ${newFact.claim}`);
  };

  const handleCopyCitation = (fact: FactItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `[SER Ref: ${fact.id}] ${fact.claim} (Source: ${fact.source}, Valid through ${fact.reference})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(citation);
    }
    showToast(`Citation for ${fact.id} copied to clipboard!`);
  };

  const handleDeleteFact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = factsList.find((f) => f.id === id);
    setFactsList((prev) => prev.filter((f) => f.id !== id));
    showToast(`Removed fact: ${target?.claim}`);
  };

  const filteredFacts = factsList.filter((f) => {
    if (tab === 'health' && f.category !== 'Health Claim') return false;
    if (tab === 'pricing' && f.category !== 'Pricing') return false;
    if (tab === 'details' && f.category !== 'Product Detail') return false;
    if (tab === 'general' && f.category !== 'General') return false;
    if (
      query &&
      !f.claim.toLowerCase().includes(query.toLowerCase()) &&
      !f.source.toLowerCase().includes(query.toLowerCase()) &&
      !f.id.toLowerCase().includes(query.toLowerCase())
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

      {/* Top Header matching Screen 10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Approved Facts</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Manage verified claims, pricing data, and scientific reference sources for zero-hallucination compliance.
          </p>
        </div>
        <Button
          size="sm"
          variant="dark"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 rounded-full px-4 text-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>Add Fact</span>
        </Button>
      </div>

      {/* Filter Tabs matching Screen 10 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'health', label: 'Health Claims' },
          { key: 'pricing', label: 'Pricing' },
          { key: 'details', label: 'Product Details' },
          { key: 'general', label: 'General' },
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
          placeholder="Search verified facts & citations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#3f7449]"
        />
      </div>

      {/* Main Grid: Facts Table (Left) & Side Stone Pillar Artwork (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Facts Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f2] border-b border-[#eee7de] text-[#736d64] font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Claim / Fact</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Approved Source</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7de]">
                {filteredFacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#736d64]">
                      No approved facts found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredFacts.map((item) => (
                    <tr key={item.id} className="hover:bg-[#faf7f2] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#12161c]">{item.claim}</div>
                        <span className="text-[10px] font-mono text-[#295d36] font-medium">
                          {item.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#4b5563]">{item.category}</td>
                      <td className="py-3 px-4 text-[#12161c] font-medium">{item.source}</td>
                      <td className="py-3 px-4 text-[#736d64] font-mono tabular-nums">
                        {item.reference}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="active" size="sm">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCitation(item, e)}
                            className="p-1.5 rounded-lg border border-[#d9d1c5] bg-white hover:bg-[#ede6db] text-[#12161c] transition-colors cursor-pointer"
                            title="Copy SER citation"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFact(item.id, e)}
                            className="p-1.5 rounded-lg text-[#8c857b] hover:text-[#b8473c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                            title="Delete fact"
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

        {/* Side Art & Slogan Card matching Screen 10 (4 cols) */}
        <div className="lg:col-span-4 bg-[#0c0e12] text-white rounded-xl p-6 shadow-card space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_rgba(163,230,53,0.15)_0%,_transparent_70%)] pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono text-[#a3e635] tracking-widest uppercase">
              Truth Grounding
            </span>
            <h3 className="font-display text-2xl tracking-wide uppercase leading-tight">
              REAL FACTS <br />
              <span className="text-[#a3e635] italic">STRONGER</span> <br />
              STORIES
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed pt-2">
              Every marketing statement verified against registered scientific publications,
              laboratory certificates of analysis, and legal regulatory filings.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 relative z-10 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">SER Registry Hash:</span>
            <span className="font-mono text-[#a3e635] font-semibold">0x7f..9a2</span>
          </div>
        </div>
      </div>

      {/* Add Fact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e4ddd3] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee7de]">
              <h3 className="text-sm font-bold text-[#12161c] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#295d36]" />
                <span>Add Fact to SER Registry</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8c857b] hover:text-[#12161c] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFact} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Verified Statement / Claim
                </label>
                <input
                  type="text"
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder='e.g. "Contains 100% cold-pressed jojoba"'
                  required
                  className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
                  >
                    <option value="Health Claim">Health Claim</option>
                    <option value="Product Detail">Product Detail</option>
                    <option value="Pricing">Pricing</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                    Valid Through Date
                  </label>
                  <input
                    type="text"
                    value={validDate}
                    onChange={(e) => setValidDate(e.target.value)}
                    placeholder="Dec 31, 2026"
                    className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                  Approved Citation / Reference Document
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Clinical Study CS-2024-B, Certificate CoA-102"
                  required
                  className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
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
                  Register Fact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
