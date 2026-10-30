import React, { useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  X,
  LogOut,
  ChevronRight,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { BrandGuardLogo } from '../ui/BrandGuardLogo';
import { CREATOR_NAV_GROUPS, REVIEWER_NAV_GROUPS, ADMIN_NAV_GROUPS } from './Sidebar';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const { workspace } = useWorkspace();

  const navSections = useMemo(() => {
    if (role === 'reviewer') return REVIEWER_NAV_GROUPS;
    if (role === 'admin') return ADMIN_NAV_GROUPS;
    return CREATOR_NAV_GROUPS;
  }, [role]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 md:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      <div
        className="w-72 max-w-[80vw] h-full bg-white flex flex-col justify-between p-4 shadow-2xl border-r border-[#e7ebe3] overflow-y-auto animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#e7ebe3]">
            <div className="flex items-center gap-2.5">
              <BrandGuardLogo size="md" />
              <div className="flex flex-col">
                <span className="font-playfair font-bold text-sm tracking-tight text-[#202820]">
                  BrandGuard <span className="text-[#295d36]">AI</span>
                </span>
                <span className="text-[9px] text-[#858d83] font-medium tracking-wider uppercase">
                  {workspace?.name || 'Compliance Console'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#858d83] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="my-4">
            <button
              type="button"
              onClick={() => {
                navigate(role === 'reviewer' ? '/review' : role === 'admin' ? '/members' : '/drafts/new');
                onClose();
              }}
              className="w-full h-10 px-3.5 rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{role === 'reviewer' ? 'Open Review Queue' : role === 'admin' ? 'Manage Users' : 'New Content Review'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-1">
                <div className="px-2 text-[10px] font-mono tracking-wider text-[#98a094] uppercase font-medium">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#edf5e8] text-[#24512e] font-semibold'
                            : 'text-[#50594f] hover:bg-[#f6f8f3] hover:text-[#202820]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#3f7449]' : 'text-[#83907e]'}`} />
                          <span>{item.name}</span>
                        </div>
                        {(item as any).badge && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#d9ebd1] text-[#315f3a] text-[10px] font-bold">
                            {(item as any).badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-[#e7ebe3] space-y-3">
          <div
            onClick={() => {
              navigate('/policies');
              onClose();
            }}
            className="flex items-center justify-between p-2 rounded-xl bg-[#f8faf5] border border-[#e8eee1] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#e7f1df] text-[#3f7449] flex items-center justify-center">
                <CircleHelp className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#202820]">Need guidance?</span>
                <span className="text-[9px] text-[#858d83]">Browse policy rules</span>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#858d83]" />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#1e4a2b] text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.initials || 'U'
                )}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#202820] truncate">{user?.name}</span>
                <span className="text-[10px] text-[#858d83] capitalize">{role}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
                navigate('/login');
              }}
              className="text-[#858d83] hover:text-[#b8473c] p-1 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
