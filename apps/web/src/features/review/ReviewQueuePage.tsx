import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { reviewApi, ReviewQueueItem } from './reviewApi';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert,
  Lock,
  Loader2,
  RefreshCw,
  Sparkles,
  FileCheck,
} from 'lucide-react';

const DEFAULT_QUEUE: ReviewQueueItem[] = [
  {
    _id: 'DRF-204',
    workspaceId: 'ws_verdant',
    authorId: 'usr_creator_1',
    title: 'Summer Campaign - Social',
    channel: 'Social Media',
    status: 'submitted',
    currentRevisionNo: 2,
    text: 'Naturally boost your immune system this summer with all-natural ingredients.',
    isOwnDraft: false,
    canDecide: true,
    submittedAt: '2026-10-29T08:30:00Z',
    createdAt: '2026-10-29T08:00:00Z',
  },
  {
    _id: 'DRF-202',
    workspaceId: 'ws_verdant',
    authorId: 'usr_me_creator',
    title: 'Product Brochure v2',
    channel: 'Print & Digital',
    status: 'submitted',
    currentRevisionNo: 1,
    text: '100% infallible protection against critical security exploits and zero-day threats.',
    isOwnDraft: true,
    canDecide: false,
    submittedAt: '2026-10-29T05:15:00Z',
    createdAt: '2026-10-29T04:45:00Z',
  },
  {
    _id: 'DRF-203',
    workspaceId: 'ws_verdant',
    authorId: 'usr_creator_2',
    title: 'Email - New Pricing & Investment',
    channel: 'Direct Email',
    status: 'submitted',
    currentRevisionNo: 3,
    text: 'Guaranteed 20% investment returns with zero risk under FFA-2022 guidelines.',
    isOwnDraft: false,
    canDecide: true,
    submittedAt: '2026-10-28T18:00:00Z',
    createdAt: '2026-10-28T14:00:00Z',
  },
  {
    _id: 'DRF-199',
    workspaceId: 'ws_verdant',
    authorId: 'usr_creator_3',
    title: 'Event Flyer - Fall Keynote',
    channel: 'Print',
    status: 'submitted',
    currentRevisionNo: 1,
    text: 'Join our revolutionary keynote showcasing miracle breakthroughs in sustainability.',
    isOwnDraft: false,
    canDecide: true,
    submittedAt: '2026-10-28T12:00:00Z',
    createdAt: '2026-10-28T11:00:00Z',
  },
];

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const [items, setItems] = useState<ReviewQueueItem[]>(DEFAULT_QUEUE);
  const [filter, setFilter] = useState<'all' | 'can_review' | 'own'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const liveItems = await reviewApi.getQueue();
      if (liveItems && liveItems.length > 0) {
        setItems(liveItems);
      }
    } catch (e) {
      // Keep DEFAULT_QUEUE if offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === 'can_review' && !item.canDecide) return false;
    if (filter === 'own' && !item.isOwnDraft) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Review Queue</h1>
            <Badge variant="review" size="sm">Multi-Role Governance</Badge>
          </div>
          <p className="text-xs text-[#736d64] mt-0.5">
            Content awaiting compliance sign-off. Segregation of duties strictly prevents self-review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchQueue}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Segregation of Duties Educational Banner */}
      <div className="p-3.5 rounded-xl border border-[#d9d1c5] bg-[#faf7f2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#12161c]">
          <Lock className="w-4 h-4 text-[#295d36] shrink-0" />
          <span>
            <strong>Segregation of Duties Enforced:</strong> Users cannot review, approve, or reject their own content submissions. Reviewers must be independent from the content author.
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#295d36] bg-[#dcfce7] px-2.5 py-1 rounded-md shrink-0">
          Current Role: {role.toUpperCase()}
        </span>
      </div>

      {/* Filter Tabs & Search Bar - Responsive Wrap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4ddd3] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Submissions', count: items.length },
            { key: 'can_review', label: 'Eligible to Review', count: items.filter(i => i.canDecide).length },
            { key: 'own', label: 'My Submissions (Locked)', count: items.filter(i => i.isOwnDraft).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 shrink-0 ${
                filter === tab.key
                  ? 'bg-[#12161c] text-white shadow-xs'
                  : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-[#e4ddd3] text-[#736d64]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter queue by title..."
          className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#3f7449] w-full sm:w-60"
        />
      </div>

      {/* Review Queue Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#e4ddd3] text-xs text-[#736d64]">
            No drafts currently awaiting review matching the filter criteria.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item._id}
              className={`p-4 sm:p-5 rounded-xl border transition-all bg-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.isOwnDraft ? 'border-[#fed7aa] bg-[#fffaf5]' : 'border-[#e4ddd3] hover:border-[#3f7449]/50'
              }`}
            >
              {/* Item Info */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#12161c] truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono bg-[#ede6db] text-[#4b5563] px-2 py-0.5 rounded">
                    Rev #{item.currentRevisionNo}
                  </span>
                  <span className="text-[10px] text-[#736d64] font-medium">
                    · Channel: {item.channel}
                  </span>
                </div>

                <div className="text-xs text-[#4b5563] font-serif italic truncate bg-[#faf7f2] p-2 rounded border border-[#eee7de]">
                  "{item.text || 'Submitted draft copy...'}"
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#736d64] pt-1">
                  <span>Author ID: <strong className="text-[#12161c] font-mono">{String(item.authorId).slice(-8)}</strong></span>
                  <span>·</span>
                  <span>Submitted: {new Date(item.submittedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#eee7de]">
                {item.isOwnDraft ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c] text-xs font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Self-Review Prohibited
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/review/${item._id}`)}
                      className="text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="review" size="sm">
                      Awaiting Sign-off
                    </Badge>
                    <Button
                      size="sm"
                      variant="lime"
                      onClick={() => navigate(`/review/${item._id}`)}
                      className="text-xs gap-1 font-semibold"
                    >
                      <span>Review & Decide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
