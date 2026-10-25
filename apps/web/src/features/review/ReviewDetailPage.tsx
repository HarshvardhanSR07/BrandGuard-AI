import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';

export const ReviewDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isReviewer, isAdmin, loginAs } = useAuth();

  const [activeTab, setActiveTab] = useState<'content' | 'findings' | 'evidence' | 'history'>('content');
  const [decision, setDecision] = useState<'approve' | 'request_changes' | 'reject'>('request_changes');
  const [comment, setComment] = useState(
    'Please update the claim and add the standard disclaimer as per policy v2.1.'
  );
  const [submitted, setSubmitted] = useState(false);

  // Author of this draft
  const draftAuthorId = 'usr_alex_creator';
  const isAuthor = user.id === draftAuthorId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 07 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e4ddd3]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/review')}
            className="p-1.5 rounded-lg border border-[#d9d1c5] bg-white hover:bg-[#ede6db] text-[#12161c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#12161c]">
                Summer Campaign - Social
              </h1>
              <Badge variant="high" size="sm">
                High Priority
              </Badge>
            </div>
            <p className="text-xs text-[#736d64] mt-0.5">
              Draft ID: {id || 'DRF-204'} · Submitted by <span className="text-[#12161c] font-medium">Alex Kim</span> · 2h ago
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/analysis')}
            className="text-xs"
          >
            Inspect Analysis
          </Button>
        </div>
      </div>

      {/* Segregation of Duties Banner (if logged in as author) */}
      {isAuthor && !submitted && (
        <div className="p-3.5 rounded-xl border border-[#fed7aa] bg-[#fff7ed] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#9a3412]">
            <Lock className="w-4 h-4 text-[#c2410c] shrink-0" />
            <span>
              <strong>Segregation of Duties Enforcement:</strong> You are the author of this draft. Authors cannot approve their own submissions.
            </span>
          </div>
          <button
            onClick={() => loginAs('reviewer')}
            className="text-xs font-semibold text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-3 py-1 rounded-md hover:bg-[#bbf7d0] transition-colors shrink-0"
          >
            Switch to Reviewer (Sam Taylor)
          </button>
        </div>
      )}

      {/* Two-Column Review Studio matching Screen 07 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Content Workstation (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden space-y-4 p-5">
          {/* Segmented Workstation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#eee7de] pb-2 text-xs font-medium">
            {[
              { key: 'content', label: 'Content' },
              { key: 'findings', label: 'Findings (3)' },
              { key: 'evidence', label: 'Evidence Grounding' },
              { key: 'history', label: 'Audit History' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#12161c] text-white font-semibold'
                    : 'text-[#736d64] hover:text-[#12161c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Draft Preview Text with Highlight Marker */}
          <div className="p-5 rounded-xl bg-[#faf7f2] border border-[#eee7de] space-y-3 font-serif">
            <h2 className="text-xl font-bold text-[#12161c] leading-snug">
              <span className="bg-[#fef08a] px-1 py-0.5 rounded text-[#713f12]">
                Naturally boost your immune system this summer.
              </span>
            </h2>
            <p className="text-sm text-[#4b5563] leading-relaxed font-sans">
              Our advanced formula helps you stay healthy, energized, and ready for every adventure.
            </p>
          </div>

          {/* Evidence Citation Panel matching Screen 07 bottom card */}
          <div className="p-4 rounded-xl border border-[#e4ddd3] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#12161c] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                <span>Verified Scientific Evidence</span>
              </span>
              <span className="text-[10px] text-[#736d64] font-mono">Fact ID: FCT-094</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0]">
                <div className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider">
                  Approved Claim Source
                </div>
                <div className="font-medium text-[#14532d] mt-1">
                  "Supports your overall wellness journey."
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#faf7f2] border border-[#eee7de]">
                <div className="text-[10px] font-bold text-[#736d64] uppercase tracking-wider">
                  Scientific Reference
                </div>
                <div className="font-medium text-[#12161c] mt-1">
                  CDC Immunity Facts (2024), Page 12
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Review Decision Form (5 cols) matching Screen 07 */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#e4ddd3] shadow-card p-5 space-y-5">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-[#12161c]">Findings Checklist</h2>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#fee2e2]/40 border border-[#fecaca]">
                <span className="font-medium text-[#12161c]">Unverified health claim</span>
                <Badge variant="high" size="sm">High</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#fee2e2]/40 border border-[#fecaca]">
                <span className="font-medium text-[#12161c]">Missing required disclaimer</span>
                <Badge variant="high" size="sm">High</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#fee2e2]/40 border border-[#fecaca]">
                <span className="font-medium text-[#12161c]">Prohibited phrase</span>
                <Badge variant="high" size="sm">High</Badge>
              </div>
            </div>
          </div>

          {/* Review Decision Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#eee7de]">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#12161c] block">
                  Review Decision
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#e4ddd3] cursor-pointer hover:bg-[#faf7f2] transition-colors text-xs">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'approve'}
                      onChange={() => setDecision('approve')}
                      className="text-[#a3e635] focus:ring-[#a3e635]"
                    />
                    <span className="font-medium text-[#12161c]">Approve</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#a3e635] bg-[#f7fee7] cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'request_changes'}
                      onChange={() => setDecision('request_changes')}
                      className="text-[#a3e635] focus:ring-[#a3e635]"
                    />
                    <span className="font-medium text-[#12161c]">Request Changes</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#e4ddd3] cursor-pointer hover:bg-[#faf7f2] transition-colors text-xs">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === 'reject'}
                      onChange={() => setDecision('reject')}
                      className="text-[#a3e635] focus:ring-[#a3e635]"
                    />
                    <span className="font-medium text-[#12161c]">Reject</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#12161c] block">
                  Add a comment (required)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-lg bg-white border border-[#d9d1c5] text-xs text-[#12161c] placeholder-[#8c857b] focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <Button
                type="submit"
                variant="lime"
                size="md"
                disabled={isAuthor}
                className="w-full text-xs font-semibold py-2.5"
              >
                Submit Decision
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-[#dcfce7] border border-[#86efac] space-y-2 text-center">
              <Check className="w-6 h-6 text-[#15803d] mx-auto" />
              <div className="text-sm font-bold text-[#14532d]">Decision Logged to Audit Chain</div>
              <p className="text-xs text-[#15803d]">
                Decision: <strong className="uppercase">{decision.replace('_', ' ')}</strong> recorded under HMAC-SHA256 hash sequence #143.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/audit')}
                className="mt-2 text-xs"
              >
                View in Audit Log
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
