import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BreadcrumbNav } from './BreadcrumbNav';
import {
  Search,
  Bell,
  Plus,
  Command,
  ChevronDown,
  Check,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileDrawer: () => void;
  onOpenCommandMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileDrawer, onOpenCommandMenu }) => {
  const { role, loginAs } = useAuth();
  const navigate = useNavigate();

  const [roleOpen, setRoleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
        onOpenCommandMenu();
      }
      if (e.key === 'Escape') {
        setRoleOpen(false);
        setNotificationsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
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
  }, [onOpenCommandMenu]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 bg-white border-b border-[#e7ebe3] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 text-[#202820] select-none gap-2">
      {/* Left: Mobile Hamburger & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-1.5 rounded-lg text-[#50594f] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block min-w-0">
          <BreadcrumbNav />
        </div>
      </div>

      {/* Center: Global Search & Command Menu Trigger */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
        <button
          type="button"
          onClick={onOpenCommandMenu}
          className="w-full h-9 px-3 text-xs bg-[#fbfcfa] border border-[#e7ebe3] hover:border-[#dce2d7] rounded-xl text-[#858d83] hover:text-[#202820] flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
          aria-label="Search pages, drafts, and policies"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#858d83] group-hover:text-[#295d36] transition-colors shrink-0" />
            <span className="truncate">Search drafts, policies, facts…</span>
          </div>
          <span className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] text-[10px] font-mono text-[#858d83] shrink-0">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        </button>
      </div>

      {/* Right: Actions, Persona Switcher & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* + New Draft Action */}
        <button
          type="button"
          onClick={() => navigate('/drafts/new')}
          className="h-9 px-3 sm:px-3.5 rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Create New Content Draft"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New draft</span>
        </button>

        {/* Role Switcher */}
        <div ref={roleRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen(!roleOpen)}
            className="h-9 px-2.5 sm:px-3 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white flex items-center gap-1.5 sm:gap-2 text-xs text-[#202820] transition-colors cursor-pointer"
            aria-expanded={roleOpen}
            aria-haspopup="true"
            title="Switch Persona"
          >
            <span className="w-2 h-2 rounded-full bg-[#3f7449] shrink-0" />
            <span className="hidden lg:inline text-[#858d83]">Role:</span>
            <span className="font-semibold capitalize text-xs">{role}</span>
            <ChevronDown className="w-3 h-3 text-[#858d83] shrink-0" />
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
            aria-expanded={notificationsOpen}
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#a36d24] absolute top-1.5 right-1.5 border-2 border-white flex items-center justify-center" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 sm:w-80 p-2.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-[#98a094] tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#295d36] hover:underline font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors ${
                      n.read
                        ? 'bg-white border-[#f0f3ec] text-[#737d70]'
                        : 'bg-[#f8faf6] border-[#e7ebe3] text-[#202820] font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold">{n.title}</span>
                      <span className="text-[10px] text-[#98a094] shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#737d70] mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
