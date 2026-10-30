import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { draftsApi } from './draftsApi';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Trash2,
  X,
  Layers,
  RotateCcw,
} from 'lucide-react';

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
  {
    id: 'DRF-198',
    title: 'Instagram Influencer Brief',
    channel: 'Social Media',
    author: 'Alex Kim',
    status: 'review',
    statusLabel: 'Needs Review',
    findings: 1,
    updatedAt: '3d ago',
  },
];

export const DraftListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get('tab') as 'all' | 'progress' | 'analysis' | 'review' | 'approved') || 'all';
  const channelFilter = searchParams.get('channel') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const sortBy = (searchParams.get('sort') as 'updated' | 'priority' | 'title') || 'updated';

  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '');
  const [draftsList, setDraftsList] = useState<DraftItem[]>(DRAFTS_DATA);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== 'all' && value !== 'updated') {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Debounce search query syncing to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('q', localQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [localQuery, updateParam]);

  useEffect(() => {
    draftsApi.list()
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: DraftItem[] = data.map((d: any) => {
            const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
              draft: { variant: 'draft', label: 'Draft' },
              submitted: { variant: 'review', label: 'Needs Review' },
              changes_requested: { variant: 'medium', label: 'Changes Requested' },
              approved: { variant: 'approved', label: 'Approved' },
              rejected: { variant: 'high', label: 'Rejected' },
            };
            const mappedStatus = statusMap[d.status] || { variant: 'draft', label: d.status };
            return {
              id: d._id || d.id,
              title: d.title || 'Untitled Draft',
              channel: d.channel || 'Social Media',
              author: d.authorId ? `usr_${String(d.authorId).slice(-4)}` : 'You',
              status: mappedStatus.variant,
              statusLabel: mappedStatus.label,
              findings: 0,
              updatedAt: new Date(d.updatedAt || d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          });
          setDraftsList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleSelectAll = () => {
    const allSelected = filteredDrafts.every((d) => selectedIds[d.id]);
    if (allSelected) {
      setSelectedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredDrafts.forEach((d) => {
        next[d.id] = true;
      });
      setSelectedIds(next);
    }
  };

  const handleBatchAnalysis = () => {
    showToast(`Triggered batch compliance scan across ${selectedCount} drafts.`);
  };

  const handleBatchExport = () => {
    const selectedDrafts = draftsList.filter((d) => selectedIds[d.id]);
    const blob = new Blob([JSON.stringify(selectedDrafts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandguard_drafts_export_${Date.now()}.json`;
    a.click();
    showToast(`Exported ${selectedCount} drafts to JSON.`);
  };

  const handleResetFilters = () => {
    setLocalQuery('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const filteredDrafts = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    return draftsList
      .filter((d) => {
        // Tab filter
        if (tab === 'review' && d.status !== 'review') return false;
        if (tab === 'approved' && d.status !== 'approved') return false;
        if (tab === 'analysis' && d.status !== 'analysis') return false;
        if (tab === 'progress' && (d.status === 'approved' || d.status === 'review')) return false;

        // Channel dropdown filter
        if (channelFilter !== 'all' && d.channel.toLowerCase() !== channelFilter.toLowerCase()) return false;

        // Status dropdown filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'review' && d.status !== 'review') return false;
          if (statusFilter === 'approved' && d.status !== 'approved') return false;
          if (statusFilter === 'analysis' && d.status !== 'analysis') return false;
          if (statusFilter === 'draft' && d.status !== 'draft') return false;
          if (statusFilter === 'medium' && d.status !== 'medium') return false;
        }

        // Search query filter
        if (q) {
          return (
            d.title.toLowerCase().includes(q) ||
            d.channel.toLowerCase().includes(q) ||
            d.author.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'priority') return b.findings - a.findings;
        return a.id.localeCompare(b.id);
      });
  }, [draftsList, tab, channelFilter, statusFilter, sortBy, localQuery]);

  return (
    <div className="space-y-5 relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#12161c] text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-[#3f7449]/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          className="gap-1.5 rounded-full px-4 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>New Draft</span>
        </Button>
      </div>

      {/* Segmented Filter Tabs matching Screen 03 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All', count: draftsList.length },
          { key: 'progress', label: 'In Progress', count: draftsList.filter((d) => d.status === 'draft' || d.status === 'medium').length },
          { key: 'analysis', label: 'In Analysis', count: draftsList.filter((d) => d.status === 'analysis').length },
          { key: 'review', label: 'Needs Review', count: draftsList.filter((d) => d.status === 'review').length },
          { key: 'approved', label: 'Approved', count: draftsList.filter((d) => d.status === 'approved').length },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => updateParam('tab', item.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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

      {/* Search and Responsive Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#736d64] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search drafts by title, channel, author..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#3f7449]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Filter Dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => {
              updateParam('channel', e.target.value);
              showToast(`Filtered channel: ${e.target.value === 'all' ? 'All Channels' : e.target.value}`);
            }}
            className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none focus:border-[#3f7449] cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="Social Media">Social Media</option>
            <option value="Brochure">Brochure</option>
            <option value="Email">Email</option>
            <option value="Website">Website</option>
            <option value="Print">Print</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              updateParam('status', e.target.value);
              showToast(`Filtered status: ${e.target.options[e.target.selectedIndex].text}`);
            }}
            className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none focus:border-[#3f7449] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="review">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="analysis">In Analysis</option>
            <option value="draft">Draft</option>
            <option value="medium">Changes Requested</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              updateParam('sort', e.target.value);
              showToast(`Sorted by: ${e.target.options[e.target.selectedIndex].text}`);
            }}
            className="h-8 px-2.5 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none focus:border-[#3f7449] cursor-pointer"
          >
            <option value="updated">Sort: Updated (Recent)</option>
            <option value="priority">Sort: Flagged Issues</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Drafts Ledger Card List */}
      <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden divide-y divide-[#eee7de]">
        {filteredDrafts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#736d64] space-y-2">
            <div>No drafts found matching the selected filter criteria.</div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#295d36] font-semibold underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredDrafts.map((draft) => {
            const isSelected = !!selectedIds[draft.id];
            return (
              <div
                key={draft.id}
                onClick={() => navigate(`/drafts/edit?id=${draft.id}`)}
                className={`p-3.5 flex items-center justify-between gap-4 hover:bg-[#faf7f2] cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#f4f8f2]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(draft.id, e)}
                    className="text-[#8c857b] hover:text-[#12161c] cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#295d36]" />
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
                      <span>·</span>
                      <span className="font-mono">{draft.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
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
                      navigate(`/analysis?draftId=${draft.id}`);
                    }}
                    className="text-xs gap-1 cursor-pointer"
                  >
                    Inspect <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Batch Action Bar when items selected */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#12161c] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-3 border border-[#3f7449]/40">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#a3e635] text-[#12161c] flex items-center justify-center font-bold text-[10px]">
              {selectedCount}
            </span>
            <span className="font-medium">drafts selected</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <button
            type="button"
            onClick={handleBatchAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#295d36] hover:bg-[#1f4729] text-white font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Run Batch Scan</span>
          </button>

          <button
            type="button"
            onClick={handleBatchExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Selected</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds({})}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
