import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ArrowRight,
  TrendingUp,
  Shield,
  FileText,
  Mail,
  Globe,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Upload,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Filter,
} from 'lucide-react';
import { Mascot } from '../../components/ui/Mascot';
import { useAuth } from '../../hooks/useAuth';

interface Campaign {
  id: string;
  title: string;
  category: string;
  timeSpent: string;
  grade: string;
  score: number;
  progress: number;
  status: 'Completed' | 'In review' | 'In analysis' | 'Changes requested';
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

const initialCampaigns: Campaign[] = [
  {
    id: 'DRF-204',
    title: 'Summer Campaign - Social',
    category: 'Social Media',
    timeSpent: '120 Hours active',
    grade: '92/100 Compliance Score',
    score: 92,
    progress: 100,
    status: 'Completed',
    icon: Globe,
    iconBg: 'bg-[#eff6ed]',
    iconColor: 'text-[#295d36]',
    content: 'Experience effortless comfort for sunny horizons. Thoughtfully engineered with 62% recycled fibers. Discover the summer edition.',
    issues: 1,
  },
  {
    id: 'DRF-202',
    title: 'Product Brochure v2',
    category: 'Print & Digital',
    timeSpent: '18 Hours active',
    grade: '78/100 Compliance Score',
    score: 78,
    progress: 20,
    status: 'In review',
    icon: BookOpen,
    iconBg: 'bg-[#f3effb]',
    iconColor: 'text-[#7657a7]',
    content: 'The most comfortable fit for every journey. Built with unmatched precision and guaranteed lifetime durability.',
    issues: 2,
  },
  {
    id: 'DRF-203',
    title: 'Email - New Pricing',
    category: 'Direct Email',
    timeSpent: '64 Hours active',
    grade: '68/100 Compliance Score',
    score: 68,
    progress: 74,
    status: 'In review',
    icon: Mail,
    iconBg: 'bg-[#fff6e5]',
    iconColor: 'text-[#a36d24]',
    content: 'Special member-exclusive rates valid until 31 October. Upgrade your plan and enjoy uninterrupted access.',
    issues: 3,
  },
  {
    id: 'DRF-201',
    title: 'Website Hero Section',
    category: 'Web Experience',
    timeSpent: '0 Hours active',
    grade: 'Pending First Scan',
    score: 0,
    progress: 0,
    status: 'In analysis',
    icon: FileText,
    iconBg: 'bg-[#eef4ff]',
    iconColor: 'text-[#456fba]',
    content: 'Thoughtful essentials for the everyday. Discover lasting comfort and considered design across every touchpoint.',
    issues: 0,
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
  'DRF-201': [],
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [filterType, setFilterType] = useState<'All' | 'Needs review' | 'In analysis' | 'Completed'>('All');
  const [period, setPeriod] = useState<'Last 7 days' | 'Last month' | 'Last quarter'>('Last month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editorCopy, setEditorCopy] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
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
          ? { ...c, status: 'Completed', score: 100, progress: 100, grade: '100/100 Compliance Score' }
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
          ? { ...c, status: 'Changes requested' }
          : c
      )
    );
    setSelectedCampaign(null);
    triggerToast(`Changes requested for ${selectedCampaign.title}. Feedback delivered to author.`);
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (filterType === 'All') return true;
    if (filterType === 'Needs review') return camp.status === 'In review';
    if (filterType === 'In analysis') return camp.status === 'In analysis';
    if (filterType === 'Completed') return camp.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6 text-[#202820] font-sans select-none pb-12">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-[#dce2d7] shadow-[0_12px_32px_rgba(26,43,25,0.12)] text-xs text-[#202820]"
          >
            <span className="w-5 h-5 rounded-full bg-[#eff6ed] text-[#295d36] flex items-center justify-center font-bold">
              <Check className="w-3 h-3" />
            </span>
            <span className="font-medium">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="ml-2 text-[#858d83] hover:text-[#202820]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* TOP HERO BANNER: Retaining UI Layout, Clean Color Styling */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl bg-gradient-to-r from-[#121c14] via-[#1a2c1f] to-[#111a13] border border-[#233527] p-7 lg:p-9 shadow-[0_15px_35px_rgba(26,43,25,0.15)] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        {/* Subtle Organic Radial Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#3f7449]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-[#d7ef8b]/10 blur-3xl pointer-events-none" />

        {/* Left Headline & CTA */}
        <div className="space-y-4 max-w-lg z-10 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e3323] border border-[#3f7449]/50 text-[11px] font-mono text-[#d7ef8b]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d7ef8b] animate-pulse" />
            <span>Autonomous Brand Guard · Active</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-display font-medium tracking-tight text-white leading-tight">
            The study of the <br />
            <span className="italic font-light text-white/90">structure of brand safety.</span>
          </h1>

          <p className="text-xs text-[#a0ad9c] leading-relaxed">
            Continuously auditing copy, claims, and tone against verified truth benchmarks.
          </p>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#3f7449] hover:bg-[#295d36] text-white text-xs font-semibold shadow-lg shadow-[#295d36]/30 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
              </div>
              <span>CONTINUE ANALYSIS</span>
            </motion.button>
          </div>
        </div>

        {/* Right Graphic: Interactive Calibrated LAX Mascot */}
        <div className="relative z-10 flex items-center justify-center shrink-0 pr-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            className="relative w-56 sm:w-64 h-52 sm:h-60 flex items-center justify-center"
          >
            {/* Mascot Stage Card with cursor tracking */}
            <div
              className="w-48 h-48 rounded-2xl overflow-hidden relative shadow-2xl border border-[#2c4131] bg-[#142217]/90 p-2 flex items-center justify-center group cursor-pointer"
              title="LAX Brand Guardian · Click for reaction"
            >
              <Mascot
                directions="/mascots/lax-directions.webp?v=3"
                reactions="/mascots/lax-reactions.webp?v=3"
                size={160}
                label="LAX Mascot"
              />

              <div className="absolute top-2.5 right-2.5 bg-[#1e3323]/95 text-[#d7ef8b] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#3f7449]/50 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5" />
                <span>LAX AI</span>
              </div>
            </div>

            {/* Glowing Backlight */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3f7449]/25 to-[#d7ef8b]/15 blur-2xl -z-10 rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* LOWER SECTION: Two Columns (Active Campaigns & Progress)  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================= */}
        {/* LEFT COLUMN: Campaigns you're auditing (5 cols)         */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#e7ebe3] p-6 shadow-[0_2px_7px_rgba(26,43,25,0.025),0_10px_30px_rgba(26,43,25,0.035)] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#202820] tracking-tight">
              Campaigns you're auditing
            </h2>

            {/* Filter Tabs matching Clean UI */}
            <div className="flex items-center gap-1 bg-[#f7f8f5] p-1 rounded-xl border border-[#e7ebe3] text-[11px]">
              {(['All', 'Needs review', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === tab
                      ? 'bg-white text-[#295d36] font-semibold shadow-xs'
                      : 'text-[#858d83] hover:text-[#202820]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredCampaigns.map((camp) => {
              const Icon = camp.icon;
              return (
                <div
                  key={camp.id}
                  onClick={() => handleOpenReview(camp)}
                  className="p-3.5 rounded-2xl bg-[#fbfcfa] border border-[#e7ebe3] hover:border-[#b6cdb1] hover:bg-white hover:shadow-xs transition-all cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${camp.iconBg} ${camp.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-[#202820] truncate group-hover:text-[#295d36] transition-colors">
                          {camp.title}
                        </h3>
                        <div className="text-[10px] text-[#858d83] flex items-center gap-2 mt-0.5">
                          <span>{camp.timeSpent}</span>
                          <span>·</span>
                          <span>{camp.grade}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge with Clean UI colors */}
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                        camp.status === 'Completed'
                          ? 'bg-[#eff6ed] text-[#2f633a] border border-[#d2ecd0]'
                          : camp.status === 'In review'
                          ? 'bg-[#fff6e5] text-[#a36d24] border border-[#fed7aa]'
                          : camp.status === 'Changes requested'
                          ? 'bg-[#fff0ed] text-[#b8473c] border border-[#fcd8d4]'
                          : 'bg-[#f0f2ed] text-[#50594f] border border-[#e2e6de]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {camp.status}
                    </span>
                  </div>

                  {/* Progress Bar with Clean UI palette */}
                  <div className="w-full bg-[#edf0ea] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        camp.progress === 100
                          ? 'bg-[#295d36]'
                          : camp.progress > 50
                          ? 'bg-[#3f7449]'
                          : 'bg-[#a36d24]'
                      }`}
                      style={{ width: `${camp.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-8 text-[#858d83] text-xs">
                No campaigns match this filter.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: Brand Compliance Progress & Charts (7 cols)*/}
        {/* ======================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#202820] tracking-tight">
              Brand Compliance Progress
            </h2>

            {/* Time Filter Dropdown from Clean UI */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1 text-xs text-[#50594f] bg-white px-2.5 py-1 rounded-lg border border-[#e7ebe3] hover:border-[#dce2d7] hover:text-[#202820] cursor-pointer transition-colors shadow-2xs"
              >
                <span>{period}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#858d83]" />
              </button>

              {periodOpen && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-36 p-1 rounded-xl border border-[#e7ebe3] bg-white shadow-xl space-y-0.5">
                  {(['Last 7 days', 'Last month', 'Last quarter'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPeriod(p);
                        setPeriodOpen(false);
                        triggerToast(`Analytical period updated to ${p}.`);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#f7f8f5] text-[#202820] flex items-center justify-between"
                    >
                      <span>{p}</span>
                      {period === p && <Check className="w-3 h-3 text-[#295d36]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid of Analytical Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Card 1: Track your scan activity / Bar Chart Card (6 cols) */}
            <div className="sm:col-span-6 bg-white rounded-3xl border border-[#e7ebe3] p-5 shadow-[0_2px_7px_rgba(26,43,25,0.025),0_10px_30px_rgba(26,43,25,0.035)] flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7c8677] font-medium">Track your scan hours</span>
                <span className="w-5 h-5 rounded-full bg-[#f0f6ed] text-[10px] font-mono text-[#295d36] font-bold flex items-center justify-center">
                  1
                </span>
              </div>

              {/* Vertical Bar Chart Simulation with Clean Green Palettes */}
              <div className="flex items-end justify-between gap-2 h-24 pt-4 px-2">
                <div className="flex-1 bg-[#e7eee4] h-[35%] rounded-t-sm hover:bg-[#d5e2d1] transition-colors" title="Mon: 14 scans" />
                <div className="flex-1 bg-[#e7eee4] h-[55%] rounded-t-sm hover:bg-[#d5e2d1] transition-colors" title="Tue: 22 scans" />
                <div className="flex-1 bg-[#295d36] h-[85%] rounded-t-sm shadow-xs" title="Wed: 34 scans (Peak)" />
                <div className="flex-1 bg-[#e7eee4] h-[45%] rounded-t-sm hover:bg-[#d5e2d1] transition-colors" title="Thu: 18 scans" />
                <div className="flex-1 bg-[#e7eee4] h-[65%] rounded-t-sm hover:bg-[#d5e2d1] transition-colors" title="Fri: 26 scans" />
                <div className="flex-1 bg-[#e7eee4] h-[40%] rounded-t-sm hover:bg-[#d5e2d1] transition-colors" title="Sat: 16 scans" />
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-[#f0f2ed]">
                <span className="text-[10px] text-[#858d83] uppercase tracking-wider font-mono">Total Scans</span>
                <span className="text-2xl font-bold font-mono text-[#202820] tabular-nums">
                  {period === 'Last 7 days' ? '38' : period === 'Last month' ? '124' : '382'}
                </span>
              </div>
            </div>

            {/* Stacked Right Cards (6 cols) */}
            <div className="sm:col-span-6 space-y-4 flex flex-col justify-between">
              {/* Card 2: Drafts Completed / Approved Card (Signature Deep Green #295d36) */}
              <div className="bg-[#295d36] text-white rounded-3xl p-5 shadow-lg shadow-[#295d36]/20 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90">Drafts approved</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-mono text-white flex items-center justify-center font-bold">
                    2
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs text-[#d7ef8b] font-mono font-medium">70% Pass Rate</span>
                  <span className="text-3xl font-bold font-mono text-white tabular-nums">36</span>
                </div>
              </div>

              {/* Card 3: Performance Spline Wave Chart Card */}
              <div className="bg-white rounded-3xl border border-[#e7ebe3] p-5 shadow-[0_2px_7px_rgba(26,43,25,0.025),0_10px_30px_rgba(26,43,25,0.035)] flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7c8677] font-medium">Compliance Health</span>
                  <span className="w-5 h-5 rounded-full bg-[#f0f6ed] text-[10px] font-mono text-[#295d36] font-bold flex items-center justify-center">
                    3
                  </span>
                </div>

                {/* Spline Wave Line Simulation with Emerald Stroke & Gradient Fill */}
                <div className="h-10 w-full mt-2 relative">
                  <svg className="w-full h-full" viewBox="0 0 160 40" fill="none">
                    <defs>
                      <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#295d36" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#295d36" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,32 Q25,35 45,20 T90,26 T130,8 T160,25 L160,40 L0,40 Z"
                      fill="url(#splineGradient)"
                    />
                    <path
                      d="M0,32 Q25,35 45,20 T90,26 T130,8 T160,25"
                      stroke="#295d36"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="130" cy="8" r="3.5" fill="#295d36" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                  <div className="absolute right-6 -top-2 bg-[#edf5e8] text-[#2f633a] border border-[#d2ecd0] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                    86%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Pending Review Queue Bottom Pill */}
          <div
            onClick={() => navigate('/review')}
            className="p-4 rounded-2xl bg-white border border-[#e7ebe3] hover:border-[#295d36] flex items-center justify-between text-xs cursor-pointer shadow-[0_2px_7px_rgba(26,43,25,0.025)] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#eff6ed] text-[#295d36] text-[10px] font-mono font-bold flex items-center justify-center">
                4
              </span>
              <span className="font-semibold text-[#202820] group-hover:text-[#295d36] transition-colors">
                Pending Review Queue (3 items)
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#858d83] group-hover:text-[#295d36] font-medium transition-colors">
              <span>View queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HUMAN GOVERNANCE & REVIEW DRAWER (UX from clean-ui)       */}
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
                    <span className="w-3 h-0.5 rounded-full bg-[#3f7449]" />
                    <span>CONTENT DETAIL · HUMAN GOVERNANCE</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202820] mt-1">
                    {selectedCampaign.title}
                  </h3>
                  <p className="text-xs text-[#858d83] mt-0.5">
                    {selectedCampaign.id} · {selectedCampaign.category} · {selectedCampaign.timeSpent}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="w-8 h-8 rounded-full border border-[#e7ebe3] hover:bg-[#f7f8f5] text-[#858d83] hover:text-[#202820] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Score & Findings Summary */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fbfcfa] border border-[#e7ebe3]">
                  <div>
                    <span className="text-[10px] text-[#858d83] block">Brand Compliance Score</span>
                    <strong className="text-xl font-mono font-bold text-[#202820]">
                      {selectedCampaign.score ? `${selectedCampaign.score}%` : 'Pending scan'}
                    </strong>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                      selectedCampaign.status === 'Completed'
                        ? 'bg-[#eff6ed] text-[#2f633a] border border-[#d2ecd0]'
                        : selectedCampaign.status === 'In review'
                        ? 'bg-[#fff6e5] text-[#a36d24] border border-[#fed7aa]'
                        : 'bg-[#f0f2ed] text-[#50594f] border border-[#e2e6de]'
                    }`}
                  >
                    {selectedCampaign.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#b8473c] font-semibold bg-[#fff0ed] px-2.5 py-1 rounded-lg border border-[#fcd8d4]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedCampaign.issues} findings detected</span>
                  </div>
                </div>

                {/* Draft Content Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-[#202820] font-semibold">Campaign Copy</strong>
                    <span className="text-[#858d83] text-[11px]">
                      {role === 'creator' ? 'Editable draft' : 'Read-only preview'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editorCopy}
                    onChange={(e) => setEditorCopy(e.target.value)}
                    readOnly={role !== 'creator'}
                    className="w-full p-3 rounded-xl border border-[#e7ebe3] bg-[#fbfcfa] text-[#202820] text-xs focus:outline-none focus:border-[#3f7449] focus:ring-2 focus:ring-[#3f7449]/10 font-sans leading-relaxed"
                  />
                </div>

                {/* AI Analysis Findings */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#202820] font-semibold">AI Analysis Findings</strong>
                    <span className="text-[10px] font-mono text-[#858d83]">Active Policy: v2.1</span>
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
                                  ? 'bg-[#fff0ed] text-[#b8473c] border border-[#fcd8d4]'
                                  : 'bg-[#fff6e5] text-[#a36d24] border border-[#fed7aa]'
                              }`}
                            >
                              {f.severity}
                            </span>
                            <strong className="text-xs text-[#202820]">{f.title}</strong>
                          </div>
                        </div>

                        <p className="text-[#50594f] text-xs leading-relaxed">{f.detail}</p>

                        <div className="flex items-center justify-between text-[11px] text-[#858d83] pt-1 border-t border-[#f0f2ed]">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#3f7449]" />
                            <span>{f.source}</span>
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f6ed] border border-[#d2ecd0] text-xs text-[#295d36] flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#3f7449]" />
                          <div>
                            <strong className="block text-[11px] text-[#295d36]">Suggested correction:</strong>
                            <span className="text-[#50594f]">{f.fix}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-[#eff6ed] border border-[#d2ecd0] text-center text-xs text-[#295d36] font-medium">
                      No policy violations detected. Content is verified on-brand!
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#f7f8f5] border border-[#e7ebe3] flex items-center gap-2 text-[11px] text-[#858d83]">
                    <LockKeyhole className="w-3.5 h-3.5 text-[#3f7449] shrink-0" />
                    <span>
                      AI suggestions are advisory. Human governance decision is recorded in the immutable audit log.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 px-6 border-t border-[#e7ebe3] bg-[#fbfcfa] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="px-4 py-2 rounded-xl border border-[#e7ebe3] hover:bg-white text-xs font-semibold text-[#50594f] transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    className="px-4 py-2 rounded-xl border border-[#fed7aa] bg-[#fff6e5] hover:bg-[#ffedd5] text-[#a36d24] text-xs font-semibold transition-colors"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-xl bg-[#295d36] hover:bg-[#1f4729] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
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
