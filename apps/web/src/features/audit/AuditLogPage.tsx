import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Lock, CheckCircle2, ShieldCheck, RefreshCw, Filter } from 'lucide-react';

interface AuditEvent {
  seq: number;
  event: string;
  user: string;
  details: string;
  timestamp: string;
  prevHash: string;
  currHash: string;
}

const AUDIT_EVENTS: AuditEvent[] = [
  {
    seq: 142,
    event: 'Draft submitted',
    user: 'Alex Kim',
    details: 'Summer Campaign - Social',
    timestamp: '2 hours ago',
    prevHash: 'a718c9f0b83d1c448102b37651a2d88fa7b0492e85a5e783b924719c2f6d991b',
    currHash: 'f491c3905e3a890db721aa438186105fba7145e656dcb3016468e37d53b21109',
  },
  {
    seq: 141,
    event: 'Analysis completed',
    user: 'System (Rule Engine)',
    details: '3 findings detected against v2.1',
    timestamp: '2 hours ago',
    prevHash: '0bc93188e734c26402e1c3b1298c9f0b78912d0985a11b2387192a4390fca772',
    currHash: 'a718c9f0b83d1c448102b37651a2d88fa7b0492e85a5e783b924719c2f6d991b',
  },
  {
    seq: 140,
    event: 'Review decision',
    user: 'Sam Taylor',
    details: 'Changes Requested for DRF-204',
    timestamp: '2 hours ago',
    prevHash: '72b0c1448102b37651a2d88fa7b0492e85a5e783b924719c2f6d991ba718c9f0',
    currHash: '0bc93188e734c26402e1c3b1298c9f0b78912d0985a11b2387192a4390fca772',
  },
  {
    seq: 139,
    event: 'Guideline updated',
    user: 'Jane Doe',
    details: 'v2.1 - Health Claims & Disclaimers',
    timestamp: '1 day ago',
    prevHash: '5e3a890db721aa438186105fba7145e656dcb3016468e37d53b21109f491c390',
    currHash: '72b0c1448102b37651a2d88fa7b0492e85a5e783b924719c2f6d991ba718c9f0',
  },
  {
    seq: 138,
    event: 'Member invited',
    user: 'Jane Doe',
    details: 'alex@acme.com (Creator role)',
    timestamp: '2 days ago',
    prevHash: '4390fca7720bc93188e734c26402e1c3b1298c9f0b78912d0985a11b2387192a',
    currHash: '5e3a890db721aa438186105fba7145e656dcb3016468e37d53b21109f491c390',
  },
  {
    seq: 137,
    event: 'Policy rule added',
    user: 'Jane Doe',
    details: '"Miracle" - Prohibited Phrase',
    timestamp: '3 days ago',
    prevHash: '1a2d88fa7b0492e85a5e783b924719c2f6d991ba718c9f0b83d1c448102b3765',
    currHash: '4390fca7720bc93188e734c26402e1c3b1298c9f0b78912d0985a11b2387192a',
  },
];

export const AuditLogPage: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(true);

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Audit Log</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Track all important workspace activity with sequential SHA-256 cryptographic verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>All Events</option>
            <option>Draft Events</option>
            <option>Review Decisions</option>
            <option>Policy Updates</option>
          </select>
          <select className="h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg text-[#12161c] focus:outline-none">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
          <Button
            size="sm"
            variant="lime"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="gap-1.5 rounded-full px-4 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify Chain'}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Audit Timeline (Left) & Dark Stone Arch Art Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sequential Audit Ledger (8 cols) matching Screen 12 */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#eee7de] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#15803d]" />
              <span className="text-xs font-bold text-[#12161c]">
                HMAC-SHA256 Hash Chain Integrity: Verified
              </span>
            </div>
            <span className="text-[10px] text-[#736d64] font-mono">
              Head #142 · f491c3905e3a890d
            </span>
          </div>

          <div className="divide-y divide-[#eee7de]">
            {AUDIT_EVENTS.map((event) => (
              <div
                key={event.seq}
                className="p-4 hover:bg-[#faf7f2] transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#faf7f2] border border-[#d9d1c5] flex items-center justify-center font-mono text-[10px] font-bold text-[#12161c] shrink-0 mt-0.5">
                    {event.seq}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#12161c]">{event.event}</span>
                      <span className="text-[11px] text-[#736d64]">by {event.user}</span>
                    </div>
                    <div className="text-xs text-[#4b5563]">{event.details}</div>
                    <div className="font-mono text-[10px] text-[#8c857b] truncate max-w-md">
                      Hash: {event.currHash}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#736d64] font-mono tabular-nums shrink-0">
                  {event.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dark Stone Arch Portal Panel matching Screen 12 (4 cols) */}
        <div className="lg:col-span-4 bg-[#0c0e12] text-white rounded-xl p-6 shadow-card space-y-5 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_rgba(163,230,53,0.15)_0%,_transparent_70%)] pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-mono text-[#a3e635] tracking-widest uppercase">
              Immutable Governance
            </span>
            <h3 className="font-display text-2xl tracking-wide uppercase leading-tight">
              PEOPLE. <br />
              <span className="text-[#a3e635] italic">POLICIES.</span> <br />
              PROGRESS.
            </h3>
          </div>

          <p className="text-xs text-[#9ca3af] leading-relaxed relative z-10">
            Every submission, review approval, policy amendment, and user invitation creates an unalterable, cryptographically signed ledger block.
          </p>

          <div className="p-3 rounded-lg bg-[#141820] border border-[#222834] relative z-10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#a3e635] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chain Security</span>
            </div>
            <div className="text-[10px] text-[#8b949e]">
              Hardware timestamped & non-repudiable across enterprise SOC 2 controls.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
