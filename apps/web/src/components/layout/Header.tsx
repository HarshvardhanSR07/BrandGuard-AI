import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Search,
  Bell,
  Plus,
  Command,
  ChevronDown,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { role, loginAs } = useAuth();
  const navigate = useNavigate();

  const [roleOpen, setRoleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#e7ebe3] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 text-[#202820] select-none">
      {/* Left: Breadcrumbs (Hidden on small mobile screens to prevent overflow) */}
      <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
        <span className="text-[#858d83]">Northstar Studio</span>
        <span className="text-[#858d83]">/</span>
        <strong className="font-semibold text-[#202820]">Compliance Console</strong>
      </div>

      {/* Center: Global Search with Cmd+K Shortcut */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-[#858d83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search campaigns, guidelines, approved facts…"
            className="w-full h-9 pl-9 pr-14 text-xs bg-[#fbfcfa] border border-[#e7ebe3] hover:border-[#dce2d7] rounded-xl text-[#202820] placeholder-[#858d83] focus:outline-none focus:border-[#3f7449] focus:ring-2 focus:ring-[#3f7449]/10 transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] text-[10px] font-mono text-[#858d83]">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        </div>
      </div>

      {/* Right: Actions, Role Switcher & Notifications */}
      <div className="flex items-center gap-3">
        {/* + New Draft Action */}
        <button
          type="button"
          onClick={() => navigate('/drafts/new')}
          className="h-9 px-3.5 rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New draft</span>
        </button>

        {/* Role Switcher (from brandguard-ai-clean-ui) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen(!roleOpen)}
            className="h-9 px-3 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white flex items-center gap-2 text-xs text-[#202820] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#3f7449]" />
            <span className="hidden md:inline text-[#858d83]">Role:</span>
            <span className="font-semibold capitalize">{role}</span>
            <ChevronDown className="w-3 h-3 text-[#858d83]" />
          </button>

          {roleOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 p-1.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[#98a094] tracking-wider">
                Preview persona
              </div>
              {(['creator', 'reviewer', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    loginAs(r);
                    setRoleOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-[#f7f8f5] capitalize transition-colors text-left"
                >
                  <span className={role === r ? 'font-bold text-[#295d36]' : 'text-[#202820]'}>
                    {r}
                  </span>
                  {role === r && <Check className="w-3.5 h-3.5 text-[#295d36]" />}
                </button>
              ))}
              <div className="px-2.5 py-1 text-[10px] text-[#858d83] border-t border-[#e7ebe3]">
                Role preview for testing permissions.
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white flex items-center justify-center text-[#50594f] hover:text-[#202820] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#a36d24] absolute top-2 right-2 border-2 border-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 p-2 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-2">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[#98a094] tracking-wider">
                Notifications
              </div>
              <div className="p-2.5 rounded-lg bg-[#fff6e5] border border-[#fed7aa] space-y-0.5">
                <div className="text-xs font-semibold text-[#a36d24]">3 items in review queue</div>
                <div className="text-[11px] text-[#78350f]">Autumn campaign drafts awaiting sign-off</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#eff6ed] border border-[#bbf7d0] space-y-0.5">
                <div className="text-xs font-semibold text-[#295d36]">Policy v2.1 Active</div>
                <div className="text-[11px] text-[#14532d]">Truth-in-advertising guidelines updated</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate('/review');
                }}
                className="w-full py-1.5 text-xs font-semibold text-[#295d36] hover:underline flex items-center justify-center gap-1"
              >
                <span>Open review queue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
