import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
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
  LogOut,
  Users,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileDrawer: () => void;
  onOpenCommandMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileDrawer, onOpenCommandMenu }) => {
  const { user, role, logout, isAdmin } = useAuth();
  const { isSignedIn, user: clerkUser } = useUser();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    type: 'warning' | 'success' | 'info' | 'alert';
    destination: string;
  }

  const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    {
      id: 'n1',
      title: '3 items in review queue',
      desc: 'Autumn campaign drafts awaiting sign-off',
      time: '10m ago',
      read: false,
      type: 'warning',
      destination: '/review',
    },
    {
      id: 'n2',
      title: 'Grounded scan complete',
      desc: 'Q3 Enterprise Cloud Launch Post audited against rulebook',
      time: '25m ago',
      read: false,
      type: 'info',
      destination: '/drafts?id=6ae4d2cad87075e87e4630e5',
    },
    {
      id: 'n3',
      title: 'Policy v2.1 Active',
      desc: 'Truth-in-advertising guidelines updated',
      time: '1h ago',
      read: false,
      type: 'success',
      destination: '/policies',
    },
    {
      id: 'n4',
      title: 'SER Ground Truth Synced',
      desc: '12 new clinical study records verified',
      time: '2h ago',
      read: true,
      type: 'info',
      destination: '/approved-facts',
    },
  ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('bg_notifications_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (n: NotificationItem) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === n.id ? { ...item, read: true } : item));
      try {
        localStorage.setItem('bg_notifications_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNotificationsOpen(false);
    if (n.destination) {
      navigate(n.destination);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandMenu();
      }
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
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
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem('bg_notifications_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleLogout = async () => {
    setAccountOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || (clerkUser ? clerkUser.fullName : 'Alex Morgan');
  const displayEmail = user?.email || (clerkUser ? clerkUser.primaryEmailAddress?.emailAddress : 'creator@brandguard.demo');
  const displayInitials = user?.initials || (displayName ? displayName.substring(0, 2).toUpperCase() : 'AM');

  return (
    <header className="h-16 bg-white border-b border-[#e7ebe3] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 text-[#202820] select-none gap-2">
      {/* Left: Mobile Hamburger & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-1.5 rounded-lg text-[#50594f] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block min-w-0">
          <BreadcrumbNav />
        </div>
      </div>

      {/* Center: Global Search & Command Menu Trigger */}
      <div className="flex-1 max-w-md sm:max-w-lg md:max-w-xl mx-2 sm:mx-4">
        <button
          type="button"
          onClick={onOpenCommandMenu}
          className="w-full h-9 px-3.5 text-xs bg-white border border-[#e5e7eb] hover:border-[#d1d5db] rounded-full text-[#6b7280] hover:text-[#111827] flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
          aria-label="Search pages, drafts, and policies"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#16a34a] transition-colors shrink-0" />
            <span className="truncate">Search drafts, policies, campaigns, or ask AI...</span>
          </div>
          <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#f3f4f6] border border-[#e5e7eb] text-[10px] font-mono text-[#6b7280] shrink-0">
            ⌘ K
          </span>
        </button>
      </div>

      {/* Right: Actions, Verified Role Badge, Notifications & Authenticated Account */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* + New Draft Action */}
        <button
          type="button"
          onClick={() => navigate('/drafts/new')}
          className="h-9 px-4 rounded-full bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Create New Content Draft"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New draft</span>
        </button>

        {/* Authenticated Role Indicator Badge (Read-only, Server-Verified) */}
        <div
          className="h-9 px-3.5 rounded-full border border-[#e5e7eb] bg-[#f9fafb] flex items-center gap-2 text-xs text-[#374151] shadow-2xs select-none"
          title={`Server-verified workspace role: ${role}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0 animate-pulse" />
          <span className="text-[#6b7280] hidden xs:inline">Role:</span>
          <span className="font-semibold capitalize text-xs text-[#111827]">{role}</span>
        </div>

        {/* Notification Bell */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-full border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] flex items-center justify-center text-[#4b5563] hover:text-[#111827] transition-colors relative cursor-pointer shadow-2xs"
            title="Notifications"
            aria-expanded={notificationsOpen}
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-[#4b5563]" />
            {unreadCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] text-white text-[9px] font-bold absolute -top-0.5 -right-0.5 flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 sm:w-80 p-2.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-[#98a094] tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#1e4a2b] hover:underline font-medium cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(n);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer relative group ${
                      n.read
                        ? 'bg-white border-[#f0f3ec] text-[#737d70] hover:bg-[#f9faf8] hover:border-[#d1d5db]'
                        : 'bg-[#f8faf6] border-[#d1fae5] text-[#111827] font-medium hover:bg-[#ecfdf5] hover:border-[#86efac]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                        )}
                        <span className="font-semibold truncate text-[#111827]">{n.title}</span>
                      </div>
                      <span className="text-[10px] text-[#9ca3af] shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#6b7280] mt-0.5 line-clamp-2">{n.desc}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#1e4a2b] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Click to view →</span>
                      <span className="font-mono text-[9px] text-[#9ca3af]">{n.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account Avatar & Popover Menu */}
        <div ref={accountRef} className="relative">
          {isSignedIn && clerkUser ? (
            <div className="shrink-0 flex items-center justify-center">
              <UserButton afterSignOutUrl="/login" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-9 h-9 rounded-full bg-[#1e4a2b] text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs hover:ring-2 hover:ring-[#1e4a2b]/30 transition-all shrink-0 select-none overflow-hidden"
              title={`Account: ${displayName} (${role})`}
              aria-label="User account menu"
              aria-expanded={accountOpen}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                displayInitials
              )}
            </button>
          )}

          {accountOpen && !isSignedIn && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 p-3 rounded-2xl border border-[#e5e7eb] bg-white shadow-xl space-y-3 animate-in fade-in slide-in-from-top-1 text-xs">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-2.5 border-b border-[#f3f4f6]">
                <div className="w-10 h-10 rounded-full bg-[#1e4a2b] text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    displayInitials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#111827] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#6b7280] truncate">{displayEmail}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] text-[10px] font-bold capitalize border border-[#a7f3d0]">
                      {role}
                    </span>
                    <span className="text-[10px] text-[#9ca3af]">Acme Platform</span>
                  </div>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="space-y-1">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      navigate('/members');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 text-[#10b981]" />
                    <span>Manage Users & Roles</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[#6b7280]" />
                  <span>Workspace Settings</span>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="pt-2 border-t border-[#f3f4f6]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#dc2626] hover:bg-[#fef2f2] transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-[#dc2626]" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
