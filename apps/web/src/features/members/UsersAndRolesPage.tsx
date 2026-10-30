import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Mail,
  UserCheck,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  Clock,
  Send,
  Loader2,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { api } from '../../lib/apiClient';

interface MemberItem {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'reviewer' | 'creator';
  status: string;
  joinedAt?: string;
}

interface InvitationItem {
  invitationId: string;
  email: string;
  role: 'admin' | 'reviewer' | 'creator';
  status: 'pending';
  expiresAt: string;
  createdAt?: string;
}

const DEFAULT_MEMBERS: MemberItem[] = [
  {
    userId: 'usr_alex_creator',
    email: 'creator@brandguard.demo',
    displayName: 'Alex Morgan',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'creator',
    status: 'active',
    joinedAt: '2026-10-25T10:00:00Z',
  },
  {
    userId: 'usr_marcus_reviewer',
    email: 'reviewer@brandguard.demo',
    displayName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'reviewer',
    status: 'active',
    joinedAt: '2026-10-26T11:30:00Z',
  },
  {
    userId: 'usr_elena_admin',
    email: 'admin@brandguard.demo',
    displayName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-10-20T08:00:00Z',
  },
];

export const UsersAndRolesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, isAdmin } = useAuth();
  const { workspace } = useWorkspace();

  const [members, setMembers] = useState<MemberItem[]>(DEFAULT_MEMBERS);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'creator' | 'reviewer' | 'admin'>('creator');
  const [isInviting, setIsInviting] = useState(false);

  // Change Role Modal
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [newRole, setNewRole] = useState<'creator' | 'reviewer' | 'admin'>('creator');
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Remove Member Confirm Modal
  const [memberToRemove, setMemberToRemove] = useState<MemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadMembers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await api.getMembers(workspace?.id);
      if (res.members && Array.isArray(res.members)) {
        setMembers(
          res.members.map((m: any) => ({
            userId: m.userId,
            email: m.email,
            displayName: m.displayName || m.email.split('@')[0],
            avatarUrl: m.avatarUrl,
            role: m.role,
            status: 'active',
            joinedAt: m.joinedAt,
          }))
        );
      }
      if (res.invitations && Array.isArray(res.invitations)) {
        setInvitations(res.invitations);
      }
    } catch (err: any) {
      console.warn('Could not load members from server, using local default:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, workspace?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);

    try {
      const res = await api.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (res.status === 'active') {
        showToast(`Existing user ${inviteEmail} was assigned role '${inviteRole}' in this workspace.`);
      } else {
        showToast(`Invitation sent to ${inviteEmail} as '${inviteRole}'.`);
      }
      setInviteEmail('');
      setIsInviteModalOpen(false);
      await loadMembers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send invitation', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsChangingRole(true);

    try {
      await api.changeMemberRole(selectedMember.userId, newRole);
      showToast(`Updated role for ${selectedMember.displayName} to '${newRole}'.`);
      setSelectedMember(null);
      await loadMembers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update role', 'error');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);

    try {
      await api.removeMember(memberToRemove.userId);
      showToast(`Removed ${memberToRemove.displayName} from this workspace.`);
      setMemberToRemove(null);
      await loadMembers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove member', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    try {
      await api.revokeInvitation(invitationId);
      showToast(`Revoked invitation for ${email}.`);
      await loadMembers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to revoke invitation', 'error');
    }
  };

  // If not Admin, show restricted notice
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">Administrator Permission Required</h2>
        <p className="text-sm text-[#6b7280] max-w-md mx-auto leading-relaxed">
          User and Role Management is restricted to Workspace Administrators. Your current role in this workspace is <strong className="capitalize text-[#1e4a2b] font-semibold">{role}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2.5 border ${
              toastMessage.type === 'error'
                ? 'bg-[#181111] text-[#fca5a5] border-[#b91c1c]/50'
                : 'bg-[#12161c] text-white border-[#22c55e]/50'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[10px] font-mono tracking-widest text-[#1e5438] uppercase font-bold">
              WORKSPACE GOVERNANCE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] mt-0.5">
            Users & Role Management
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Manage authorized identities, invite team members by email, and assign segregated permissions for {workspace?.name || 'Acme Cloud Platform'}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#86efac]" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Role Capabilities Reference Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-[#fbfcfa] rounded-2xl border border-[#e7ebe3] p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold uppercase tracking-wider border border-[#bae6fd]">
              Creator
            </span>
            <span className="text-[10px] text-[#6b7280]">Alex Morgan demo</span>
          </div>
          <p className="text-xs font-semibold text-[#111827]">Author & Submit Content</p>
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            Create and edit drafts, run AI compliance scans, review suggested fixes. Cannot approve own content or manage policies.
          </p>
        </div>

        <div className="bg-[#fbfcfa] rounded-2xl border border-[#e7ebe3] p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-bold uppercase tracking-wider border border-[#fde68a]">
              Reviewer
            </span>
            <span className="text-[10px] text-[#6b7280]">Marcus Vance demo</span>
          </div>
          <p className="text-xs font-semibold text-[#111827]">Verify Evidence & Approve</p>
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            Inspect pending drafts and evidence citations, approve, reject with reasons, request changes. Segregation of duties enforced.
          </p>
        </div>

        <div className="bg-[#fbfcfa] rounded-2xl border border-[#e7ebe3] p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] text-[10px] font-bold uppercase tracking-wider border border-[#a7f3d0]">
              Admin
            </span>
            <span className="text-[10px] text-[#6b7280]">Elena Rostova demo</span>
          </div>
          <p className="text-xs font-semibold text-[#111827]">Full Workspace Governance</p>
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            Invite users, assign roles, configure brand policies, manage approved facts, and monitor cryptographic audit integrity.
          </p>
        </div>
      </div>

      {/* Active Workspace Members Section */}
      <div className="bg-white rounded-3xl border border-[#e7ebe3] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e7ebe3] flex items-center justify-between bg-[#fafbf9]">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#1e4a2b]" />
            <h2 className="text-sm font-bold text-[#111827]">
              Active Workspace Members ({members.length})
            </h2>
          </div>
          <span className="text-[11px] text-[#6b7280] hidden sm:inline">
            Role modifications take effect immediately on next server request
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-[#fafbf9] transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1e4a2b] text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                        ) : (
                          m.displayName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-[#111827] block">{m.displayName}</span>
                        {m.userId === user?.id && (
                          <span className="text-[10px] text-[#10b981] font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 font-mono text-[#4b5563] text-[11px]">
                    {m.email}
                  </td>

                  {/* Role Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${
                        m.role === 'admin'
                          ? 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]'
                          : m.role === 'reviewer'
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                          : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{m.role}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                      <span>Active</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setNewRole(m.role);
                        }}
                        className="p-1.5 rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                        title="Change Member Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberToRemove(m)}
                        className="p-1.5 rounded-lg border border-[#e5e7eb] text-[#ef4444] hover:text-[#b91c1c] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                        title="Remove Member from Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white rounded-3xl border border-[#e7ebe3] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e7ebe3] flex items-center justify-between bg-[#fafbf9]">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#1e4a2b]" />
            <h2 className="text-sm font-bold text-[#111827]">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          <span className="text-[11px] text-[#6b7280]">
            Invitations expire automatically after 7 days
          </span>
        </div>

        {invitations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#374151]">No pending invitations</p>
            <p className="text-[11px] text-[#9ca3af] max-w-sm mx-auto">
              When you invite an email address that doesn't have an active account yet, it will appear here until they accept.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-5">Invited Email</th>
                  <th className="py-3 px-4">Invited Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {invitations.map((inv) => (
                  <tr key={inv.invitationId} className="hover:bg-[#fafbf9] transition-colors">
                    <td className="py-3 px-5 font-mono text-[#111827]">{inv.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f3f4f6] text-[#374151]">
                        {inv.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#d97706] font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#d97706]" />
                        <span>Pending acceptance</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6b7280] text-[11px]">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv.invitationId, inv.email)}
                        className="px-2.5 py-1 rounded-lg border border-[#fee2e2] text-[#dc2626] hover:bg-[#fef2f2] text-xs transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Invite New Member                               */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsInviteModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#e7ebe3] shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#e7ebe3] flex items-center justify-between bg-[#fafbf9]">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Invite Team Member</h3>
                  <p className="text-xs text-[#6b7280]">
                    Assign a role and grant access to {workspace?.name || 'this workspace'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#374151] block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@acme.brand"
                      required
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#d1d5db] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#1e4a2b] focus:ring-2 focus:ring-[#1e4a2b]/15"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#374151] block">
                    Assigned Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'creator', label: 'Creator', desc: 'Create drafts' },
                      { key: 'reviewer', label: 'Reviewer', desc: 'Review & approve' },
                      { key: 'admin', label: 'Admin', desc: 'Manage team' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setInviteRole(opt.key as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          inviteRole === opt.key
                            ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46] shadow-xs'
                            : 'bg-white border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]'
                        }`}
                      >
                        <span className="block font-bold text-xs">{opt.label}</span>
                        <span className="block text-[10px] text-[#6b7280] mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f3f4f6] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-5 py-2 rounded-xl bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: Change Member Role                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedMember(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#e7ebe3] shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#e7ebe3] flex items-center justify-between bg-[#fafbf9]">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Change Member Role</h3>
                  <p className="text-xs text-[#6b7280]">
                    Modify permissions for {selectedMember.displayName} ({selectedMember.email}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangeRoleSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#374151] block">
                    Select New Role
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'creator', label: 'Creator', desc: 'Can author drafts, run analysis, review fixes. Cannot approve.' },
                      { key: 'reviewer', label: 'Reviewer', desc: 'Can inspect queue, approve/reject submissions with reasons.' },
                      { key: 'admin', label: 'Admin', desc: 'Full permissions including policy and member management.' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setNewRole(opt.key as any)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          newRole === opt.key
                            ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46] shadow-xs'
                            : 'bg-white border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]'
                        }`}
                      >
                        <div>
                          <span className="block font-bold text-xs capitalize">{opt.label}</span>
                          <span className="block text-[11px] text-[#6b7280] mt-0.5">{opt.desc}</span>
                        </div>
                        {newRole === opt.key && <UserCheck className="w-4 h-4 text-[#10b981] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f3f4f6] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingRole}
                    className="px-5 py-2 rounded-xl bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isChangingRole ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Role</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 3: Confirm Remove Member                          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {memberToRemove && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMemberToRemove(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#e7ebe3] shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Remove {memberToRemove.displayName}?
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                  Are you sure you want to revoke <strong className="text-[#111827]">{memberToRemove.email}</strong>'s access to this workspace? Their historical audit records will remain preserved.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                  className="px-5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Confirm Removal</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
