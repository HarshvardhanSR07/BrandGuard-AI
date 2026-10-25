import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Link,
  Image as ImageIcon,
  Check,
  ArrowRight,
  Sparkles,
  Paperclip,
} from 'lucide-react';

export const DraftEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Summer Campaign - Social');
  const [headline, setHeadline] = useState('Naturally boost your immune system this summer.');
  const [body, setBody] = useState(
    'Our advanced formula helps you stay healthy, energized, and ready for every adventure.'
  );
  const [appliedRewrite, setAppliedRewrite] = useState(false);
  const [activeTab, setActiveTab] = useState<'guidelines' | 'tone' | 'suggestions'>('guidelines');

  const handleApply = () => {
    setHeadline('Supports your overall wellness journey this summer.');
    setAppliedRewrite(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar matching Screen 04 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e4ddd3]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-bold bg-transparent border-none text-[#12161c] focus:outline-none focus:ring-0"
          />
          <span className="text-[11px] text-[#736d64] font-mono">Draft saved 2 min ago</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/drafts')}
            className="text-xs"
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            variant="dark"
            onClick={() => navigate('/analysis')}
            className="text-xs gap-1.5"
          >
            <span>Run Analysis</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#a3e635]" />
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Analysis Assistant (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Rich Document Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden flex flex-col min-h-[560px]">
          {/* Formatting Toolbar */}
          <div className="h-10 px-4 border-b border-[#eee7de] bg-[#faf7f2] flex items-center gap-1 text-[#736d64]">
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <Underline className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-[#e4ddd3] mx-1" />
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <List className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <Link className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-[#ede6db] rounded hover:text-[#12161c]">
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Document Content Canvas */}
          <div className="p-6 space-y-4 flex-1">
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              rows={2}
              className={`w-full text-2xl font-bold tracking-tight bg-transparent resize-none focus:outline-none transition-colors ${
                !appliedRewrite ? 'text-[#12161c]' : 'text-[#15803d]'
              }`}
            />

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full text-sm text-[#4b5563] leading-relaxed bg-transparent resize-none focus:outline-none"
            />

            {/* Embedded Editorial Mountain Photograph matching Screen 04 */}
            <div className="rounded-xl overflow-hidden border border-[#e4ddd3] relative h-64 bg-slate-900 shadow-inner group">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                alt="Mountain Ridge Adventure"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <span className="text-[11px] text-white/80 font-mono">
                  Asset: mountain_ridge_hero.webp (Approved)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 border-t border-[#eee7de] bg-[#faf7f2] flex items-center justify-between">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-[#736d64]" />
              <span>Attach Media</span>
            </Button>
            <Button
              size="sm"
              variant="dark"
              onClick={() => navigate('/analysis')}
              className="gap-2 px-4 shadow-sm"
            >
              <span>Run Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a3e635]" />
            </Button>
          </div>
        </div>

        {/* Right Column: Analysis Assistant (4 cols) matching Screen 04 */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#eee7de]">
            <h2 className="text-sm font-bold text-[#12161c] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#a3e635]" />
              <span>Analysis Assistant</span>
            </h2>
          </div>

          {/* Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#ede6db] p-1 rounded-lg text-xs font-medium text-center">
            {(['guidelines', 'tone', 'suggestions'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-1 rounded-md capitalize transition-colors ${
                  activeTab === t ? 'bg-white text-[#12161c] font-semibold shadow-xs' : 'text-[#736d64]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Flagged Issues */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#736d64]">
              Detected Issues ({appliedRewrite ? '0' : '3'})
            </div>

            {!appliedRewrite ? (
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-[#fecaca] bg-[#fee2e2]/40 flex items-start justify-between gap-2">
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#12161c]">Unverified health claim</div>
                    <div className="text-[11px] text-[#b91c1c]">"boosts your immune system"</div>
                  </div>
                  <Badge variant="high" size="sm">
                    High
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border border-[#fecaca] bg-[#fee2e2]/40 flex items-start justify-between gap-2">
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#12161c]">Missing required disclaimer</div>
                    <div className="text-[11px] text-[#736d64]">FDA disclaimer mandated</div>
                  </div>
                  <Badge variant="high" size="sm">
                    High
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border border-[#fed7aa] bg-[#ffedd5]/40 flex items-start justify-between gap-2">
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#12161c]">Unverified claim</div>
                    <div className="text-[11px] text-[#c2410c]">Requires clinical reference</div>
                  </div>
                  <Badge variant="medium" size="sm">
                    Medium
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-xs text-[#15803d] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>All health claim violations resolved with grounded facts!</span>
              </div>
            )}
          </div>

          {/* Suggested Rewrite Card */}
          <div className="p-3.5 rounded-xl border border-[#d9d1c5] bg-[#faf7f2] space-y-2.5">
            <div className="text-xs font-semibold text-[#12161c]">Suggested rewrite</div>
            <p className="text-xs text-[#4b5563] italic">
              "Supports your overall wellness journey this summer."
            </p>
            <Button
              size="sm"
              variant="lime"
              onClick={handleApply}
              disabled={appliedRewrite}
              className="w-full justify-center text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-[#0c0e12]" />
              {appliedRewrite ? 'Applied' : 'Apply'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
