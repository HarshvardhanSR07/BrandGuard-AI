import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Users, Shield, Key, Search, Mail } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Creator' | 'Reviewer' | 'Viewer';
  status: 'Active' | 'Invited';
  lastActive: string;
}

const MEMBERS: Member[] = [
  { id: '1', name: 'Jane Doe', email: 'jane@acme.com', role: 'Admin', status: 'Active', lastActive: '2h ago' },
  { id: '2', name: 'Alex Kim', email: 'alex@acme.com', role: 'Creator', status: 'Active', lastActive: '1h ago' },
  { id: '3', name: 'Sam Taylor', email: 'sam@acme.com', role: 'Reviewer', status: 'Active', lastActive: '5m ago' },
  { id: '4', name: 'Morgan Lee', email: 'morgan@acme.com', role: 'Creator', status: 'Active', lastActive: '1d ago' },
  { id: '5', name: 'Riley Chen', email: 'riley@acme.com', role: 'Reviewer', status: 'Active', lastActive: '3d ago' },
  { id: '6', name: 'Chris Park', email: 'chris@acme.com', role: 'Viewer', status: 'Active', lastActive: '5d ago' },
];

export const WorkspacePage: React.FC = () => {
  const [tab, setTab] = useState<'members' | 'details' | 'access' | 'integrations'>('members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Creator' | 'Reviewer' | 'Viewer'>('Creator');
  const [membersList, setMembersList] = useState<Member[]>(MEMBERS);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setMembersList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'Invited',
        lastActive: 'Just now',
      },
    ]);
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header matching Screen 11 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Workspace Settings</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Manage organization members, segregation of duties roles, and API integrations.
          </p>
        </div>
        <Button
          size="sm"
          variant="dark"
          onClick={() => setIsInviteOpen(true)}
          className="gap-1.5 rounded-full px-4 text-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Segmented Tabs matching Screen 11 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'members', label: 'Members' },
          { key: 'details', label: 'Configure Details' },
          { key: 'access', label: 'Access & Permissions' },
          { key: 'integrations', label: 'Integrations' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              tab === t.key
                ? 'bg-[#12161c] text-white shadow-xs'
                : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Members Roster Card matching Screen 11 */}
      <div className="bg-white rounded-xl border border-[#e4ddd3] shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#eee7de] flex items-center justify-between">
          <span className="text-xs font-bold text-[#12161c]">
            Workspace Members ({membersList.length})
          </span>
          <span className="text-[11px] text-[#736d64]">
            Enforcing Segregation of Duties (Author ≠ Reviewer)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf7f2] border-b border-[#eee7de] text-[#736d64] font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7de]">
              {membersList.map((m) => (
                <tr key={m.id} className="hover:bg-[#faf7f2] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#12161c] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#12161c] text-[#a3e635] flex items-center justify-center font-bold text-[10px]">
                      {m.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[#4b5563] font-mono">{m.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        m.role === 'Admin'
                          ? 'bg-[#12161c] text-white'
                          : m.role === 'Reviewer'
                          ? 'bg-[#a3e635]/20 text-[#15803d] border border-[#a3e635]'
                          : 'bg-[#ede6db] text-[#12161c]'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={m.status === 'Active' ? 'active' : 'draft'} size="sm">
                      {m.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[#736d64] tabular-nums">{m.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-float border border-[#e4ddd3] space-y-4">
            <h3 className="text-sm font-bold text-[#12161c]">Invite New Workspace Member</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#736d64] uppercase">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acme.com"
                  required
                  className="w-full h-8 px-3 text-xs border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#736d64] uppercase">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-8 px-2 text-xs border border-[#d9d1c5] rounded-lg focus:outline-none"
                >
                  <option value="Creator">Creator (Draft authoring)</option>
                  <option value="Reviewer">Reviewer (Policy review & approval)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="lime" type="submit">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
