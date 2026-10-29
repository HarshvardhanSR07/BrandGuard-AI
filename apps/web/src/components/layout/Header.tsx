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
  FileText,
  BookOpen,
  FileCheck2,
  X,
  CheckCheck,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'draft' | 'policy' | 'fact' | 'review';
  path: string;
}

const SEARCHABLE_ITEMS: SearchResult[] = [
  { id: '1', title: 'Summer Campaign - Social', subtitle: 'Drafts · DRF-204 · Social Media', type: 'draft', path: '/drafts/edit?id=DRF-204' },
  { id: '2', title: 'Product Brochure v2', subtitle: 'Drafts · DRF-202 · Print & Digital', type: 'draft', path: '/drafts/edit?id=DRF-202' },
  { id: '3', title: 'Email - New Pricing & Investment', subtitle: 'Drafts · DRF-203 · Direct Email', type: 'draft', path: '/drafts/edit?id=DRF-203' },
  { id: '4', title: 'Event Flyer - Fall Keynote', subtitle: 'Drafts · DRF-199 · Print', type: 'draft', path: '/drafts/edit?id=DRF-199' },
  { id: '5', title: '"Miracle" & Superlatives Rule', subtitle: 'Policies · RUL-01 · Prohibited Phrase', type: 'policy', path: '/policies' },
  { id: '6', title: '"Boosts immune system" Health Claim', subtitle: 'Policies · RUL-02 · Health Claim', type: 'policy', path: '/policies' },
  { id: '7', title: 'Pricing & Discount Claims Rule', subtitle: 'Policies · RUL-03 · Pricing Claim', type: 'policy', path: '/policies' },
  { id: '8', title: 'Supports overall wellness', subtitle: 'Approved Facts · FCT-01 · Clinical Study', type: 'fact', path: '/approved-facts' },
  { id: '9', title: 'Contains Vitamin C & Botanicals', subtitle: 'Approved Facts · FCT-02 · Product Spec', type: 'fact', path: '/approved-facts' },
  { id: '10', title: 'Review Queue Submissions', subtitle: 'Review · 4 pending reviews', type: 'review', path: '/review' },
];

export const Header: React.FC = () => {
  const { role, loginAs } = useAuth();
  const navigate = useNavigate();

  const [roleOpen, setRoleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: '3 items in review queue',
      desc: 'Autumn campaign drafts awaiting sign-off',
      time: '10m ago',
      read: false,
      type: 'warning',
    },
    {
      id: 'n2',
      title: 'Policy v2.1 Active',
      desc: 'Truth-in-advertising guidelines updated',
      time: '1h ago',
      read: false,
      type: 'success',
    },
    {
      id: 'n3',
      title: 'SER Ground Truth Synced',
      desc: '12 new clinical study records verified',
      time: '2h ago',
      read: true,
      type: 'info',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setRoleOpen(false);
        setNotificationsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchResults = searchValue.trim()
    ? SEARCHABLE_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const handleSelectResult = (path: string) => {
    navigate(path);
    setSearchValue('');
    setIsSearchFocused(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="h-16 bg-white border-b border-[#e7ebe3] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 text-[#202820] select-none">
      {/* Left: Breadcrumbs (Hidden on small mobile screens to prevent overflow) */}
      <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
        <span className="text-[#858d83]">Northstar Studio</span>
        <span className="text-[#858d83]">/</span>
        <strong className="font-semibold text-[#202820]">Compliance Console</strong>
      </div>

      {/* Center: Global Search with Live Dropdown and Cmd+K Shortcut */}
      <div ref={searchContainerRef} className="flex-1 max-w-xs sm:max-w-md mx-4 relative">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-[#858d83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                handleSelectResult(searchResults[0].path);
              }
            }}
            placeholder="Search campaigns, guidelines, approved facts…"
            className="w-full h-9 pl-9 pr-14 text-xs bg-[#fbfcfa] border border-[#e7ebe3] hover:border-[#dce2d7] rounded-xl text-[#202820] placeholder-[#858d83] focus:outline-none focus:border-[#3f7449] focus:ring-2 focus:ring-[#3f7449]/10 transition-all"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858d83] hover:text-[#202820]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] text-[10px] font-mono text-[#858d83]">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          )}
        </div>

        {/* Live Search Results Popup */}
        {isSearchFocused && searchValue.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#e7ebe3] rounded-xl shadow-xl p-2 max-h-80 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[#98a094] tracking-wider flex items-center justify-between">
              <span>Matching Results ({searchResults.length})</span>
              <span>Press Enter to select</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#858d83]">
                No matching drafts, policies, or facts found for "{searchValue}"
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectResult(item.path)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f8f3] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#eef4ea] text-[#3f7449] flex items-center justify-center shrink-0">
                      {item.type === 'draft' && <FileText className="w-3.5 h-3.5" />}
                      {item.type === 'policy' && <BookOpen className="w-3.5 h-3.5" />}
                      {item.type === 'fact' && <FileCheck2 className="w-3.5 h-3.5" />}
                      {item.type === 'review' && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#202820] group-hover:text-[#295d36] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#858d83] truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#858d83] group-hover:text-[#295d36] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
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

        {/* Role Switcher */}
        <div ref={roleRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen(!roleOpen)}
            className="h-9 px-3 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white flex items-center gap-2 text-xs text-[#202820] transition-colors cursor-pointer"
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
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-[#f7f8f5] capitalize transition-colors text-left cursor-pointer"
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
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white flex items-center justify-center text-[#50594f] hover:text-[#202820] transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#a36d24] absolute top-1.5 right-1.5 border-2 border-white flex items-center justify-center" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 p-2.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-[#98a094] tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-[#295d36] font-semibold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#858d83]">No active notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-lg border space-y-1 relative group transition-colors ${
                      n.type === 'warning'
                        ? 'bg-[#fff6e5] border-[#fed7aa]'
                        : n.type === 'success'
                        ? 'bg-[#eff6ed] border-[#bbf7d0]'
                        : 'bg-[#f4f7f4] border-[#e7ebe3]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`text-xs font-semibold ${
                          n.type === 'warning'
                            ? 'text-[#a36d24]'
                            : n.type === 'success'
                            ? 'text-[#295d36]'
                            : 'text-[#202820]'
                        }`}
                      >
                        {n.title}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDismissNotification(n.id, e)}
                        className="text-[#858d83] hover:text-[#b8473c] p-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[11px] text-[#50594f]">{n.desc}</div>
                    <div className="text-[9px] font-mono text-[#858d83]">{n.time}</div>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate('/review');
                }}
                className="w-full py-1.5 text-xs font-semibold text-[#295d36] hover:underline flex items-center justify-center gap-1 border-t border-[#e7ebe3] pt-2 cursor-pointer"
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
