import React from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Building2, ChevronDown } from 'lucide-react';

export const WorkspaceSwitcher: React.FC = () => {
  const { workspace, workspaces, setWorkspace } = useWorkspace();

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 h-7 px-2.5 rounded-[6px] border border-[#d4d4d4] bg-white hover:border-[#141414] transition-colors text-xs text-[#0a0a0a]">
        <Building2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
        <select
          value={workspace.id}
          onChange={(e) => setWorkspace(e.target.value)}
          aria-label="Select Active Workspace"
          className="bg-transparent font-medium text-xs focus:outline-none cursor-pointer pr-4 appearance-none"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.plan})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-[#6b6b6b] pointer-events-none -ml-4" />
      </div>
    </div>
  );
};
