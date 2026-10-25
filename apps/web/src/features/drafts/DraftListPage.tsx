import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Plus, Search, Filter, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface DraftItem {
  id: string;
  title: string;
  channel: string;
  author: string;
  status: BadgeVariant;
  statusLabel: string;
  findings: number;
  updatedAt: string;
}

const DRAFTS_DATA: DraftItem[] = [
  {
    id: 'DRF-204',
    title: 'Summer Campaign - Social',
    channel: 'Social Media',
    author: 'Alex Kim',
    status: 'review',
    statusLabel: 'Needs Review',
    findings: 3,
    updatedAt: '2h ago',
  },
  {
    id: 'DRF-202',
    title: 'Product Brochure v2',
    channel: 'Brochure',
    author: 'Sam Taylor',
    status: 'approved',
    statusLabel: 'Approved',
    findings: 0,
    updatedAt: '5h ago',
  },
  {
    id: 'DRF-203',
    title: 'Email - New Pricing',
    channel: 'Email',
    author: 'Morgan Lee',
    status: 'medium',
    statusLabel: 'Changes Requested',
    findings: 5,
    updatedAt: '1d ago',
  },
  {
    id: 'DRF-201',
    title: 'Website Hero Section',
    channel: 'Website',
    author: 'Alex Kim',
    status: 'analysis',
    statusLabel: 'In Analysis',
    findings: 2,
    updatedAt: '1d ago',
  },
  {
    id: 'DRF-199',
    title: 'Event Flyer - Fall Keynote',
    channel: 'Print',
    author: 'Riley Chen',
    status: 'draft',
    statusLabel: 'Draft',
    findings: 2,
    updatedAt: '2d ago',
  },
];

export const DraftListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'progress' | 'analysis' | 'review' | 'approved'>('all');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredDrafts = DRAFTS_DATA.filter((d) => {
    if (tab === 'review' && d.status !== 'review') return false;
    if (tab === 'approved' && d.status !== 'approved') return false;
    if (tab === 'analysis' && d.status !== 'analysis') return false;
    if (tab === 'progress' && (d.status === 'approved' || d.status === 'review')) return false;
    if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 03 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Drafts</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Create, manage and analyse your content against verified brand rules.
          </p>
        </div>
        <Button
          variant="dark"
          size="sm"
          onClick={() => navigate('/drafts/new')}
          className="gap-1.5 rounded-full px-4"
        >
          <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>New Draft</span>
        </Button>
      </div>

      {/* Segmented Filter Tabs matching Screen 03 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All', count: 24 },
          { key: 'progress', label: 'In Progress', count: 6 },
          { key: 'analysis', label: 'In Analysis', count: 4 },
          { key: 'review', label: 'Needs Review', count: 7 },
          { key: 'approved', label: 'Approved', count: 7 },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === item.key
                ? 'bg-[#12161c] text-white shadow-xs'
                : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                tab === item.key ? 'bg-white/20 text-white' : 'bg-[#e4ddd3] text-[#736d64]'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#736d64] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search drafts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#a3e635]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>All Types</option>
            <option>Social Media</option>
            <option>Brochure</option>
            <option>Email</option>
            <option>Website</option>
          </select>
          <select className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>All Status</option>
            <option>Needs Review</option>
            <option>Approved</option>
            <option>In Analysis</option>
          </select>
          <select className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>Sort: Updated</option>
            <option>Sort: Priority</option>
            <option>Sort: Title</option>
          </select>
        </div>
      </div>

      {/* Drafts Ledger Card List */}
      <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden divide-y divide-[#eee7de]">
        {filteredDrafts.map((draft) => {
          const isSelected = !!selectedIds[draft.id];
          return (
            <div
              key={draft.id}
              onClick={() => navigate('/analysis')}
              className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#faf7f2] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => toggleSelect(draft.id, e)}
                  className="text-[#8c857b] hover:text-[#12161c]"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[#12161c] truncate">
                      {draft.title}
                    </h3>
                    <Badge variant={draft.status} size="sm">
                      {draft.statusLabel}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#736d64] flex items-center gap-2">
                    <span>{draft.channel}</span>
                    <span>·</span>
                    <span>{draft.author}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono text-[#12161c] tabular-nums font-medium">
                    {draft.findings} findings
                  </div>
                  <div className="text-[10px] text-[#8c857b] tabular-nums">{draft.updatedAt}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/analysis');
                  }}
                  className="text-xs gap-1"
                >
                  Inspect <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
