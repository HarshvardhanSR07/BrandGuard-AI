import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Database, ShieldCheck } from 'lucide-react';

interface FactItem {
  id: string;
  claim: string;
  category: string;
  source: string;
  reference: string;
  status: 'active' | 'review' | 'expired';
}

const FACTS_DATA: FactItem[] = [
  {
    id: 'FCT-01',
    claim: '"Supports overall wellness"',
    category: 'Health Claim',
    source: 'Clinical Study 2024',
    reference: 'Dec 31, 2025',
    status: 'active',
  },
  {
    id: 'FCT-02',
    claim: '"Contains Vitamin C"',
    category: 'Product Detail',
    source: 'Product Specification',
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
    source: 'Product Label',
    reference: 'Dec 31, 2025',
    status: 'active',
  },
];

export const ApprovedFactsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'health' | 'pricing' | 'details' | 'general'>('all');
  const [query, setQuery] = useState('');

  const filteredFacts = FACTS_DATA.filter((f) => {
    if (tab === 'health' && f.category !== 'Health Claim') return false;
    if (tab === 'pricing' && f.category !== 'Pricing') return false;
    if (tab === 'details' && f.category !== 'Product Detail') return false;
    if (tab === 'general' && f.category !== 'General') return false;
    if (query && !f.claim.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Approved Facts</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Manage verified claims, pricing data, and scientific reference sources for zero-hallucination compliance.
          </p>
        </div>
        <Button size="sm" variant="dark" className="gap-1.5 rounded-full px-4 text-xs">
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
          placeholder="Search verified facts & citations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#a3e635]"
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7de]">
                {filteredFacts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#faf7f2] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#12161c]">{item.claim}</td>
                    <td className="py-3 px-4 text-[#4b5563]">{item.category}</td>
                    <td className="py-3 px-4 text-[#12161c] font-medium">{item.source}</td>
                    <td className="py-3 px-4 text-[#736d64] font-mono tabular-nums">{item.reference}</td>
                    <td className="py-3 px-4">
                      <Badge variant="active" size="sm">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
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
          </div>

          <p className="text-xs text-[#9ca3af] leading-relaxed relative z-10">
            Every sentence in high-performing marketing copy links deterministically to clinical citations, patent registrations, and legal pricing tiers.
          </p>

          <div className="text-[10px] font-mono text-[#6b7280] border-t border-[#1e2532] pt-3 relative z-10">
            Fact Vault: 4 Verified Ground Claims
          </div>
        </div>
      </div>
    </div>
  );
};
