import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Check,
  CircleHelp,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { BrandGuardLogo } from '../ui/BrandGuardLogo';

export const NAV_WORKFLOW_GROUPS = [
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

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const { workspace, workspaces, setWorkspace } = useWorkspace();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <aside
      aria-label="Main Navigation"
      className={`hidden md:flex flex-col justify-between shrink-0 select-none bg-white border-r border-[#e7ebe3] text-[#202820] z-20 py-4 transition-[width] duration-200 ease-in-out relative ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="px-3 flex-1 flex flex-col min-h-0">
        {/* Brand Lockup & Collapse Trigger (Zero Overlap in Collapsed & Expanded Modes) */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mb-4">
            <div
              onClick={() => navigate('/dashboard')}
              className="cursor-pointer group p-0.5 rounded-xl hover:bg-[#f1f4ee] transition-all flex items-center justify-center"
              title="BrandGuard AI Home"
            >
              <BrandGuardLogo size="sm" />
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6a7468] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors cursor-pointer"
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 mb-4">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              title="BrandGuard AI Home"
            >
              <BrandGuardLogo size="md" />
              <div className="flex flex-col min-w-0 animate-in fade-in duration-150">
                <span className="font-playfair font-bold text-sm tracking-tight text-[#202820] leading-tight truncate">
                  BrandGuard <span className="text-[#295d36] font-extrabold">AI</span>
                </span>
                <span className="text-[9px] text-[#858d83] font-medium tracking-wider uppercase truncate">
                  Compliance Console
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[#858d83] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors shrink-0 cursor-pointer"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Action Button: New Content Review */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/drafts/new')}
            className={`w-full rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white font-semibold flex items-center shadow-2xs transition-all cursor-pointer ${
              isCollapsed
                ? 'h-9 justify-center p-0'
                : 'h-9 px-3.5 justify-center gap-2 text-xs'
            }`}
            title="Start New Content Review"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>New Content Review</span>}
          </button>
        </div>

        {/* Workspace Selector (Expanded view) */}
        {!isCollapsed && (
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center justify-between w-full p-2 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] hover:bg-white hover:border-[#dce2d7] transition-all text-left text-xs"
              aria-expanded={workspaceOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#e4efdd] text-[#295d36] font-bold flex items-center justify-center shrink-0 text-xs">
                  {workspace?.name?.[0] || 'W'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[#202820] truncate text-[11px]">
                    {workspace?.name || 'Workspace'}
                  </span>
                  <span className="text-[9px] text-[#858d83]">{workspace?.plan || 'Enterprise'}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#858d83] shrink-0" />
            </button>

            {workspaceOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 p-1.5 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setWorkspace(ws.id);
                      setWorkspaceOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#f7f8f5] text-[#202820] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded bg-[#e4efdd] text-[#295d36] font-semibold text-[10px] flex items-center justify-center shrink-0">
                        {ws.name[0]}
                      </span>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {workspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-[#295d36] shrink-0" />}
                  </button>
                ))}
                <div className="px-2 pt-1.5 pb-1 border-t border-[#e7ebe3] flex items-center gap-1.5 text-[10px] text-[#858d83]">
                  <LockKeyhole className="w-3 h-3 shrink-0" />
                  <span>Isolated tenant boundary</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 custom-scrollbar">
          {NAV_WORKFLOW_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 text-[10px] font-mono tracking-wider text-[#98a094] uppercase font-medium truncate">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      title={isCollapsed ? item.name : undefined}
                      className={`group relative flex items-center rounded-xl text-xs font-medium transition-all ${
                        isCollapsed
                          ? 'h-9 w-9 mx-auto justify-center'
                          : 'px-3 py-2 justify-between'
                      } ${
                        isActive
                          ? 'bg-[#edf5e8] text-[#24512e] font-semibold border-l-3 border-[#5c8b51] shadow-2xs'
                          : 'text-[#50594f] hover:bg-[#f6f8f3] hover:text-[#202820]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#3f7449]' : 'text-[#83907e] group-hover:text-[#202820]'}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#d9ebd1] text-[#315f3a] text-[10px] font-bold shrink-0">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Collapsed Rail */}
                      {isCollapsed && (
                        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-2 py-1 rounded-md bg-[#12161c] text-white text-xs font-normal whitespace-nowrap shadow-lg pointer-events-none animate-in fade-in duration-100">
                          {item.name}
                          {item.badge && (
                            <span className="ml-1.5 px-1 py-0.2 rounded bg-white/20 text-[10px]">
                              {item.badge}
                            </span>
                          )}
                        </div>
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
      <div className="px-3 pt-3 border-t border-[#e7ebe3] space-y-2">
        {!isCollapsed && (
          <div
            onClick={() => navigate('/policies')}
            className="flex items-center justify-between p-2 rounded-xl border border-[#e8eee1] bg-[#f8faf5] cursor-pointer hover:border-[#3f7449] hover:bg-[#eff6ed] transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#e7f1df] text-[#3f7449] group-hover:bg-[#295d36] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <CircleHelp className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-[#202820] group-hover:text-[#295d36] truncate">Need guidance?</span>
                <span className="text-[9px] text-[#858d83] truncate">Browse policy rules</span>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#858d83] group-hover:translate-x-0.5 group-hover:text-[#295d36] transition-all shrink-0" />
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-full bg-[#3f7449] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {role === 'reviewer' ? 'SR' : role === 'creator' ? 'AM' : 'AD'}
            </span>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#202820] truncate">
                  {role === 'reviewer' ? 'Sam Rivera' : role === 'creator' ? 'Alex Morgan' : 'Admin Director'}
                </span>
                <span className="text-[10px] text-[#858d83] capitalize">{role}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#858d83] hover:text-[#b8473c] p-1 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
