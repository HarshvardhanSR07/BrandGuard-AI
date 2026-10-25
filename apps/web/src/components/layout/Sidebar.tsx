import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckCheck,
  BookOpen,
  FileCheck2,
  Activity,
  Fingerprint,
  Settings2,
  ChevronDown,
  LockKeyhole,
  Check,
  CircleHelp,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const [workspace, setWorkspace] = useState('Northstar Studio');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const navGroups = [
    {
      label: 'WORKSPACE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Drafts', path: '/drafts', icon: FileText, badge: '24' },
        { name: 'Review queue', path: '/review', icon: CheckCheck, badge: '3' },
      ],
    },
    {
      label: 'GOVERNANCE',
      items: [
        { name: 'Brand policies', path: '/policies', icon: BookOpen },
        { name: 'Approved facts', path: '/approved-facts', icon: FileCheck2 },
        { name: 'Governance', path: '/governance', icon: Activity },
        { name: 'Audit log', path: '/audit', icon: Fingerprint },
      ],
    },
    {
      label: 'MANAGE',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings2 },
      ],
    },
  ];

  return (
    <aside className="w-18 lg:w-60 bg-white border-r border-[#e7ebe3] flex flex-col justify-between shrink-0 select-none text-[#202820] z-20 py-5 transition-all">
      <div className="px-3 lg:px-4">
        {/* Top Brand Lockup with Official Emblem */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 cursor-pointer group px-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[#295d36] border border-[#1e4628] flex items-center justify-center shadow-xs shrink-0 p-1.5 transition-transform group-hover:scale-105">
            <img
              src="/brandguard-emblem-white.png"
              alt="BrandGuard Emblem"
              className="w-full h-full object-contain filter drop-shadow-2xs"
            />
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="font-playfair font-bold text-base tracking-tight text-[#202820] leading-tight">
              BrandGuard <span className="text-[#295d36] font-extrabold">AI</span>
            </span>
            <span className="text-[9px] text-[#858d83] font-medium tracking-wider uppercase">
              Compliance Console
            </span>
          </div>
        </div>

        {/* Workspace Picker with Dropdown Menu (from brandguard-ai-clean-ui) */}
        <div className="relative my-5 hidden lg:block">
          <button
            type="button"
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white hover:border-[#dce2d7] transition-all text-left text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-[#e4efdd] text-[#295d36] font-bold flex items-center justify-center shrink-0 text-xs">
                {workspace[0]}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[#202820] truncate">{workspace}</span>
                <span className="text-[10px] text-[#858d83]">Production</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#858d83]" />
          </button>

          {workspaceOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-1.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-1">
              {['Northstar Studio', 'Fieldwork Goods', 'Venture Health'].map((ws) => (
                <button
                  key={ws}
                  type="button"
                  onClick={() => {
                    setWorkspace(ws);
                    setWorkspaceOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-[#f7f8f5] text-[#202820] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#e4efdd] text-[#295d36] font-semibold text-[10px] flex items-center justify-center">
                      {ws[0]}
                    </span>
                    <span>{ws}</span>
                  </div>
                  {workspace === ws && <Check className="w-3.5 h-3.5 text-[#295d36]" />}
                </button>
              ))}
              <div className="px-2 pt-2 pb-1 border-t border-[#e7ebe3] flex items-center gap-1.5 text-[10px] text-[#858d83]">
                <LockKeyhole className="w-3 h-3" />
                <span>Isolated workspace boundary</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Groups with UX styling */}
        <nav className="space-y-5 pt-1">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="hidden lg:block px-2 text-[10px] font-mono tracking-wider text-[#98a094] uppercase font-medium">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#edf5e8] text-[#2f633a] font-semibold shadow-2xs border-l-3 border-[#5c8b51]'
                          : 'text-[#50594f] hover:bg-[#f6f8f3] hover:text-[#202820]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3f7449]' : 'text-[#83907e]'}`} />
                        <span className="hidden lg:inline">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded-md bg-[#d9ebd1] text-[#315f3a] text-[10px] font-bold">
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

      {/* Sidebar Footer with Help and User Profile */}
      <div className="px-3 lg:px-4 space-y-3">
        {/* Help Card */}
        <div className="hidden lg:flex items-center justify-between p-2.5 rounded-xl border border-[#e8eee1] bg-[#f8faf5] cursor-pointer hover:border-[#dce2d7] transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#e7f1df] text-[#3f7449] flex items-center justify-center shrink-0">
              <CircleHelp className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#202820]">Need a hand?</span>
              <span className="text-[10px] text-[#858d83]">Explore policy guide</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#858d83]" />
        </div>

        {/* User Card */}
        <div className="pt-2 border-t border-[#e7ebe3] flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-[#3f7449] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {role === 'reviewer' ? 'SR' : role === 'creator' ? 'AM' : 'AD'}
            </span>
            <div className="hidden lg:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#202820] truncate">
                {role === 'reviewer' ? 'Sam Rivera' : role === 'creator' ? 'Alex Morgan' : 'Admin Director'}
              </span>
              <span className="text-[10px] text-[#858d83] capitalize">{role}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hidden lg:block text-[#858d83] hover:text-[#b8473c] p-1 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
