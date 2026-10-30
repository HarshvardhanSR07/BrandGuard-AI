import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Check, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { Mascot } from '../../components/ui/Mascot';
import { useAuthStore } from './authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();

  // Mode: 'signup' (matches Image 1: "Create Account") or 'signin' (matches Image 2: "Welcome back !")
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'microsoft' | null>(null);
  const [authError, setAuthError] = useState('');

  // Email verification code state for Clerk sign-up
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingSubmit, setIsVerifyingSubmit] = useState(false);

  const handleGoogleAuth = async () => {
    if (socialLoading) return;
    setSocialLoading('google');
    setAuthError('');

    try {
      if (mode === 'signup' && isSignUpLoaded && signUp) {
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard',
        });
      } else if (isSignInLoaded && signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard',
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Google authentication was cancelled or failed.';
      setAuthError(msg);
      setSocialLoading(null);
    }
  };

  const handleMicrosoftAuth = async () => {
    if (socialLoading) return;
    setSocialLoading('microsoft');
    setAuthError('');

    try {
      if (mode === 'signup' && isSignUpLoaded && signUp) {
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_microsoft',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard',
        });
      } else if (isSignInLoaded && signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_microsoft',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard',
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Microsoft auth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Microsoft authentication was cancelled or failed.';
      setAuthError(msg);
      setSocialLoading(null);
    }
  };

  const handleDemoLogin = async (demoRole: 'creator' | 'reviewer' | 'admin') => {
    setIsSubmitting(true);
    setAuthError('');
    try {
      await useAuthStore.getState().devSwitchAccount(demoRole);
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAuthError('');

    try {
      // 1. Primary Authenticated Session via BrandGuard Backend
      try {
        await useAuthStore.getState().login(email, password);
        navigate('/dashboard');
        return;
      } catch (backendErr: any) {
        // If backend failed due to wrong password, don't fallback to mock
        if (backendErr?.status === 401 || backendErr?.message?.includes('Invalid')) {
          throw backendErr;
        }
      }

      // 2. Clerk Authentication fallback if configured
      if (mode === 'signin') {
        if (isSignInLoaded && signIn && setActive) {
          const result = await signIn.create({
            identifier: email,
            password,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            navigate('/dashboard');
            return;
          }
        }
      } else {
        if (isSignUpLoaded && signUp && setActive) {
          const firstName = name.trim().split(' ')[0] || name.trim() || 'User';
          const lastName = name.trim().split(' ').slice(1).join(' ') || undefined;

          const result = await signUp.create({
            emailAddress: email,
            password,
            firstName,
            lastName,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            navigate('/dashboard');
            return;
          } else if (result.unverifiedFields?.includes('email_address')) {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setIsVerifyingCode(true);
            setIsSubmitting(false);
            return;
          }
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid credentials. Please verify your details.';
      setAuthError(msg);
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingSubmit) return;
    setIsVerifyingSubmit(true);
    setAuthError('');

    try {
      if (isSignUpLoaded && signUp && setActive) {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
          navigate('/dashboard');
          return;
        }
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Code verification error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid verification code. Please check your email.';
      setAuthError(msg);
      setIsVerifyingSubmit(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="w-screen h-screen min-h-screen m-0 p-0 overflow-hidden bg-[#faf8f5] text-[#141414] font-sans antialiased select-none flex flex-col lg:flex-row">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Clean Editorial Form Area (Alabaster / Ivory) */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[48%] xl:w-[45%] h-full relative z-20 flex flex-col justify-between px-8 sm:px-12 lg:px-14 xl:px-18 py-6 sm:py-8 lg:py-10 overflow-y-auto bg-[#faf8f5] border-r border-[#ece6dd]/80 shadow-[10px_0_30px_rgba(0,0,0,0.04)]">
        
        {/* TOP BAR: Clean brand mark */}
        <div className="w-full flex items-center justify-between shrink-0 z-10 pt-1 pb-2">
          {/* Brand Logo: Emerald 3D Shield + Refined Typography */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 relative">
              <motion.img
                src="/brandguard-official-logo.png"
                alt="BrandGuard Emblem"
                whileHover={{ scale: 1.08, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-playfair font-semibold text-lg sm:text-xl tracking-tight text-[#161d18] leading-tight">
                BrandGuard <span className="text-[#1e5438] font-bold">AI</span>
              </span>
              <span className="text-[9px] tracking-[0.22em] uppercase text-[#736c62] font-medium">
                Trust What You Create
              </span>
            </div>
          </div>

          {/* Interactive Cursor-Tracking Mascot (LAX) in Header */}
          <div className="flex items-center gap-2 group cursor-pointer" title="Click to interact with LAX!">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Mascot
                directions="/mascots/lax-directions.webp?v=2"
                reactions="/mascots/lax-reactions.webp?v=2"
                size={54}
                className="transition-transform group-hover:scale-110"
                label="LAX Mascot"
              />
            </div>
          </div>
        </div>

        {/* CENTER FORM SECTION */}
        <div className="max-w-[400px] w-full mx-auto my-auto py-2 z-10">
          <AnimatePresence mode="wait">
            {isVerifyingCode ? (
              <motion.div
                key="verify"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <h1 className="font-playfair text-3xl sm:text-4xl text-[#141715] font-normal tracking-tight leading-[1.12]">
                    Verify Email
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#696256] font-sans leading-relaxed">
                    We sent a 6-digit confirmation code to <span className="font-medium text-[#161917]">{email}</span>.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#29241e] block">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full h-11 px-4 text-center tracking-widest font-mono text-base rounded-xl bg-white border border-[#ded7cc] text-[#161917] placeholder-[#a2998c] focus:outline-none focus:border-[#1e5438] focus:ring-2 focus:ring-[#1e5438]/15 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingSubmit}
                    className="w-full h-11 rounded-xl bg-[#141b16] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all hover:bg-[#090d0b]"
                  >
                    {isVerifyingSubmit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Sign Up</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingCode(false);
                      setAuthError('');
                    }}
                    className="w-full text-xs text-[#696256] hover:text-[#161917] text-center transition-colors cursor-pointer"
                  >
                    ← Back to Sign Up
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6"
              >
                {/* Heading & Subtitle */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <h1 className="font-playfair text-3xl sm:text-4xl text-[#141715] font-normal tracking-tight leading-[1.12]">
                    {mode === 'signup' ? 'Create Account' : 'Welcome back !'}
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#696256] font-sans leading-relaxed">
                    {mode === 'signup'
                      ? 'Start protecting your brand assets with real-time AI governance.'
                      : 'The faster you fill up, the faster you get a ticket.'}
                  </p>
                </motion.div>

                {/* Error Banner */}
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                  {/* Full Name field (in signup mode) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label className="text-xs font-medium text-[#29241e] block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#ded7cc] text-xs sm:text-sm text-[#161917] placeholder-[#a2998c] focus:outline-none focus:border-[#1e5438] focus:ring-2 focus:ring-[#1e5438]/15 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                      />
                    </motion.div>
                  )}

                  {/* Email Field */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs font-medium text-[#29241e] block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'signup' ? 'Email' : 'Enter your email'}
                      required
                      className="w-full h-11 px-4 rounded-xl bg-white border border-[#ded7cc] text-xs sm:text-sm text-[#161917] placeholder-[#a2998c] focus:outline-none focus:border-[#1e5438] focus:ring-2 focus:ring-[#1e5438]/15 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </motion.div>

                  {/* Password Field with Eye Toggle */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs font-medium text-[#29241e] block">
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Password' : '••••••••••••'}
                        required
                        className="w-full h-11 pl-4 pr-11 rounded-xl bg-white border border-[#ded7cc] text-xs sm:text-sm text-[#161917] placeholder-[#a2998c] focus:outline-none focus:border-[#1e5438] focus:ring-2 focus:ring-[#1e5438]/15 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#857d72] hover:text-[#181d19] p-1 rounded transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember Me & Forgot Password */}
                  {mode === 'signin' && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between text-xs pt-0.5"
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-[#4e473e] hover:text-[#161917]">
                        <div
                          onClick={() => setRememberMe(!rememberMe)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            rememberMe
                              ? 'bg-[#1e5438] border-[#1e5438] text-white'
                              : 'bg-white border-[#cdc4b6]'
                          }`}
                        >
                          {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>Remember me</span>
                      </label>
                      <a
                        href="#forgot"
                        className="text-[#6d665b] hover:text-[#181d19] font-medium transition-colors"
                      >
                        Forgot Password
                      </a>
                    </motion.div>
                  )}

                  {/* Primary Action Button: "continue" (Image 1) or "Sign In" (Image 2) */}
                  <motion.button
                    variants={itemVariants}
                    type="submit"
                    whileHover={{ scale: 1.012, backgroundColor: '#090d0b' }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    disabled={isSubmitting || !!socialLoading}
                    className="w-full h-11 rounded-xl bg-[#141b16] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer relative overflow-hidden group transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                    <span>
                      {isSubmitting
                        ? 'Processing...'
                        : mode === 'signup'
                        ? 'continue'
                        : 'Sign In'}
                    </span>
                    <motion.div
                      animate={{ x: isSubmitting ? 4 : [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-4 h-4 text-white/90" />
                    </motion.div>
                  </motion.button>

                  {/* Divider: "or" */}
                  <motion.div variants={itemVariants} className="relative text-center py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#ded7cc]" />
                    </div>
                    <span className="relative bg-[#faf8f5] px-3 text-xs text-[#7e766a] font-medium">
                      or
                    </span>
                  </motion.div>

                  {/* Social Login Buttons: "continue with Google" & "continue with Microsoft" */}
                  <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Google Button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.015, y: -1, backgroundColor: '#ffffff' }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleGoogleAuth}
                      disabled={socialLoading !== null || isSubmitting}
                      className="h-11 rounded-xl bg-[#ffffff] border border-[#ded7cc] hover:border-[#c8c0b2] text-xs font-medium text-[#1c1917] flex items-center justify-center gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer disabled:opacity-60"
                    >
                      {socialLoading === 'google' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#1e5438]" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>
                            {mode === 'signup' ? 'continue with Google' : 'Sign In with Google'}
                          </span>
                        </>
                      )}
                    </motion.button>

                    {/* Microsoft Button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.015, y: -1, backgroundColor: '#ffffff' }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleMicrosoftAuth}
                      disabled={socialLoading !== null || isSubmitting}
                      className="h-11 rounded-xl bg-[#ffffff] border border-[#ded7cc] hover:border-[#c8c0b2] text-xs font-medium text-[#1c1917] flex items-center justify-center gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer disabled:opacity-60"
                    >
                      {socialLoading === 'microsoft' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#1e5438]" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                          </svg>
                          <span>
                            {mode === 'signup' ? 'continue with Microsoft' : 'Microsoft SSO'}
                          </span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Mode Toggle Footer */}
                  <motion.div variants={itemVariants} className="pt-3 text-center">
                    {mode === 'signup' ? (
                      <div className="text-xs text-[#524b42]">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signin');
                            setAuthError('');
                          }}
                          className="text-[#1e5438] hover:text-[#0f3422] font-semibold underline underline-offset-2 transition-colors ml-1 cursor-pointer"
                        >
                          Sign in
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#524b42]">
                        Don't have an account ?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup');
                            setAuthError('');
                          }}
                          className="text-[#1e5438] hover:text-[#0f3422] font-semibold underline underline-offset-2 transition-colors ml-1 cursor-pointer"
                        >
                          Create account
                        </button>
                      </div>
                    )}
                  </motion.div>

                  {/* Quick Authenticated Demo Access (Creator, Reviewer, Admin) */}
                  <motion.div variants={itemVariants} className="pt-3.5 border-t border-[#ded7cc]/80 text-center">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#736c62] font-semibold flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#1e5438]" />
                        <span>Demo Identities (Role-Based Access)</span>
                      </span>
                      <span className="text-[9px] text-[#9ca3af]">PW: BrandGuard2026!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoLogin('creator')}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl border border-[#ded7cc] bg-white hover:bg-[#f3eee7] text-left transition-all cursor-pointer group shadow-xs disabled:opacity-60"
                        title="Sign in as Lead Content Creator"
                      >
                        <span className="block font-bold text-xs text-[#1e5438] group-hover:text-[#113a25]">Creator</span>
                        <span className="block text-[10px] text-[#736c62] truncate">Alex Morgan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoLogin('reviewer')}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl border border-[#ded7cc] bg-white hover:bg-[#f3eee7] text-left transition-all cursor-pointer group shadow-xs disabled:opacity-60"
                        title="Sign in as Senior Compliance Reviewer"
                      >
                        <span className="block font-bold text-xs text-[#1e5438] group-hover:text-[#113a25]">Reviewer</span>
                        <span className="block text-[10px] text-[#736c62] truncate">Marcus Vance</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoLogin('admin')}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl border border-[#ded7cc] bg-white hover:bg-[#f3eee7] text-left transition-all cursor-pointer group shadow-xs disabled:opacity-60"
                        title="Sign in as Workspace Administrator"
                      >
                        <span className="block font-bold text-xs text-[#1e5438] group-hover:text-[#113a25]">Admin</span>
                        <span className="block text-[10px] text-[#736c62] truncate">Elena Rostova</span>
                      </button>
                    </div>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM METRIC BAR: Subtle security benchmark */}
        <div className="pt-2 z-10 border-t border-[#ece6dd]/70 flex items-center justify-between text-[11px] text-[#736c62]">
          <div className="flex items-center gap-1.5 font-medium text-[#1e5438]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1e5438]" />
            <span>SOC2 Type II & Truth Benchmarked</span>
          </div>
          <span className="font-mono text-[10px] text-[#8c8477]">v2.4-clerk</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Avant-Garde Editorial Visual (LAX Hero)      */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-1 lg:w-[52%] xl:w-[55%] h-full bg-[#0a0c10] text-white relative overflow-hidden flex-col justify-between p-8 xl:p-12">
        {/* Full-Bleed Mascot Editorial Artwork */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src="/mascot-editorial-hero.jpg"
            alt="BrandGuard Mascot LAX Editorial Campaign with Fluted Glass Ripple"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
          />
          {/* Subtle Dark Vignette & Atmospheric Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-[#08090c]/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10]/75 via-transparent to-[#0a0c10]/45 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(6,8,11,0.65)_100%)] pointer-events-none" />
        </div>

        {/* Top Header Overlay: LAX Guard Badge & BrandGuard Title */}
        <div className="relative z-20 w-full flex items-center justify-between">
          {/* Floating Badge: Mascot LAX Policy Indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#12161c]/80 backdrop-blur-md border border-white/10 shadow-lg"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-[#1e5438]/40 border border-[#84cc16]/50 flex items-center justify-center">
              <img
                src="/lax-icon.png"
                alt="LAX Mascot"
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="text-xs font-medium text-white/90 tracking-wide flex items-center gap-1.5">
              LAX Guard <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-pulse" />
            </span>
          </motion.div>

          {/* Top-Right High-Fashion Brand Title */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-right"
          >
            <span className="font-serif text-3xl xl:text-4xl font-normal tracking-tight text-white/95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              BrandGuard
            </span>
          </motion.div>
        </div>

        {/* Signature Fluted Glass Ripple Banner Overlay Across the Frame */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-36 z-10 pointer-events-none overflow-hidden">
          <div
            className="w-full h-full backdrop-blur-[2px] opacity-90 border-y border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
            style={{
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.12) 12px, rgba(0,0,0,0.15) 24px, rgba(255,255,255,0.03) 36px)',
            }}
          />
          {/* Chromatic Shimmer Glide Animation */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
          />
        </div>

        {/* Floating Brand Elements */}
        {/* 1. Floating Speech Bubble: "Same Ideas. Higher Standards." */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          className="absolute right-10 xl:right-16 top-24 z-20 hidden xl:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-xl"
        >
          <div className="w-2 h-2 rounded-full bg-[#84cc16] animate-ping" />
          <span className="text-xs font-medium tracking-wide">
            "Same Ideas. Higher Standards."
          </span>
        </motion.div>

        {/* 2. Floating Compliance Tag: BRAND SAFE • 100% */}
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut', delay: 0.5 }}
          className="absolute left-10 xl:left-14 top-32 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b16]/85 backdrop-blur-md border border-[#84cc16]/40 text-[#c7f284] shadow-lg text-[11px] font-mono tracking-tight"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>BRAND SAFE • 100%</span>
        </motion.div>

        {/* Bottom Editorial Content Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative z-20 max-w-lg space-y-3"
        >
          {/* Editorial Subject Heading: "LAX Guardian" */}
          <div className="space-y-1">
            <h2 className="font-serif text-3xl xl:text-4xl text-white font-normal tracking-tight drop-shadow-md">
              LAX Guardian
            </h2>
            <div className="text-xs font-mono uppercase tracking-wider text-[#86efac] flex items-center gap-1.5">
              <span>One standard. Zero false greens.</span>
            </div>
          </div>

          {/* Editorial Description Blurb */}
          <p className="text-xs sm:text-[13px] text-white/80 font-sans leading-relaxed drop-shadow-sm max-w-md">
            BrandGuard AI synchronizes generative intelligence with institutional brand integrity.
            Autonomous vision models analyze campaigns in milliseconds, safeguarding your voice across global frontiers.
          </p>

          <p className="text-[11px] text-[#a3b8a6] max-w-md leading-relaxed">
            Continuously auditing drafts against approved truth benchmarks and regulatory compliance rules.
          </p>

          {/* Thin Champagne Accent Rule */}
          <div className="w-12 h-[1.5px] bg-gradient-to-r from-[#d8c7a8] to-transparent rounded-full mt-2" />
        </motion.div>
      </div>
    </div>
  );
};
