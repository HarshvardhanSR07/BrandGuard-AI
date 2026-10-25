import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck,
  Lock,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Mascot } from '../../components/ui/Mascot';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Interactive Live Policy Audit Simulator
  const [sampleText, setSampleText] = useState(
    'Unlock 100% guaranteed viral reach with our revolutionary AI growth platform!'
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);
  const [fixed, setFixed] = useState(false);

  const handleScan = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setHasScanned(true);
      setFixed(false);
    }, 400);
  };

  const handleApplyFix = () => {
    setSampleText(
      'Accelerate your campaign performance with verified institutional brand safety.'
    );
    setFixed(true);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141715] font-sans antialiased selection:bg-[#84cc16] selection:text-black">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION BAR                                    */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#faf8f5]/85 backdrop-blur-md border-b border-[#ece6dd]/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo with 3D Shield */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 shrink-0">
              <motion.img
                src="/brandguard-emblem-tight.png"
                alt="BrandGuard AI Emblem"
                whileHover={{ scale: 1.08, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-playfair font-semibold text-xl tracking-tight text-[#161d18] leading-tight">
                BrandGuard <span className="text-[#1e5438] font-bold">AI</span>
              </span>
              <span className="text-[9px] tracking-[0.24em] uppercase text-[#736c62] font-medium">
                Trust What You Create
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium text-[#5c554b]">
            <a href="#platform" className="hover:text-[#161d18] transition-colors">
              Platform
            </a>
            <a href="#features" className="hover:text-[#161d18] transition-colors">
              Capabilities
            </a>
            <a href="#governance" className="hover:text-[#161d18] transition-colors">
              Governance
            </a>
            <a href="#simulator" className="hover:text-[#161d18] transition-colors">
              Live Audit
            </a>
          </nav>

          {/* Action Buttons & Mascot Companion */}
          <div className="flex items-center gap-4">
            {/* Header Mini LAX Companion */}
            <div
              className="hidden sm:flex items-center group cursor-pointer"
              title="LAX is monitoring brand integrity"
            >
              <div className="relative w-11 h-11 flex items-center justify-center">
                <Mascot
                  directions="/mascots/lax-directions.webp?v=2"
                  reactions="/mascots/lax-reactions.webp?v=2"
                  size={46}
                  className="transition-transform group-hover:scale-115"
                  label="LAX Header Guardian"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs sm:text-sm font-semibold text-[#1e5438] hover:text-[#0f3422] transition-colors px-3 py-2"
            >
              Sign In
            </button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="h-10 px-5 rounded-xl bg-[#141b16] hover:bg-black text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-28">
        {/* Ambient Subtle Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_rgba(132,204,22,0.08)_0%,_rgba(30,84,56,0.04)_40%,_transparent_70%)] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Announcement Chip */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#ded7cc] shadow-xs text-xs font-medium text-[#29241e]"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#1e5438] animate-pulse" />
              <span>BrandGuard 2.0 with LAX Autonomous Guardian</span>
              <span className="text-[#84cc16] font-mono text-[10px] bg-[#141b16] px-1.5 py-0.5 rounded">
                NEW
              </span>
            </motion.div>

            {/* Main Title in Playfair Display Serif */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-playfair text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#141715] leading-[1.08]"
            >
              Ideas that stay <br />
              <span className="italic font-normal text-[#1e5438]">on brand.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#5e574d] font-sans leading-relaxed max-w-2xl mx-auto"
            >
              AI-powered content analysis. Human-reviewed decisions. A safer, stronger brand across every campaign, market, and generative workflow.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#090d0b' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="h-12 px-7 rounded-xl bg-[#141b16] text-white text-sm font-semibold flex items-center gap-2.5 shadow-sm cursor-pointer transition-all"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-[#84cc16]" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const el = document.getElementById('simulator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-12 px-6 rounded-xl bg-white border border-[#ded7cc] hover:bg-[#faf7f2] text-[#1c1917] text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Play className="w-3.5 h-3.5 text-[#1e5438] fill-[#1e5438]" />
                <span>Try Live Audit</span>
              </motion.button>
            </motion.div>

            {/* Trust Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-[#ece6dd] max-w-2xl mx-auto text-left"
            >
              <div className="space-y-0.5">
                <div className="font-playfair text-2xl font-bold text-[#141715]">92%</div>
                <div className="text-[11px] text-[#787164]">Faster review cycles</div>
              </div>
              <div className="space-y-0.5">
                <div className="font-playfair text-2xl font-bold text-[#141715]">3x</div>
                <div className="text-[11px] text-[#787164]">Fewer policy violations</div>
              </div>
              <div className="space-y-0.5">
                <div className="font-playfair text-2xl font-bold text-[#141715]">120ms</div>
                <div className="text-[11px] text-[#787164]">Real-time audit latency</div>
              </div>
              <div className="space-y-0.5">
                <div className="font-playfair text-2xl font-bold text-[#141715]">100%</div>
                <div className="text-[11px] text-[#787164]">Cryptographic audit trail</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HERO SHOWCASE: Grand Portal + Interactive Mascot      */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pb-20">
        <div className="relative rounded-3xl bg-[#090b0e] text-white overflow-hidden p-8 sm:p-12 lg:p-16 shadow-[0_30px_70px_rgba(0,0,0,0.25)] border border-[#232934]">
          {/* Subtle Celestial Lighting */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,_rgba(132,204,22,0.08)_0%,_transparent_65%)] blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#a3e635] font-mono border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AUTONOMOUS BRAND GUARDIAN</span>
              </div>

              <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.14] text-white">
                Same Ideas. <br />
                <span className="italic text-[#d8c7a8]">Higher Standards.</span>
              </h2>

              <p className="text-sm sm:text-base text-white/70 font-sans leading-relaxed">
                Meet <strong>LAX</strong>, your brand’s autonomous co-pilot. LAX actively protects tone of voice, visual identity, truth in advertising, and regulatory adherence before any copy reaches production.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#84cc16] shrink-0" />
                  <span>Real-time semantic policy matching</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#84cc16] shrink-0" />
                  <span>Multimodal visual and text verification</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#84cc16] shrink-0" />
                  <span>Interactive 1-click corrective suggestions</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-11 px-6 rounded-xl bg-[#84cc16] hover:bg-[#72b311] text-black font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <span>Launch BrandGuard Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Interactive Mascot Portal Stage */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-md h-[400px] sm:h-[460px] rounded-2xl border-2 border-white/15 bg-gradient-to-b from-[#12161c] to-[#0c0e12] overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl">
                
                {/* Back Arch Graphic */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                  <img
                    src="/portal-arch.jpg"
                    alt="Portal Arch"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Ambient Center Glow */}
                <div className="absolute w-64 h-64 rounded-full bg-[#1e5438]/40 blur-3xl pointer-events-none" />

                {/* Interactive LAX Mascot (Tracks cursor and reacts on click) */}
                <div className="relative z-20 flex flex-col items-center justify-center cursor-pointer group">
                  <Mascot
                    directions="/mascots/lax-directions.webp?v=2"
                    reactions="/mascots/lax-reactions.webp?v=2"
                    size={200}
                    className="filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                    label="LAX Interactive Mascot"
                  />
                  <div className="mt-3 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white/90 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-ping" />
                    <span>Click LAX to boop & interact!</span>
                  </div>
                </div>

                {/* Floating Tags */}
                <div className="absolute top-6 left-6 z-20 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-[#84cc16]/40 text-[#a3e635] text-[11px] font-mono">
                  BRAND SAFE • 100%
                </div>

                <div className="absolute bottom-6 right-6 z-20 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-mono">
                  ZERO DRIFT DETECTED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CLIENT LOGO MARQUEE                                   */}
      {/* ======================================================== */}
      <section className="border-y border-[#ece6dd] py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <p className="text-center text-xs uppercase tracking-[0.22em] text-[#857d72] font-semibold mb-8">
            Trusted by leading brand teams and compliance officers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="font-playfair text-xl font-bold tracking-tight text-[#161d18]">
              HealthCo.
            </span>
            <span className="font-sans text-xl font-extrabold tracking-tighter text-[#161d18]">
              NEXA<span className="text-[#1e5438]">GLOBAL</span>
            </span>
            <span className="font-playfair text-xl italic font-semibold text-[#161d18]">
              Veridian Labs
            </span>
            <span className="font-mono text-lg font-bold tracking-widest text-[#161d18]">
              PULSE//MEDIA
            </span>
            <span className="font-sans text-xl font-light tracking-widest uppercase text-[#161d18]">
              AEGIS STUDIO
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. LIVE AUDIT SIMULATOR (Screen 01 Interactive Feature)   */}
      {/* ======================================================== */}
      <section id="simulator" className="py-20 lg:py-28 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1e5438]/10 text-xs text-[#1e5438] font-semibold">
            <FileCheck className="w-3.5 h-3.5" />
            <span>INTERACTIVE SIMULATOR</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-normal text-[#141715]">
            Test your copy in real-time.
          </h2>
          <p className="text-sm sm:text-base text-[#61594e]">
            See how BrandGuard AI detects tone violations, hyperbolic claims, and regulatory risks in milliseconds.
          </p>
        </div>

        {/* The Simulator Card */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-[#ded7cc] shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#29241e] uppercase tracking-wider">
                Campaign Draft Copy
              </label>
              <button
                type="button"
                onClick={handleScan}
                disabled={isAuditing}
                className="text-xs font-semibold text-[#1e5438] hover:text-[#0f3422] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAuditing ? 'Scanning...' : 'Re-scan with LAX'}</span>
              </button>
            </div>

            <textarea
              value={sampleText}
              onChange={(e) => {
                setSampleText(e.target.value);
                setFixed(false);
              }}
              rows={3}
              className="w-full p-4 rounded-xl bg-[#faf8f5] border border-[#ded7cc] text-sm text-[#141715] focus:outline-none focus:border-[#1e5438] focus:ring-2 focus:ring-[#1e5438]/15 transition-all resize-none font-sans"
            />
          </div>

          {/* Results Panel */}
          <div className="border-t border-[#ece6dd] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#29241e] uppercase tracking-wider">
                  Compliance Assessment
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                    fixed
                      ? 'bg-[#dcfce7] text-[#15803d]'
                      : 'bg-[#fee2e2] text-[#b91c1c]'
                  }`}
                >
                  {fixed ? 'PASSED • 100%' : '2 VIOLATIONS DETECTED'}
                </span>
              </div>
              <span className="text-xs text-[#7e766a]">Engine latency: 114ms</span>
            </div>

            <AnimatePresence mode="wait">
              {!fixed ? (
                <motion.div
                  key="violations"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  <div className="p-4 rounded-xl bg-[#fff8f6] border border-[#fca5a5] flex items-start gap-3.5">
                    <AlertTriangle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="font-semibold text-[#991b1b]">
                        Hyperbolic Claim Violation (§4.2 Truth in Advertising)
                      </div>
                      <p className="text-[#7f1d1d]">
                        Phrase <code className="bg-red-100 px-1 py-0.5 rounded text-red-900 font-mono">"100% guaranteed viral reach"</code> makes unverified performance promises prohibited by FTC and enterprise advertising policy.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#fff8f6] border border-[#fca5a5] flex items-start gap-3.5">
                    <AlertTriangle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="font-semibold text-[#991b1b]">
                        Off-Brand Tone Drift (Tone Profile: Institutional)
                      </div>
                      <p className="text-[#7f1d1d]">
                        The word <code className="bg-red-100 px-1 py-0.5 rounded text-red-900 font-mono">"revolutionary"</code> triggers high hype index score (8.4/10). Institutional brand policy prescribes objective, grounded phrasing.
                      </p>
                    </div>
                  </div>

                  {/* One-Click Resolution */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#f4efe6] border border-[#ded7cc]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#29241e]">
                        LAX Recommended Safe Alternative:
                      </div>
                      <div className="text-xs sm:text-sm text-[#1e5438] font-medium italic">
                        "Accelerate your campaign performance with verified institutional brand safety."
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApplyFix}
                      className="px-4 py-2 rounded-lg bg-[#141b16] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 ml-4 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#84cc16]" />
                      <span>Apply Safe Fix</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="cleared"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-xl bg-[#f0fdf4] border border-[#86efac] text-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-[#dcfce7] text-[#15803d] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="font-playfair text-xl font-semibold text-[#166534]">
                    Zero Policy Violations Detected!
                  </div>
                  <p className="text-xs text-[#15803d] max-w-md mx-auto">
                    Draft complies with FTC §4.2 truth-in-advertising guidelines and aligns with the Institutional Tone Profile. Safe for campaign publication.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. THREE CORE PILLARS                                    */}
      {/* ======================================================== */}
      <section id="features" className="py-20 bg-white border-t border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <h2 className="font-playfair text-3xl sm:text-4xl font-normal text-[#141715]">
              Built for high-velocity creative teams.
            </h2>
            <p className="text-sm sm:text-base text-[#61594e]">
              Replace sluggish email sign-off chains with instant automated guidance and cryptographic accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-[#faf8f5] border border-[#ded7cc] space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#141b16] text-[#84cc16] flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-playfair text-2xl font-semibold text-[#141715]">
                Policy Engine
              </h3>
              <p className="text-xs sm:text-sm text-[#5e574d] leading-relaxed">
                Ingest internal stylebooks, legal disclaimers, trademark registries, and regional regulatory constraints into machine-verifiable rules.
              </p>
              <div className="pt-2 text-xs font-semibold text-[#1e5438] flex items-center gap-1">
                <span>Explore Policy Editor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-[#faf8f5] border border-[#ded7cc] space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#141b16] text-[#84cc16] flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-playfair text-2xl font-semibold text-[#141715]">
                Human Review Queues
              </h3>
              <p className="text-xs sm:text-sm text-[#5e574d] leading-relaxed">
                High-confidence checks clear automatically. Edge cases route straight to designated reviewers with visual diffs and suggested remedies.
              </p>
              <div className="pt-2 text-xs font-semibold text-[#1e5438] flex items-center gap-1">
                <span>Review Workflows</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-[#faf8f5] border border-[#ded7cc] space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#141b16] text-[#84cc16] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-playfair text-2xl font-semibold text-[#141715]">
                Immutable Audit Trail
              </h3>
              <p className="text-xs sm:text-sm text-[#5e574d] leading-relaxed">
                Every review, override, and publication decision is recorded in an immutable, cryptographically verifiable ledger for audits and compliance.
              </p>
              <div className="pt-2 text-xs font-semibold text-[#1e5438] flex items-center gap-1">
                <span>View Security Specs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. BOTTOM CALL TO ACTION BANNER                          */}
      {/* ======================================================== */}
      <section className="py-20 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="rounded-3xl bg-[#141b16] text-white p-10 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl">
            {/* Background Arch Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(132,204,22,0.15)_0%,_transparent_70%)] pointer-events-none" />

            <h2 className="font-playfair text-3xl sm:text-5xl font-normal leading-tight text-white relative z-10">
              Ready to protect your brand at scale?
            </h2>

            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto font-sans relative z-10">
              Join enterprise brand guardians and creative teams who trust BrandGuard AI to enforce policy with zero drag on momentum.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="h-12 px-8 rounded-xl bg-[#84cc16] hover:bg-[#72b311] text-black text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="h-12 px-7 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Sign In to Console</span>
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="border-t border-[#ece6dd] py-12 bg-white text-xs text-[#7e766a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/brandguard-emblem-tight.png"
              alt="BrandGuard Emblem"
              className="w-6 h-6 object-contain"
            />
            <span className="font-playfair font-semibold text-sm text-[#141715]">
              BrandGuard AI
            </span>
            <span className="text-[#a8a195]">© 2026 BrandGuard AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#141715] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#141715] transition-colors">
              Terms of Service
            </a>
            <span className="flex items-center gap-1.5 text-[#1e5438] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> SOC2 Type II Certified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
