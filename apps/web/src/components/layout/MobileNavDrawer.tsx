import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BookOpen,
  FileCheck2,
  CheckCheck,
  Activity,
  Fingerprint,
  Settings2,
  Plus,
  X,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { BrandGuardLogo } from '../ui/BrandGuardLogo';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CONTENT WORKFLOW',
    items: [
      { name: 'Content Review', path: '/drafts', icon: FileText, badge: '6' },
      { name: 'Findings & Analysis', path: '/analysis', icon: Sparkles, badge: '4' },
    ],
  },
  {
    label: 'GROUND TRUTH',
    items: [
      { name: 'Brand Policies', path: '/policies', icon: BookOpen },
      { name: 'Approved Facts', path: '/approved-facts', icon: FileCheck2 },
    ],
  },
  {
    label: 'VERIFICATION & AUDIT',
    items: [
      { name: 'Review Queue', path: '/review', icon: CheckCheck, badge: '3' },
      { name: 'Audit Trail', path: '/audit', icon: Fingerprint },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { name: 'Governance Insights', path: '/governance', icon: Activity },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { name: 'Settings & Workspaces', path: '/settings', icon: Settings2 },
    ],
  },
];

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const { workspace } = useWorkspace();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 lg:hidden"
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
              className="p-1.5 rounded-lg text-[#858d83] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors"
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
                navigate('/drafts/new');
                onClose();
              }}
              className="w-full h-10 px-3.5 rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Content Review</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            {NAV_SECTIONS.map((section) => (
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
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#edf5e8] text-[#24512e] font-semibold border-l-3 border-[#5c8b51]'
                            : 'text-[#50594f] hover:bg-[#f6f8f3] hover:text-[#202820]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#3f7449]' : 'text-[#83907e]'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#d9ebd1] text-[#315f3a] text-[10px] font-bold">
                            {item.badge}
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
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-[#3f7449] text-white font-bold flex items-center justify-center text-xs shrink-0">
                {role === 'reviewer' ? 'SR' : role === 'creator' ? 'AM' : 'AD'}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#202820] truncate">
                  {role === 'reviewer' ? 'Sam Rivera' : role === 'creator' ? 'Alex Morgan' : 'Admin Director'}
                </span>
                <span className="text-[10px] text-[#858d83] capitalize">{role}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate('/login');
                onClose();
              }}
              className="text-[#858d83] hover:text-[#b8473c] p-1.5 transition-colors"
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
