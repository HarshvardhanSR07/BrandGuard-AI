import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  ArrowRight,
  ShieldCheck,
  X,
  CornerDownLeft,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Pages' | 'Drafts' | 'Actions' | 'Ground Truth';
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  path: string;
  action?: () => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Pages
  { id: 'p-dash', title: 'Dashboard', subtitle: 'Executive overview, health & metrics', category: 'Pages', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'p-drafts', title: 'Content Review', subtitle: 'Marketing copy drafts & revision editor', category: 'Pages', icon: FileText, path: '/drafts', badge: '6' },
  { id: 'p-analysis', title: 'Findings & Analysis', subtitle: 'Live compliance gates & AI telemetry', category: 'Pages', icon: Sparkles, path: '/analysis', badge: '4' },
  { id: 'p-policies', title: 'Brand Policies', subtitle: 'Active rulebooks & terminology standards', category: 'Pages', icon: BookOpen, path: '/policies' },
  { id: 'p-facts', title: 'Approved Facts', subtitle: 'Synthetic Evidence Registry (SER) truth', category: 'Pages', icon: FileCheck2, path: '/approved-facts' },
  { id: 'p-review', title: 'Review Queue', subtitle: 'Multi-role approval workstation', category: 'Pages', icon: CheckCheck, path: '/review', badge: '3' },
  { id: 'p-audit', title: 'Audit Trail', subtitle: 'Cryptographic SHA-256 event chain', category: 'Pages', icon: Fingerprint, path: '/audit' },
  { id: 'p-gov', title: 'Governance Insights', subtitle: 'Recurring violation clustering & analytics', category: 'Pages', icon: Activity, path: '/governance' },
  { id: 'p-settings', title: 'Workspace Settings', subtitle: 'Tenant boundaries & API keys', category: 'Pages', icon: Settings2, path: '/settings' },

  // Actions
  { id: 'a-new', title: 'Start New Content Review', subtitle: 'Open draft editor for fresh campaign copy', category: 'Actions', icon: Plus, path: '/drafts/new' },
  { id: 'a-verify', title: 'Verify Audit Chain Integrity', subtitle: 'Recalculate cryptographic SHA-256 chain', category: 'Actions', icon: ShieldCheck, path: '/audit' },

  // Drafts
  { id: 'd-204', title: 'DRF-204: Summer Campaign - Social', subtitle: 'VerdantCo · Social · 3 findings pending', category: 'Drafts', icon: FileText, path: '/drafts/edit?id=DRF-204', badge: 'Draft' },
  { id: 'd-202', title: 'DRF-202: Product Brochure v2', subtitle: 'VerdantCo · Brochure · Brand Approved', category: 'Drafts', icon: FileText, path: '/drafts/edit?id=DRF-202', badge: 'Approved' },
  { id: 'd-203', title: 'DRF-203: Email - New Pricing & Investment', subtitle: 'NorthstarFin · Email · Changes Requested', category: 'Drafts', icon: FileText, path: '/drafts/edit?id=DRF-203', badge: 'Medium' },
  { id: 'd-199', title: 'DRF-199: Event Flyer - Fall Keynote', subtitle: 'BrightPath · Print · Draft state', category: 'Drafts', icon: FileText, path: '/drafts/edit?id=DRF-199', badge: 'Draft' },
];

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = query.trim()
    ? COMMAND_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMAND_ITEMS;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      item.action();
    }
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Menu"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#e7ebe3] overflow-hidden text-[#202820] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e7ebe3] bg-[#fbfcfa]">
          <Search className="w-4 h-4 text-[#858d83] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages, drafts, policies…"
            className="flex-1 bg-transparent text-sm text-[#202820] placeholder-[#858d83] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#858d83] hover:text-[#202820] hover:bg-[#f1f4ee] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#858d83]">
              No matching pages, drafts, or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#edf5e8] text-[#24512e] font-semibold ring-1 ring-[#5c8b51]/30'
                      : 'text-[#303830] hover:bg-[#f6f8f3]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#295d36] text-white shadow-2xs'
                          : 'bg-[#eef4ea] text-[#3f7449]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f1f4ee] text-[#858d83] font-mono">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#858d83] truncate font-normal">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#d9ebd1] text-[#315f3a] text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#295d36]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#fbfcfa] border-t border-[#e7ebe3] flex items-center justify-between text-[11px] text-[#858d83]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] font-mono text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] font-mono text-[10px]">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#f1f4ee] border border-[#e7ebe3] font-mono text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
          <span className="hidden sm:inline font-medium">BrandGuard AI Navigator</span>
        </div>
      </div>
    </div>
  );
};
