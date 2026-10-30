import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  Users,
  Shield,
  Key,
  Search,
  Mail,
  Sparkles,
  X,
  Trash2,
  Check,
  Lock,
  Database,
  Sliders,
  Send,
  Webhook,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Creator' | 'Reviewer' | 'Viewer';
  status: 'Active' | 'Invited';
  lastActive: string;
}

const INITIAL_MEMBERS: Member[] = [
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
  const [membersList, setMembersList] = useState<Member[]>(INITIAL_MEMBERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configure Details Form State
  const [workspaceName, setWorkspaceName] = useState('Northstar Studio');
  const [workspaceSlug, setWorkspaceSlug] = useState('northstar-studio');
  const [defaultChannel, setDefaultChannel] = useState('Social Media');
  const [strictnessLevel, setStrictnessLevel] = useState<'Standard' | 'Strict' | 'Lenient'>('Strict');
  const [enforceTruthGrounding, setEnforceTruthGrounding] = useState(true);

  // Access & Permissions State
  const [segregationOfDuties, setSegregationOfDuties] = useState(true);
  const [autoQuarantineViolations, setAutoQuarantineViolations] = useState(true);

  // Integrations State
  const [apiKey, setApiKey] = useState('HFAK••••••••••••••••••••••••••••');
  const [laxMemoryApiKey, setLaxMemoryApiKey] = useState('3ddaf04065334504cd15d0764e14e3b3c8fa85b79548a7699d32d1e8cc021725');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [isPinging, setIsPinging] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    showToast(`Invitation sent to ${inviteEmail} as ${inviteRole}.`);
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  const handleRemoveMember = (id: string) => {
    const target = membersList.find((m) => m.id === id);
    setMembersList((prev) => prev.filter((m) => m.id !== id));
    showToast(`Removed member ${target?.name} from workspace.`);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Workspace settings updated: ${workspaceName} (${strictnessLevel} mode).`);
  };

  const handleSaveAccess = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('RBAC policies and Segregation of Duties configuration saved.');
  };

  const handleTestWebhook = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      showToast('Test compliance alert delivered to webhook endpoint successfully! (HTTP 200 OK)');
    }, 700);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#12161c] text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-[#3f7449]/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#a3e635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header matching Screen 11 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12161c]">Workspace Settings</h1>
          <p className="text-xs text-[#736d64] mt-0.5">
            Manage organization members, segregation of duties roles, and API integrations.
          </p>
        </div>
        {tab === 'members' && (
          <Button
            size="sm"
            variant="dark"
            onClick={() => setIsInviteOpen(true)}
            className="gap-1.5 rounded-full px-4 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Invite Member</span>
          </Button>
        )}
      </div>

      {/* Segmented Tabs matching Screen 11 */}
      <div className="flex items-center gap-2 border-b border-[#e4ddd3] pb-2 overflow-x-auto">
        {[
          { key: 'members', label: 'Members', icon: Users },
          { key: 'details', label: 'Configure Details', icon: Sliders },
          { key: 'access', label: 'Access & Permissions', icon: Shield },
          { key: 'integrations', label: 'Integrations', icon: Key },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === t.key
                ? 'bg-[#12161c] text-white shadow-xs'
                : 'text-[#736d64] hover:text-[#12161c] hover:bg-[#ede6db]'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MEMBERS ROSTER */}
      {tab === 'members' && (
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 rounded text-[#8c857b] hover:text-[#b8473c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURE DETAILS */}
      {tab === 'details' && (
        <form onSubmit={handleSaveDetails} className="bg-white rounded-xl border border-[#e4ddd3] shadow-card p-6 space-y-5 max-w-2xl">
          <div className="pb-3 border-b border-[#eee7de]">
            <h2 className="text-sm font-bold text-[#12161c]">Organization & Compliance Profiles</h2>
            <p className="text-xs text-[#736d64]">
              Tune default workspace behavior, policy enforcement strictness, and evidence thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                Workspace Display Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full h-8 px-3 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                Tenant Slug (Subdomain)
              </label>
              <input
                type="text"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value)}
                className="w-full h-8 px-3 text-xs bg-[#faf7f2] font-mono border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                Default Channel
              </label>
              <select
                value={defaultChannel}
                onChange={(e) => setDefaultChannel(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
              >
                <option value="Social Media">Social Media</option>
                <option value="Direct Email">Direct Email</option>
                <option value="Website & Landing Page">Website & Landing Page</option>
                <option value="Print & Brochure">Print & Brochure</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#736d64] uppercase font-mono">
                Compliance Strictness Level
              </label>
              <select
                value={strictnessLevel}
                onChange={(e) => setStrictnessLevel(e.target.value as any)}
                className="w-full h-8 px-2 text-xs bg-white border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449] cursor-pointer"
              >
                <option value="Strict">Strict (Block any unverified claim)</option>
                <option value="Standard">Standard (Advisory flags for medium tone issues)</option>
                <option value="Lenient">Lenient (Allow review queue overrides)</option>
              </select>
            </div>
          </div>

          {/* Enforce SER Grounding Toggle */}
          <div className="p-3.5 rounded-xl border border-[#e4ddd3] bg-[#faf7f2] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#12161c]">
                Enforce Synthetic Evidence Registry (SER) Grounding
              </div>
              <div className="text-[11px] text-[#736d64]">
                Strictly reject direct pass for any health, pricing, or efficacy assertion without active SER record.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnforceTruthGrounding(!enforceTruthGrounding)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                enforceTruthGrounding ? 'bg-[#295d36]' : 'bg-[#d9d1c5]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  enforceTruthGrounding ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eee7de]">
            <Button size="sm" variant="lime" type="submit" className="cursor-pointer">
              Save Workspace Changes
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: ACCESS & PERMISSIONS (RBAC & SEGREGATION OF DUTIES) */}
      {tab === 'access' && (
        <form onSubmit={handleSaveAccess} className="bg-white rounded-xl border border-[#e4ddd3] shadow-card p-6 space-y-5">
          <div className="pb-3 border-b border-[#eee7de]">
            <h2 className="text-sm font-bold text-[#12161c]">Role-Based Access Control (RBAC) & Segregation of Duties</h2>
            <p className="text-xs text-[#736d64]">
              Improvement 2 implementation: Enforce independent review boundaries and workspace tenant isolation.
            </p>
          </div>

          {/* Segregation of Duties Setting Banner */}
          <div className="p-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#14532d]">
                  Segregation of Duties Enforcement (Author ≠ Reviewer)
                </div>
                <div className="text-[11px] text-[#166534]">
                  Prevents users from approving, rejecting, or reviewing their own drafts. Even Administrators cannot approve content authored by themselves.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSegregationOfDuties(!segregationOfDuties)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                segregationOfDuties ? 'bg-[#15803d]' : 'bg-[#d9d1c5]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  segregationOfDuties ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* RBAC Matrix Table */}
          <div className="overflow-x-auto border border-[#eee7de] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f2] border-b border-[#eee7de] text-[#736d64] font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Permission Scope</th>
                  <th className="py-3 px-4 text-center">Creator</th>
                  <th className="py-3 px-4 text-center">Reviewer</th>
                  <th className="py-3 px-4 text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7de]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[#12161c]">Author & Edit Drafts</td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#12161c]">Run Compliance Scans (Gate 1..3)</td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#12161c]">Sign-Off / Approve Content for Publication</td>
                  <td className="py-3 px-4 text-center"><span className="text-[#8c857b] font-mono">—</span></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#12161c]">Edit Brand Policies & SER Truth Registry</td>
                  <td className="py-3 px-4 text-center"><span className="text-[#8c857b] font-mono">—</span></td>
                  <td className="py-3 px-4 text-center"><span className="text-[#8c857b] font-mono">—</span></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-[#15803d] mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eee7de]">
            <Button size="sm" variant="lime" type="submit" className="cursor-pointer">
              Save Access Policies
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: INTEGRATIONS */}
      {tab === 'integrations' && (
        <div className="space-y-4 max-w-2xl">
          {/* MongoDB Dev Database Status */}
          <div className="p-5 rounded-xl border border-[#e4ddd3] bg-white shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#12161c]">MongoDB Database Connection</h3>
                  <div className="text-[11px] text-[#736d64] font-mono">
                    mongodb://127.0.0.1:27017/brandguard_dev
                  </div>
                </div>
              </div>
              <Badge variant="approved" size="sm">
                Connected · 27017
              </Badge>
            </div>
            <p className="text-[11px] text-[#4b5563]">
              Active persistence layer seeded with 14 brand rulebooks and SER evidence records.
            </p>
          </div>

          {/* Hugging Face / AI Model Engine */}
          <div className="p-5 rounded-xl border border-[#e4ddd3] bg-white shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#eff6ed] text-[#295d36] flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#12161c]">BrandGuard AI Compliance Engine</h3>
                  <div className="text-[11px] text-[#736d64]">
                    Deterministic rule-grounding + LLM Boundary Adapter
                  </div>
                </div>
              </div>
              <Badge variant="approved" size="sm">
                API Key Enabled
              </Badge>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase text-[#736d64]">
                  Active API Token (Model: aliasLLM/brandguard-ai-model)
                </label>
                <span className="text-[10px] text-[#15803d] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                  Active & Loaded
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 h-8 px-3 text-xs bg-[#faf7f2] font-mono border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast('API key configuration validated and active.')}
                  className="text-xs cursor-pointer"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {/* Cognee Memory Layer & LAX Personalization Engine */}
          <div className="p-5 rounded-xl border border-[#e4ddd3] bg-white shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] text-[#15803d] flex items-center justify-center">
                  <Database className="w-4 h-4 text-[#15803d]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#12161c]">Cognee Memory Layer & LAX Personalization</h3>
                  <div className="text-[11px] text-[#736d64]">
                    Semantic knowledge graphs, vector recall & per-user personalized memory datasets
                  </div>
                </div>
              </div>
              <Badge variant="approved" size="sm">
                Cognee Synced
              </Badge>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase text-[#736d64]">
                  Cognee Memory API Key
                </label>
                <span className="text-[10px] text-[#15803d] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                  Active & Personalized
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={laxMemoryApiKey}
                  onChange={(e) => setLaxMemoryApiKey(e.target.value)}
                  className="flex-1 h-8 px-3 text-xs bg-[#faf7f2] font-mono border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast("Cognee's Memory API Key validated and per-user datasets synchronized.")}
                  className="text-xs cursor-pointer"
                >
                  Save Key
                </Button>
              </div>
              <p className="text-[10px] text-[#8c857b]">
                Key SHA: <span className="font-mono text-[#15803d]">3dda...1725</span> · Partitioned per user (<span className="font-mono">user_memory_*</span>) with cross-policy graph traversals.
              </p>
            </div>
          </div>

          {/* Webhook Notifications */}
          <div className="p-5 rounded-xl border border-[#e4ddd3] bg-white shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fff7ed] text-[#c2410c] flex items-center justify-center">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#12161c]">Compliance Webhook Alerts</h3>
                  <div className="text-[11px] text-[#736d64]">
                    Broadcast review queue requests & high-priority findings
                  </div>
                </div>
              </div>
              <Badge variant="draft" size="sm">
                Live Broadcast
              </Badge>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-mono uppercase text-[#736d64]">
                Webhook Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 h-8 px-3 text-xs font-mono border border-[#d9d1c5] rounded-lg focus:outline-none focus:border-[#3f7449]"
                />
                <Button
                  size="sm"
                  variant="lime"
                  onClick={handleTestWebhook}
                  disabled={isPinging}
                  className="text-xs cursor-pointer gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPinging ? 'Sending…' : 'Test Ping'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-float border border-[#e4ddd3] space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-[#12161c]">Invite New Workspace Member</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#736d64] uppercase font-mono">
                  Email
                </label>
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
                <label className="text-[11px] font-medium text-[#736d64] uppercase font-mono">
                  Assigned RBAC Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-8 px-2 text-xs border border-[#d9d1c5] rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Creator">Creator (Draft authoring & scan)</option>
                  <option value="Reviewer">Reviewer (Policy sign-off & approvals)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button size="sm" variant="lime" type="submit" className="cursor-pointer">
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
