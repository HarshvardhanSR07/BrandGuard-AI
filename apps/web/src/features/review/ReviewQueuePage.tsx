import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowRight, CheckCircle2, AlertCircle, Eye, ShieldAlert } from 'lucide-react';

interface ReviewQueueItem {
  id: string;
  title: string;
  author: string;
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  findingsCount: number;
  highlightExcerpt: string;
}

const QUEUE_ITEMS: ReviewQueueItem[] = [
  {
    id: 'DRF-204',
    title: 'Summer Campaign - Social',
    author: 'Alex Kim',
    submittedAt: '2h ago',
    priority: 'high',
    findingsCount: 3,
    highlightExcerpt: 'Naturally boost your immune system this summer.',
  },
  {
    id: 'DRF-202',
    title: 'Product Brochure v2',
    author: 'Sam Taylor',
    submittedAt: '5h ago',
    priority: 'high',
    findingsCount: 2,
    highlightExcerpt: '100% infallible protection against critical security exploits.',
  },
  {
    id: 'DRF-203',
    title: 'Email - New Pricing',
    author: 'Morgan Lee',
    submittedAt: '1d ago',
    priority: 'medium',
    findingsCount: 5,
    highlightExcerpt: 'Save 50% more than legacy overpriced competitor infrastructure.',
  },
  {
    id: 'DRF-199',
    title: 'Event Flyer - Fall Keynote',
    author: 'Riley Chen',
    submittedAt: '2d ago',
    priority: 'medium',
    findingsCount: 1,
    highlightExcerpt: 'Industry-first guaranteed SLA performance with zero lag.',
  },
  {
    id: 'DRF-197',
    title: 'Instagram Ad - Q3 Boost',
    author: 'Alex Kim',
    submittedAt: '3d ago',
    priority: 'low',
    findingsCount: 1,
    highlightExcerpt: 'Transform your daily cloud operations effortlessly today.',
  },
];

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem>(QUEUE_ITEMS[0]);

  const filteredItems = QUEUE_ITEMS.filter((item) => {
    if (filter === 'high') return item.priority === 'high';
    if (filter === 'medium') return item.priority === 'medium';
    if (filter === 'low') return item.priority === 'low';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 06 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Review Queue</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Review and approve content before it's published. Segregation of duties enforced.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>Sort by: Priority</option>
            <option>Sort by: Submitted Date</option>
            <option>Sort by: Findings Count</option>
          </select>
        </div>
      </div>

      {/* Priority Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All', count: QUEUE_ITEMS.length },
          { key: 'high', label: 'High Priority', count: 2 },
          { key: 'medium', label: 'Medium', count: 2 },
          { key: 'low', label: 'Low', count: 1 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
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

      {/* Two Column Layout matching Screen 06 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue Items List (6 cols) */}
        <div className="lg:col-span-6 space-y-2.5">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedItem.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-[#12161c] ring-1 ring-[#12161c] shadow-card'
                    : 'border-[#e4ddd3] hover:border-[#d9d1c5] shadow-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#12161c] truncate">{item.title}</span>
                  <Badge variant={item.priority} size="sm">
                    {item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#736d64] mt-2">
                  <span>Author: {item.author}</span>
                  <span className="font-mono tabular-nums">{item.findingsCount} findings</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Focus Preview Card matching Screen 06 */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-6 space-y-5">
          <div>
            <div className="text-[11px] text-[#736d64] font-medium uppercase tracking-wider">
              Draft for Review
            </div>
            <h2 className="text-base font-bold text-[#12161c] mt-0.5">{selectedItem.title}</h2>
            <div className="text-xs text-[#736d64] mt-0.5">
              Submitted by <span className="text-[#12161c] font-medium">{selectedItem.author}</span> · {selectedItem.submittedAt}
            </div>
          </div>

          {/* Dark Excerpt Card from Screen 06 */}
          <div className="p-6 rounded-xl bg-[#0c0e12] text-white space-y-3 shadow-inner">
            <span className="text-[10px] text-[#a3e635] uppercase font-mono tracking-wider font-semibold">
              Pending Claim Span
            </span>
            <p className="font-display text-xl leading-relaxed italic text-white/90">
              "{selectedItem.highlightExcerpt}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Badge variant={selectedItem.priority} size="md">
              {selectedItem.priority === 'high' ? 'High Priority' : 'Medium Priority'} · {selectedItem.findingsCount} findings
            </Badge>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/review/${selectedItem.id}`)}
                className="gap-1.5 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </Button>
              <Button
                size="sm"
                variant="lime"
                onClick={() => navigate(`/review/${selectedItem.id}`)}
                className="gap-1.5 text-xs font-semibold px-4"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0c0e12]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
