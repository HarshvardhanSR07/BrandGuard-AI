import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/apiClient';
import {
  Play,
  ArrowRight,
  TrendingUp,
  Shield,
  FileText,
  Mail,
  Globe,
  BookOpen,
  Monitor,
  FileCheck2,
  Folder,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  MoreVertical,
  Plus,
  Lightbulb,
  Edit3,
  Copy,
  ExternalLink,
  Palette,
  Activity,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';

interface Campaign {
  id: string;
  title: string;
  category: string;
  timeSpent: string;
  grade: string;
  score: number;
  progress: number;
  status: 'Completed' | 'In review' | 'Needs review';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  content: string;
  issues: number;
}

interface Finding {
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  detail: string;
  source: string;
  fix: string;
}

export interface BrandProfileData {
  brandName: string;
  industry: string;
  description: string;
  status: 'Verified' | 'Draft' | 'Needs Review';
  toneOfVoice: string;
  personality: string[];
  communicationStyle: string;
  colors: {
    primary: { name: string; hex: string };
    secondary: { name: string; hex: string };
    accent: { name: string; hex: string };
  };
  approvedTerms: string[];
  prohibitedTerms: string[];
  requiredDisclaimers: string[];
  activePolicyCount: number;
  approvedFactsCount: number;
  lastUpdated: string;
}

const DEFAULT_BRAND_PROFILES: Record<string, BrandProfileData> = {
  ws_acme_global: {
    brandName: 'Acme Cloud Platform',
    industry: 'Enterprise Cloud & B2B SaaS',
    description: 'Next-generation verified cloud infrastructure and developer automation platform.',
    status: 'Verified',
    toneOfVoice: 'Authoritative, accessible & precise',
    personality: ['Empirical', 'Sophisticated', 'Direct'],
    communicationStyle: 'High-clarity technical precision without hyperbole',
    colors: {
      primary: { name: 'Forest Deep', hex: '#0F2A1A' },
      secondary: { name: 'Emerald Leaf', hex: '#15803D' },
      accent: { name: 'Luminous Mint', hex: '#86EFAC' },
    },
    approvedTerms: ['Verified SLA', 'Multi-Region Resilience', 'Summer Edit'],
    prohibitedTerms: ['100% Infallible', 'Unbreakable Guarantee', 'Cheap'],
    requiredDisclaimers: ['Standard SLA Footnote', 'FTC Truth Benchmark'],
    activePolicyCount: 4,
    approvedFactsCount: 18,
    lastUpdated: 'Oct 28, 2026',
  },
  ws_horizon_fintech: {
    brandName: 'Horizon FinTech',
    industry: 'Financial Technology & Global Payments',
    description: 'Institutional-grade clearing, cross-border settlement, and multi-currency treasury operations.',
    status: 'Verified',
    toneOfVoice: 'Prudent, transparent & institutional',
    personality: ['Compliant', 'Institutional', 'Transparent'],
    communicationStyle: 'Factual, risk-aware, and audited terminology',
    colors: {
      primary: { name: 'Midnight Navy', hex: '#0B1F2E' },
      secondary: { name: 'Cobalt Royal', hex: '#1D4ED8' },
      accent: { name: 'Sky Luminous', hex: '#60A5FA' },
    },
    approvedTerms: ['SEC Registered', 'SIPC Protected', 'SOC2 Type II'],
    prohibitedTerms: ['Guaranteed Returns', 'Risk-Free Investment', 'Free Money'],
    requiredDisclaimers: ['FINRA/SIPC Regulatory Notice', 'Past Performance Warning'],
    activePolicyCount: 6,
    approvedFactsCount: 24,
    lastUpdated: 'Oct 25, 2026',
  },
  ws_bioshield: {
    brandName: 'BioShield Health',
    industry: 'Clinical Wellness & Nutraceuticals',
    description: 'Evidence-based clinical longevity solutions backed by peer-reviewed human trials.',
    status: 'Needs Review',
    toneOfVoice: 'Empirical, empathetic & grounded',
    personality: ['Clinical', 'Ethical', 'Grounded'],
    communicationStyle: 'Evidence-based clinical phrasing with mandatory FDA notices',
    colors: {
      primary: { name: 'Dark Spruce', hex: '#14291F' },
      secondary: { name: 'Jade Clinical', hex: '#059669' },
      accent: { name: 'Mint Health', hex: '#A7F3D0' },
    },
    approvedTerms: ['Clinically Studied', 'Non-GMO', 'Third-Party Verified'],
    prohibitedTerms: ['Miracle Cure', 'Instant Diagnosis', 'Guaranteed Healing'],
    requiredDisclaimers: ['FDA Standard Disclaimer STD', 'Doctor Consultation Notice'],
    activePolicyCount: 5,
    approvedFactsCount: 14,
    lastUpdated: 'Oct 29, 2026',
  },
};

const initialCampaigns: Campaign[] = [
  {
    id: 'DRF-204',
    title: 'Summer Campaign - Social',
    category: 'Social Media',
    timeSpent: '120 hours active',
    grade: '92/100',
    score: 92,
    progress: 92,
    status: 'Completed',
    icon: Globe,
    iconBg: 'bg-[#ecfdf5]',
    iconColor: 'text-[#16a34a]',
    content: 'Experience effortless comfort for sunny horizons. Thoughtfully engineered with 62% recycled fibers. Discover the summer edition.',
    issues: 1,
  },
  {
    id: 'DRF-202',
    title: 'Product Brochure v2',
    category: 'Print & Digital',
    timeSpent: '18 hours active',
    grade: '78/100',
    score: 78,
    progress: 78,
    status: 'In review',
    icon: BookOpen,
    iconBg: 'bg-[#f5f3ff]',
    iconColor: 'text-[#8b5cf6]',
    content: 'The most comfortable fit for every journey. Built with unmatched precision and guaranteed lifetime durability.',
    issues: 2,
  },
  {
    id: 'DRF-203',
    title: 'Email - New Pricing',
    category: 'Direct Email',
    timeSpent: '6 hours active',
    grade: '65/100',
    score: 65,
    progress: 65,
    status: 'Needs review',
    icon: Mail,
    iconBg: 'bg-[#fff7ed]',
    iconColor: 'text-[#ea580c]',
    content: 'Special member-exclusive rates valid until 31 October. Upgrade your plan and enjoy uninterrupted access.',
    issues: 3,
  },
  {
    id: 'DRF-205',
    title: 'Landing Page - Enterprise',
    category: 'Web Experience',
    timeSpent: '32 hours active',
    grade: '88/100',
    score: 88,
    progress: 88,
    status: 'Completed',
    icon: Monitor,
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#2563eb]',
    content: 'Enterprise-grade security and governance built for modern Fortune 500 brand marketing workflows.',
    issues: 1,
  },
  {
    id: 'DRF-206',
    title: 'Influencer Guidelines',
    category: 'Brand Governance',
    timeSpent: '12 hours active',
    grade: '73/100',
    score: 73,
    progress: 73,
    status: 'In review',
    icon: FileCheck2,
    iconBg: 'bg-[#fffbeb]',
    iconColor: 'text-[#d97706]',
    content: 'Mandatory FTC disclosure benchmarks and prohibited comparative claims for social ambassador partnerships.',
    issues: 2,
  },
];

const sampleFindings: Record<string, Finding[]> = {
  'DRF-202': [
    {
      severity: 'High',
      title: 'Unverified comparative claim',
      detail: '“The most comfortable fit” is a superlative without supporting approved evidence in the claims catalog.',
      source: 'Approved product claims · Evidence not found',
      fix: 'Replace with “Designed for everyday comfort” unless substantiating evidence is approved.',
    },
    {
      severity: 'High',
      title: 'Unsubstantiated durability guarantee',
      detail: '“Guaranteed lifetime durability” triggers Prohibited Claims policy Section 4.1.',
      source: 'Truth in Advertising Policy · v2.1',
      fix: 'Rephrase to “Crafted for longevity” with standard warranty link.',
    },
  ],
  'DRF-203': [
    {
      severity: 'High',
      title: 'Required offer disclaimer missing',
      detail: 'Promotional and pricing emails require the approved legal disclaimer before publication.',
      source: 'Promotional claims policy · Section 3.2',
      fix: 'Add the current approved offer disclaimer and verify the valid expiration date.',
    },
    {
      severity: 'Medium',
      title: 'Pricing validity date check',
      detail: 'Offer date 31 October must match approved campaign brief AUT-26.',
      source: 'Campaign brief · AUT-26',
      fix: 'Verify terms with marketing operations before sign-off.',
    },
  ],
  'DRF-204': [
    {
      severity: 'Low',
      title: 'Minor terminology preference',
      detail: 'Recommend using official model moniker “Summer Edit” over “summer edition”.',
      source: 'Brand language guidelines · v2.1',
      fix: 'Capitalize “Summer Edit” per product vocabulary catalog.',
    },
  ],
  'DRF-205': [
    {
      severity: 'Low',
      title: 'SLA disclaimer verification',
      detail: 'Enterprise uptime guarantees require standard footnote reference.',
      source: 'Legal terms v2.3',
      fix: 'Add footnote link to service level agreements page.',
    },
  ],
  'DRF-206': [
    {
      severity: 'Medium',
      title: 'FTC Disclosure placement',
      detail: 'Sponsored hashtag must appear in the first 3 lines of video caption.',
      source: 'Influencer Endorsement Policy · Section 2.1',
      fix: 'Explicitly enforce #Ad placement above the fold.',
    },
  ],
};

// 28 days of bar chart data
const barChartData = [
  { date: 'Jun 1', height: 42, active: false },
  { date: 'Jun 2', height: 28, active: false },
  { date: 'Jun 3', height: 35, active: false },
  { date: 'Jun 4', height: 48, active: false },
  { date: 'Jun 5', height: 52, active: false },
  { date: 'Jun 6', height: 40, active: false },
  { date: 'Jun 7', height: 58, active: false },
  { date: 'Jun 8', height: 45, active: false },
  { date: 'Jun 9', height: 50, active: false },
  { date: 'Jun 10', height: 60, active: false },
  { date: 'Jun 11', height: 48, active: false },
  { date: 'Jun 12', height: 55, active: false },
  { date: 'Jun 13', height: 68, active: false },
  { date: 'Jun 14', height: 85, active: true, scans: 28 }, // Peak highlighted
  { date: 'Jun 15', height: 62, active: false },
  { date: 'Jun 16', height: 54, active: false },
  { date: 'Jun 17', height: 49, active: false },
  { date: 'Jun 18', height: 58, active: false },
  { date: 'Jun 19', height: 64, active: false },
  { date: 'Jun 20', height: 42, active: false },
  { date: 'Jun 21', height: 50, active: false },
  { date: 'Jun 22', height: 46, active: false },
  { date: 'Jun 23', height: 55, active: false },
  { date: 'Jun 24', height: 60, active: false },
  { date: 'Jun 25', height: 52, active: false },
  { date: 'Jun 26', height: 48, active: false },
  { date: 'Jun 27', height: 44, active: false },
  { date: 'Jun 28', height: 50, active: false },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { workspace } = useWorkspace();

  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [filterType, setFilterType] = useState<'All' | 'Needs review' | 'Completed'>('All');
  const [progressTab, setProgressTab] = useState<'Scan Activity' | 'Compliance Score' | 'Issue Types'>('Scan Activity');
  const [activityTab, setActivityTab] = useState<'All' | 'Scans' | 'Approvals' | 'Comments'>('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editorCopy, setEditorCopy] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Brand Profiles State by Workspace
  const [brandProfiles, setBrandProfiles] = useState<Record<string, BrandProfileData>>(DEFAULT_BRAND_PROFILES);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const currentProfile = brandProfiles[workspace?.id || 'ws_acme_global'] || DEFAULT_BRAND_PROFILES.ws_acme_global;
  const [editForm, setEditForm] = useState<BrandProfileData>(currentProfile);

  // Sync editForm when workspace changes
  useEffect(() => {
    const prof = brandProfiles[workspace?.id || 'ws_acme_global'] || DEFAULT_BRAND_PROFILES.ws_acme_global;
    setEditForm(prof);
  }, [workspace?.id, brandProfiles]);

  const [analytics, setAnalytics] = useState<{
    draftsByStatus: Record<string, number>;
    findingsBySeverity: Record<string, number>;
    findingsByDisposition: Record<string, number>;
    recurring: Array<{ category: string; ruleKey: string | null; findings: number; draftCount: number }>;
  }>({
    draftsByStatus: { submitted: 3, approved: 14, changes_requested: 2, draft: 5 },
    findingsBySeverity: { high: 8, medium: 12, low: 4 },
    findingsByDisposition: { accepted: 18, dismissed: 6, open: 4 },
    recurring: [
      { category: 'claim_boundary', ruleKey: 'Verdant_R1', findings: 7, draftCount: 3 },
      { category: 'terminology', ruleKey: 'Verdant_R2', findings: 5, draftCount: 2 },
      { category: 'tone_voice', ruleKey: 'Verdant_R4', findings: 4, draftCount: 2 },
    ],
  });

  useEffect(() => {
    api.getAnalyticsSummary()
      .then((data) => {
        if (data && data.recurring) {
          setAnalytics(data);
        }
      })
      .catch(() => {});
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCopyHex = (hex: string, name: string) => {
    navigator.clipboard.writeText(hex);
    triggerToast(`Copied ${name} (${hex}) to clipboard!`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const wsId = workspace?.id || 'ws_acme_global';
    setBrandProfiles((prev) => ({
      ...prev,
      [wsId]: {
        ...editForm,
        lastUpdated: 'Just now',
      },
    }));
    setIsEditModalOpen(false);
    triggerToast(`Brand profile updated for ${editForm.brandName}!`);
  };

  const handleOpenReview = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setEditorCopy(camp.content);
  };

  const handleApprove = () => {
    if (!selectedCampaign) return;
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaign.id
          ? { ...c, status: 'Completed', score: 100, progress: 100, grade: '100/100' }
          : c
      )
    );
    setSelectedCampaign(null);
    triggerToast(`Decision saved: ${selectedCampaign.title} approved.`);
  };

  const handleRequestChanges = () => {
    if (!selectedCampaign) return;
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaign.id
          ? { ...c, status: 'Needs review' }
          : c
      )
    );
    setSelectedCampaign(null);
    triggerToast(`Changes requested for ${selectedCampaign.title}. Feedback delivered to author.`);
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (filterType === 'All') return true;
    if (filterType === 'Needs review') return camp.status === 'Needs review' || camp.status === 'In review';
    if (filterType === 'Completed') return camp.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6 text-[#111827] font-sans select-none pb-12">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-[#dce2d7] shadow-[0_12px_32px_rgba(26,43,25,0.12)] text-xs text-[#202820]"
          >
            <span className="w-5 h-5 rounded-full bg-[#eff6ed] text-[#1e4a2b] flex items-center justify-center font-bold">
              <Check className="w-3 h-3" />
            </span>
            <span className="font-medium">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="ml-2 text-[#858d83] hover:text-[#202820] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 1. REDESIGNED HERO SECTION: Two-Column Composition        */}
      {/* ========================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#07190d] via-[#0c2415] to-[#071a0e] border border-[#1a3d24] p-6 sm:p-8 lg:p-9 shadow-sm overflow-hidden">
        {/* Subtle Restrained Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#22c55e]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#10b981]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ======================================================= */}
          {/* LEFT COLUMN: Brand Messaging & Action CTAs (6-7 cols)   */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between py-1 text-white space-y-6">
            <div className="space-y-4 max-w-xl">
              {/* Workspace Status Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2d18]/90 border border-[#225431] text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#86efac]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span>Brand Governance Workspace</span>
              </div>

              {/* Main Headline & Tagline with Mint Accent Typography */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif tracking-tight text-[#f8faf5] leading-[1.12]">
                  One brand standard.
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif italic text-[#86efac] tracking-tight leading-[1.15]">
                  Every message. Everywhere.
                </h2>
              </div>

              {/* Supporting Editorial Description */}
              <p className="text-xs sm:text-sm text-[#a3b8a6] leading-relaxed max-w-lg">
                Keep every campaign consistent, every claim accountable, and every message aligned with your brand identity.
              </p>
            </div>

            {/* CTAs: Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/drafts/new')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-[#051c0a] text-xs sm:text-sm font-bold shadow-lg shadow-[#22c55e]/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Start Content Review</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/governance')}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-[#f8faf5] text-xs sm:text-sm font-medium backdrop-blur-sm transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#86efac]" />
                <span>View Governance Insights</span>
              </button>
            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: Brand Profile Overview Card (5-6 cols)    */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
            <div className="h-full rounded-2xl bg-[#0e2417]/90 border border-[#1f4a2d] p-5 sm:p-6 text-white shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 relative overflow-hidden">
              {/* Subtle Card Ambient Light */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#22c55e]/10 blur-2xl pointer-events-none" />

              {/* Card Header: Brand Label, Avatar, Name & Edit Action */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1f4a2d]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86efac]" />
                    <span className="text-[10px] font-mono tracking-widest text-[#86efac] uppercase font-bold">
                      BRAND PROFILE
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(currentProfile);
                      setIsEditModalOpen(true);
                    }}
                    className="text-xs text-[#a3b8a6] hover:text-white hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Edit Brand Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#86efac]" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Brand Identity Summary */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 cursor-pointer group min-w-0"
                    title="View detailed brand settings"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src="/brandguard-official-logo.png"
                        alt="Brand Logo"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-[#f8faf5] truncate group-hover:text-[#86efac] transition-colors">
                          {currentProfile.brandName}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-[#6b7280] group-hover:text-[#86efac] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-[#86efac] font-medium truncate">
                        {currentProfile.industry}
                      </p>
                    </div>
                  </div>

                  {/* Profile Status Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                      currentProfile.status === 'Verified'
                        ? 'bg-[#10b981]/20 text-[#4ade80] border border-[#10b981]/40'
                        : currentProfile.status === 'Needs Review'
                        ? 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40'
                        : 'bg-white/10 text-[#d1d5db] border border-white/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {currentProfile.status}
                  </span>
                </div>

                <p
                  onClick={() => navigate('/settings')}
                  className="text-xs text-[#b8c7b9] leading-relaxed cursor-pointer hover:text-white transition-colors line-clamp-2"
                  title="Click to view workspace settings"
                >
                  {currentProfile.description}
                </p>
              </div>

              {/* Brand Voice & Attributes */}
              <div className="space-y-1.5 pt-2 border-t border-[#1f4a2d]/80 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#86efac] font-mono uppercase tracking-wider font-semibold">
                    Tone of Voice
                  </span>
                  <span className="text-[#c3cfc4] italic truncate max-w-[200px]">
                    {currentProfile.toneOfVoice}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentProfile.personality.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-[#86efac] font-mono"
                    >
                      {trait}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-[#a3b8a6] truncate max-w-[150px]">
                    {currentProfile.communicationStyle}
                  </span>
                </div>
              </div>

              {/* Visual Identity: Interactive Color Swatches */}
              <div className="space-y-1.5 pt-2 border-t border-[#1f4a2d]/80 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#86efac] font-mono uppercase tracking-wider font-semibold">
                    Visual Identity Palette
                  </span>
                  <span className="text-[10px] text-[#78887a]">Click swatch to copy hex</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Primary', ...currentProfile.colors.primary },
                    { label: 'Secondary', ...currentProfile.colors.secondary },
                    { label: 'Accent', ...currentProfile.colors.accent },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => handleCopyHex(c.hex, c.name)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all cursor-pointer group text-left"
                      title={`Copy ${c.name} (${c.hex})`}
                    >
                      <div
                        className="w-4 h-4 rounded-md shrink-0 border border-white/30 shadow-xs"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0">
                        <div className="text-[9px] text-[#86efac] truncate leading-tight">
                          {c.label}
                        </div>
                        <div className="text-[10px] font-mono text-[#f8faf5] font-semibold group-hover:text-[#4ade80] transition-colors truncate">
                          {c.hex}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Guidelines & Compliance Configuration */}
              <div className="pt-2 border-t border-[#1f4a2d]/80 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#86efac] uppercase">Approved Terms</span>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.approvedTerms.slice(0, 2).map((term) => (
                        <span
                          key={term}
                          className="px-1.5 py-0.5 rounded bg-[#10b981]/15 border border-[#10b981]/30 text-[#86efac] text-[9px] truncate max-w-[120px]"
                        >
                          ✓ {term}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#f87171] uppercase">Prohibited Phrases</span>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.prohibitedTerms.slice(0, 2).map((term) => (
                        <span
                          key={term}
                          className="px-1.5 py-0.5 rounded bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#fca5a5] text-[9px] truncate max-w-[120px]"
                        >
                          ✕ {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Navigation Shortcuts */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-[#a3b8a6]">
                  <div className="flex items-center gap-3">
                    <span
                      onClick={() => navigate('/policies')}
                      className="hover:text-[#86efac] cursor-pointer underline underline-offset-2 transition-colors"
                      title="View Active Brand Policies"
                    >
                      {currentProfile.activePolicyCount} Active Policies
                    </span>
                    <span>•</span>
                    <span
                      onClick={() => navigate('/approved-facts')}
                      className="hover:text-[#86efac] cursor-pointer underline underline-offset-2 transition-colors"
                      title="View Approved Fact Catalog"
                    >
                      {currentProfile.approvedFactsCount} Approved Facts
                    </span>
                  </div>
                  <span className="font-mono text-[#78887a]">
                    {currentProfile.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BRAND PROFILE EDIT MODAL                                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-xl bg-white rounded-3xl border border-[#e7ebe3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#e7ebe3] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Edit Brand Profile & Guidelines
                  </h3>
                  <p className="text-xs text-[#6b7280]">
                    Configure brand identity, voice parameters, colors, and compliance boundaries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-[#e7ebe3] hover:bg-[#f7f8f5] flex items-center justify-center text-[#6b7280] hover:text-[#111827] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* 1. Identity */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#1e4a2b] uppercase tracking-wider font-mono">
                    1. Brand Identity
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Brand Display Name</label>
                      <input
                        type="text"
                        value={editForm.brandName}
                        onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Industry / Category</label>
                      <input
                        type="text"
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#374151]">Short Brand Description</label>
                    <textarea
                      rows={2}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-2 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                      required
                    />
                  </div>
                </div>

                {/* 2. Brand Voice */}
                <div className="space-y-3 pt-3 border-t border-[#f3f4f6]">
                  <h4 className="text-xs font-bold text-[#1e4a2b] uppercase tracking-wider font-mono">
                    2. Voice & Communication Style
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Tone of Voice</label>
                      <input
                        type="text"
                        value={editForm.toneOfVoice}
                        onChange={(e) => setEditForm({ ...editForm, toneOfVoice: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Personality Traits (comma separated)</label>
                      <input
                        type="text"
                        value={editForm.personality.join(', ')}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            personality: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Visual Identity Palette */}
                <div className="space-y-3 pt-3 border-t border-[#f3f4f6]">
                  <h4 className="text-xs font-bold text-[#1e4a2b] uppercase tracking-wider font-mono">
                    3. Visual Identity Colors
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Primary Hex</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={editForm.colors.primary.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                primary: { ...editForm.colors.primary, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-7 h-7 rounded border border-[#d1d5db] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editForm.colors.primary.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                primary: { ...editForm.colors.primary, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-full h-8 px-2 font-mono text-xs rounded border border-[#d1d5db]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Secondary Hex</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={editForm.colors.secondary.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                secondary: { ...editForm.colors.secondary, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-7 h-7 rounded border border-[#d1d5db] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editForm.colors.secondary.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                secondary: { ...editForm.colors.secondary, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-full h-8 px-2 font-mono text-xs rounded border border-[#d1d5db]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Accent Hex</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={editForm.colors.accent.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                accent: { ...editForm.colors.accent, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-7 h-7 rounded border border-[#d1d5db] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editForm.colors.accent.hex}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              colors: {
                                ...editForm.colors,
                                accent: { ...editForm.colors.accent, hex: e.target.value.toUpperCase() },
                              },
                            })
                          }
                          className="w-full h-8 px-2 font-mono text-xs rounded border border-[#d1d5db]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Guidelines */}
                <div className="space-y-3 pt-3 border-t border-[#f3f4f6]">
                  <h4 className="text-xs font-bold text-[#1e4a2b] uppercase tracking-wider font-mono">
                    4. Guidelines & Terminology
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Approved Terms (comma separated)</label>
                      <input
                        type="text"
                        value={editForm.approvedTerms.join(', ')}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            approvedTerms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Prohibited Phrases (comma separated)</label>
                      <input
                        type="text"
                        value={editForm.prohibitedTerms.join(', ')}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            prohibitedTerms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-[#d1d5db] text-xs focus:outline-none focus:border-[#16a34a]"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-4 border-t border-[#e7ebe3] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#d1d5db] hover:bg-[#f3f4f6] text-xs font-semibold text-[#4b5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1e4a2b] hover:bg-[#15361f] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Save Brand Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 2. METRIC STAT CARDS ROW: 4 Clean Cards with Sparklines   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Scans */}
        <div className="bg-white rounded-2xl p-5 border border-[#e7ebe3] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <span className="text-xs text-[#6b7280] font-medium block">Total Scans</span>
              <div className="text-2xl font-bold text-[#111827] mt-0.5">124</div>
              <span className="text-[11px] text-[#16a34a] font-medium flex items-center gap-0.5 mt-0.5">
                <span>↑</span> +12% from last month
              </span>
            </div>
          </div>
          {/* Sparkline Wave SVG */}
          <div className="w-16 h-8 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 24 C 14 26, 24 16, 36 20 C 46 24, 54 8, 62 10"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Compliance Score */}
        <div className="bg-white rounded-2xl p-5 border border-[#e7ebe3] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <span className="text-xs text-[#6b7280] font-medium block">Compliance Score</span>
              <div className="text-2xl font-bold text-[#111827] mt-0.5">
                92 <span className="text-sm font-normal text-[#9ca3af]">/100</span>
              </div>
              <span className="text-[11px] text-[#16a34a] font-medium flex items-center gap-0.5 mt-0.5">
                <span>↑</span> +4% from last month
              </span>
            </div>
          </div>
          {/* Sparkline Wave SVG */}
          <div className="w-16 h-8 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 28 C 16 30, 26 18, 38 22 C 48 24, 52 10, 62 8"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Drafts Approved */}
        <div className="bg-white rounded-2xl p-5 border border-[#e7ebe3] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 text-[#d97706]" />
            </div>
            <div>
              <span className="text-xs text-[#6b7280] font-medium block">Drafts Approved</span>
              <div className="text-2xl font-bold text-[#111827] mt-0.5">36</div>
              <span className="text-[11px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
                <span>↑</span> 70% pass rate
              </span>
            </div>
          </div>
          {/* Sparkline Wave SVG */}
          <div className="w-16 h-8 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 26 C 16 28, 28 20, 38 24 C 48 26, 52 14, 62 12"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Active Campaigns */}
        <div className="bg-white rounded-2xl p-5 border border-[#e7ebe3] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#f5f3ff] text-[#8b5cf6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <span className="text-xs text-[#6b7280] font-medium block">Active Campaigns</span>
              <div className="text-2xl font-bold text-[#111827] mt-0.5">8</div>
              <span className="text-[11px] text-[#8b5cf6] font-medium flex items-center gap-0.5 mt-0.5">
                <span>↑</span> +2 new this month
              </span>
            </div>
          </div>
          {/* Sparkline Wave SVG */}
          <div className="w-16 h-8 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 26 C 14 28, 26 22, 38 26 C 48 28, 54 14, 62 12"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MIDDLE SECTION: 3 Columns (Campaigns, Progress, Health)*/}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================= */}
        {/* COLUMN 1 (5 cols): Campaigns you're auditing            */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#111827]">
              Campaigns you're auditing
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('All')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  filterType === 'All'
                    ? 'bg-[#183921] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                All (5)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('Needs review')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  filterType === 'Needs review'
                    ? 'bg-[#183921] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                Needs review (1)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('Completed')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  filterType === 'Completed'
                    ? 'bg-[#183921] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                Completed (4)
              </button>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {filteredCampaigns.map((camp) => {
              const Icon = camp.icon;
              return (
                <div
                  key={camp.id}
                  onClick={() => handleOpenReview(camp)}
                  className="space-y-2 p-2 rounded-xl hover:bg-[#f9fafb] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${camp.iconBg} ${camp.iconColor} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#16a34a] transition-colors">
                          {camp.title}
                        </h3>
                        <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5 mt-0.5">
                          <span>{camp.timeSpent}</span>
                          <span>•</span>
                          <span>{camp.grade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          camp.status === 'Completed'
                            ? 'bg-[#ecfdf5] text-[#16a34a]'
                            : camp.status === 'In review'
                            ? 'bg-[#fef3c7] text-[#d97706]'
                            : 'bg-[#fee2e2] text-[#dc2626]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {camp.status}
                      </span>
                      <MoreVertical className="w-4 h-4 text-[#9ca3af] hover:text-[#111827]" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#f3f4f6] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        camp.progress >= 85
                          ? 'bg-[#16a34a]'
                          : camp.progress >= 70
                          ? 'bg-[#f59e0b]'
                          : 'bg-[#ef4444]'
                      }`}
                      style={{ width: `${camp.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN 2 (4 cols): Brand Compliance Progress            */}
        {/* ======================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">
              Brand Compliance Progress
            </h2>

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-[#4b5563] bg-white border border-[#e5e7eb] px-2.5 py-1 rounded-lg hover:border-[#d1d5db]"
            >
              <span>Last 30 days</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
            </button>
          </div>

          {/* Sub-Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {(['Scan Activity', 'Compliance Score', 'Issue Types'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setProgressTab(tab)}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  progressTab === tab
                    ? 'bg-[#183921] text-white'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Vertical Bar Chart with Active Tooltip */}
          <div className="relative pt-6 pb-2">
            {/* Active Tooltip over Jun 14 bar */}
            <div className="absolute left-[48%] -top-1 -translate-x-1/2 bg-[#111827] text-white text-[10px] font-medium px-2 py-1 rounded-md shadow-lg z-10 flex flex-col items-center">
              <span>28 scans</span>
              <span className="text-[9px] text-[#9ca3af]">Jun 14</span>
              {/* Tooltip Down Triangle */}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#111827] -mb-1" />
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between gap-1 h-32 px-1">
              {barChartData.map((bar, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-t-sm transition-all ${
                    bar.active
                      ? 'bg-[#183921] shadow-xs'
                      : 'bg-[#d1fae5] hover:bg-[#a7f3d0]'
                  }`}
                  style={{ height: `${bar.height}%` }}
                  title={`${bar.date}: ${bar.height} scans`}
                />
              ))}
            </div>

            {/* X-Axis Dates */}
            <div className="flex items-center justify-between text-[10px] text-[#9ca3af] font-medium pt-2 px-1 border-t border-[#f3f4f6]">
              <span>Jun 1</span>
              <span>Jun 7</span>
              <span>Jun 14</span>
              <span>Jun 21</span>
              <span>Jun 28</span>
            </div>
          </div>

          {/* 4 Bottom Stat Metric Counters */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#f3f4f6] text-center">
            <div>
              <div className="text-base font-bold text-[#111827]">124</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">Total Scans</div>
            </div>
            <div>
              <div className="text-base font-bold text-[#16a34a]">87</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">Approved</div>
            </div>
            <div>
              <div className="text-base font-bold text-[#d97706]">24</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">In Review</div>
            </div>
            <div>
              <div className="text-base font-bold text-[#dc2626]">13</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">Needs Changes</div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN 3 (3 cols): Compliance Health & AI Insights      */}
        {/* ======================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card A: Compliance Health (Donut Gauge) */}
          <div className="bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827]">
                Compliance Health
              </h2>
              <ChevronRight className="w-4 h-4 text-[#9ca3af] cursor-pointer hover:text-[#111827]" />
            </div>

            <div className="flex items-center justify-between pt-1">
              {/* Circular Donut Gauge */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f3f4f6"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Compliant Green Arc 86% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#22c55e"
                    strokeWidth="10"
                    strokeDasharray={`${0.86 * 238.7} 238.7`}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Minor Issues Amber Arc 8% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${0.08 * 238.7} 238.7`}
                    strokeDashoffset={`-${0.86 * 238.7}`}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Major Issues Red Arc 6% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={`${0.06 * 238.7} 238.7`}
                    strokeDashoffset={`-${0.94 * 238.7}`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold text-[#111827] leading-none">86%</span>
                  <span className="text-[10px] text-[#6b7280] mt-0.5">Healthy</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#374151]">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span>Compliant</span>
                  </span>
                  <span className="font-semibold text-[#111827]">86%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#374151]">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span>Minor issues</span>
                  </span>
                  <span className="font-semibold text-[#111827]">8%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#374151]">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                    <span>Major issues</span>
                  </span>
                  <span className="font-semibold text-[#111827]">6%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: AI Insights */}
          <div className="bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
                <h2 className="text-sm font-bold text-[#111827]">
                  AI Insights
                </h2>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9ca3af] cursor-pointer hover:text-[#111827]" />
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#16a34a] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#16a34a]" />
                </div>
                <p className="text-[#4b5563] leading-snug">
                  Your compliance score improved by 12% this month.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#f5f3ff] text-[#8b5cf6] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-[#8b5cf6]" />
                </div>
                <p className="text-[#4b5563] leading-snug">
                  Tone consistency is strongest in social campaigns (94%).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#fffbeb] text-[#d97706] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-[#d97706]" />
                </div>
                <p className="text-[#4b5563] leading-snug">
                  Most recurring issues are related to unverified claims.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM SECTION: Recent Activity, Top Issues, Actions   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================= */}
        {/* COLUMN 1 (5 cols): Recent Activity                      */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#111827]">
              Recent Activity
            </h2>

            {/* Activity Tabs */}
            <div className="flex items-center gap-1 text-xs">
              {(['All', 'Scans', 'Approvals', 'Comments'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivityTab(tab)}
                  className={`px-3 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                    activityTab === tab
                      ? 'bg-[#183921] text-white'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#16a34a] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#111827] font-medium truncate">
                  Campaign "Summer Campaign - Social" completed
                </span>
              </div>
              <span className="text-[11px] text-[#9ca3af] shrink-0">2 mins ago</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#111827] font-medium truncate">
                  "Product Brochure v2" sent for review
                </span>
              </div>
              <span className="text-[11px] text-[#9ca3af] shrink-0">15 mins ago</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#111827] font-medium truncate">
                  New draft created: "Q3 Email Copy"
                </span>
              </div>
              <span className="text-[11px] text-[#9ca3af] shrink-0">1 hour ago</span>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN 2 (4 cols): Top Issue Types                      */}
        {/* ======================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">
              Top Issue Types
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-[#4b5563] bg-white border border-[#e5e7eb] px-2.5 py-1 rounded-lg hover:border-[#d1d5db]"
            >
              <span>Last 30 days</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
            </button>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* 1. Unverified claims */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#374151] w-36 truncate">Unverified claims</span>
              <div className="flex-1 bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#ef4444] h-full rounded-full" style={{ width: '42%' }} />
              </div>
              <div className="text-right w-12 text-[#6b7280] font-mono text-[11px]">
                <strong className="text-[#111827]">32</strong> 42%
              </div>
            </div>

            {/* 2. Misleading language */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#374151] w-36 truncate">Misleading language</span>
              <div className="flex-1 bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#ea580c] h-full rounded-full" style={{ width: '24%' }} />
              </div>
              <div className="text-right w-12 text-[#6b7280] font-mono text-[11px]">
                <strong className="text-[#111827]">18</strong> 24%
              </div>
            </div>

            {/* 3. Missing sources */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#374151] w-36 truncate">Missing sources</span>
              <div className="flex-1 bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: '18%' }} />
              </div>
              <div className="text-right w-12 text-[#6b7280] font-mono text-[11px]">
                <strong className="text-[#111827]">14</strong> 18%
              </div>
            </div>

            {/* 4. Tone inconsistency */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#374151] w-36 truncate">Tone inconsistency</span>
              <div className="flex-1 bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: '10%' }} />
              </div>
              <div className="text-right w-12 text-[#6b7280] font-mono text-[11px]">
                <strong className="text-[#111827]">8</strong> 10%
              </div>
            </div>

            {/* 5. Other */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#374151] w-36 truncate">Other</span>
              <div className="flex-1 bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#9ca3af] h-full rounded-full" style={{ width: '6%' }} />
              </div>
              <div className="text-right w-12 text-[#6b7280] font-mono text-[11px]">
                <strong className="text-[#111827]">4</strong> 6%
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN 3 (3 cols): Quick Actions                         */}
        {/* ======================================================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e7ebe3] p-5 shadow-xs flex flex-col justify-between relative min-h-[190px]">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#16a34a]" />
              <span>Quick Actions</span>
            </h2>

            {/* 2x2 Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => navigate('/drafts/new')}
                className="p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#374151] flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <FileText className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                <span className="truncate">Scan new content</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/drafts/new')}
                className="p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#374151] flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <Plus className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                <span className="truncate">Create campaign</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/governance')}
                className="p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#374151] flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                <span className="truncate">View reports</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#374151] flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <Users className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                <span className="truncate">Manage team</span>
              </button>
            </div>
          </div>

          {/* Clean Compliance Footnote */}
          <div className="pt-3 border-t border-[#f3f4f6] flex items-center justify-between text-[11px] text-[#6b7280]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Multi-Layer Defense Active</span>
            </span>
            <span className="font-mono text-[10px]">ISO 12947-2</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HUMAN GOVERNANCE & REVIEW DRAWER MODAL                    */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedCampaign && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCampaign(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-[#e7ebe3] shadow-[0_20px_50px_rgba(26,43,25,0.18)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#e7ebe3] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#858d83] uppercase tracking-wider">
                    <span className="w-3 h-0.5 rounded-full bg-[#16a34a]" />
                    <span>CONTENT DETAIL · HUMAN GOVERNANCE</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] mt-1">
                    {selectedCampaign.title}
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {selectedCampaign.id} · {selectedCampaign.category} · {selectedCampaign.timeSpent}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="w-8 h-8 rounded-full border border-[#e7ebe3] hover:bg-[#f7f8f5] text-[#858d83] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Score & Findings Summary */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f9fafb] border border-[#e7ebe3]">
                  <div>
                    <span className="text-[10px] text-[#6b7280] block">Brand Compliance Score</span>
                    <strong className="text-xl font-mono font-bold text-[#111827]">
                      {selectedCampaign.score ? `${selectedCampaign.score}%` : 'Pending scan'}
                    </strong>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                      selectedCampaign.status === 'Completed'
                        ? 'bg-[#ecfdf5] text-[#16a34a]'
                        : 'bg-[#fef3c7] text-[#d97706]'
                    }`}
                  >
                    {selectedCampaign.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#dc2626] font-semibold bg-[#fee2e2] px-2.5 py-1 rounded-lg">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedCampaign.issues} findings detected</span>
                  </div>
                </div>

                {/* Draft Content Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-[#111827] font-semibold">Campaign Copy</strong>
                    <span className="text-[#6b7280] text-[11px]">
                      {role === 'creator' ? 'Editable draft' : 'Read-only preview'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editorCopy}
                    onChange={(e) => setEditorCopy(e.target.value)}
                    readOnly={role !== 'creator'}
                    className="w-full p-3 rounded-xl border border-[#e7ebe3] bg-[#f9fafb] text-[#111827] text-xs focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10 font-sans leading-relaxed"
                  />
                </div>

                {/* AI Analysis Findings */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#111827] font-semibold">AI Analysis Findings</strong>
                    <span className="text-[10px] font-mono text-[#6b7280]">Active Policy: v2.1</span>
                  </div>

                  {(sampleFindings[selectedCampaign.id] || []).length > 0 ? (
                    sampleFindings[selectedCampaign.id].map((f, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-white border border-[#e7ebe3] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                f.severity === 'High'
                                  ? 'bg-[#fee2e2] text-[#dc2626]'
                                  : 'bg-[#fef3c7] text-[#d97706]'
                              }`}
                            >
                              {f.severity}
                            </span>
                            <strong className="text-xs text-[#111827]">{f.title}</strong>
                          </div>
                        </div>

                        <p className="text-[#4b5563] text-xs leading-relaxed">{f.detail}</p>

                        <div className="flex items-center justify-between text-[11px] text-[#6b7280] pt-1 border-t border-[#f3f4f6]">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#16a34a]" />
                            <span>{f.source}</span>
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#16a34a] flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#16a34a]" />
                          <div>
                            <strong className="block text-[11px] text-[#15803d]">Suggested correction:</strong>
                            <span className="text-[#374151]">{f.fix}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-center text-xs text-[#16a34a] font-medium">
                      No policy violations detected. Content is verified on-brand!
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#f9fafb] border border-[#e7ebe3] flex items-center gap-2 text-[11px] text-[#6b7280]">
                    <LockKeyhole className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                    <span>
                      AI suggestions are advisory. Human governance decision is recorded in the immutable audit log.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 px-6 border-t border-[#e7ebe3] bg-[#f9fafb] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="px-4 py-2 rounded-xl border border-[#e7ebe3] hover:bg-white text-xs font-semibold text-[#4b5563] transition-colors cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    className="px-4 py-2 rounded-xl border border-[#fed7aa] bg-[#fffbeb] hover:bg-[#fef3c7] text-[#d97706] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-xl bg-[#1e4a2b] hover:bg-[#14341e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & publish</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
