import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  UserCheck,
  BrainCircuit,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Mascot } from '../ui/Mascot';
import { LaxMessageRenderer } from './LaxMessageRenderer';

export const LaxAssistant: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("Let's make it on-brand! ✨");
  const [currentPose, setCurrentPose] = useState<'hero' | 'analyze' | 'protect' | 'approve' | 'alert'>('hero');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive dynamic authenticated user info (Alex Morgan, or active logged in user)
  const displayName = user?.name || 'Alex Morgan';
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';

  const [memoryStats, setMemoryStats] = useState<{
    totalNodes: number;
    totalEdges: number;
    dataset: string;
  }>({
    totalNodes: 14,
    totalEdges: 22,
    dataset: user?.role || 'creator',
  });

  // Strict workspace and user isolation key for conversation history
  const storageKey = `lax_cognee_chat_${user?.id || 'usr_alex_creator'}_${workspace?.id || 'ws_acme_global'}`;

  const getInitialGreeting = () => {
    if (user?.role === 'reviewer') {
      return `Hi ${firstName}! I'm LAX. Your brand compliance assistant is ready to help with review queue checks, policy verification, and evidence validation.`;
    }
    if (user?.role === 'admin') {
      return `Hi ${firstName}! I'm LAX. Your brand compliance assistant is ready to help with workspace telemetry, policy diagnostics, and governance integrity.`;
    }
    return `Hi ${firstName}! I'm LAX. Your brand compliance assistant is ready to help with policies, claims, headlines, and compliant phrasing.`;
  };

  const [messages, setMessages] = useState<Array<{
    sender: 'lax' | 'user';
    text: string;
    time: string;
    memoryRef?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        sender: 'lax',
        text: getInitialGreeting(),
        time: 'Just now',
      },
    ];
  });

  // Re-sync conversation when active user or workspace persona changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}

    setMessages([
      {
        sender: 'lax',
        text: getInitialGreeting(),
        time: 'Just now',
      },
    ]);
  }, [user?.id, user?.role, user?.name, workspace?.id]);

  // Persist messages per user & workspace isolation
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  // Smooth scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Fetch Cognee memory status on mount and when user changes
  useEffect(() => {
    api.getLaxMemory(user?.id)
      .then((data) => {
        if (data && data.stats) {
          setMemoryStats({
            totalNodes: data.stats.totalNodes || 14,
            totalEdges: data.stats.totalEdges || 22,
            dataset: user?.role || 'creator',
          });
        }
      })
      .catch(() => {});
  }, [user?.id, user?.role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setInputMessage('');
    setCurrentPose('analyze');
    setIsTyping(true);

    try {
      // Query LAX with authenticated user context for personalized Cognee memory recall
      const res = await api.chatWithLax(userText, {
        userId: user?.id,
        userName: displayName,
        role: user?.role || 'creator',
        workspaceId: workspace?.id,
      });

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'lax',
          text: res.reply,
          time: replyTime,
          memoryRef: res.memoryReference,
        },
      ]);
      setCurrentPose(res.pose || 'approve');
      setSpeechBubbleText(res.pose === 'alert' ? 'Check policy PROH-002!' : 'Memory grounded! 🛡️');

      if (res.cogneeStats) {
        setMemoryStats((prev) => ({
          ...prev,
          totalNodes: res.cogneeStats?.totalNodes || prev.totalNodes,
          totalEdges: res.cogneeStats?.totalEdges || prev.totalEdges,
        }));
      }
    } catch (err: any) {
      console.error('LAX API error:', err);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'lax',
          text: `⚠️ I was unable to complete the compliance analysis (${err?.message || 'Network request failed'}). Please ensure the API server is reachable and try again.`,
          time: replyTime,
        },
      ]);
      setCurrentPose('alert');
      setSpeechBubbleText('Service connection error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearMemory = async () => {
    if (user?.id) {
      try {
        await api.forgetLaxMemory(user.id);
      } catch {}
    }
    const initial = [
      {
        sender: 'lax' as const,
        text: `Conversation restarted for ${displayName}. My Cognee memory layer is ready for your questions!`,
        time: 'Just now',
      },
    ];
    setMessages(initial);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      <AnimatePresence>
        {/* Floating Speech Bubble when closed */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-20 right-2 bg-white/95 text-[#202820] px-3.5 py-2 rounded-2xl shadow-[0_8px_25px_rgba(26,43,25,0.14)] border border-[#dce2d7] text-xs font-semibold whitespace-nowrap flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsOpen(true)}
          >
            <span>{speechBubbleText}</span>
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-ping" />
          </motion.div>
        )}

        {/* Floating Mascot Trigger Avatar */}
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#1b2f21] via-[#0d1610] to-[#090b0e] border-2 border-[#86efac] shadow-[0_8px_25px_rgba(26,43,25,0.25)] cursor-pointer group flex items-center justify-center p-1"
            title="Chat with LAX AI Guardian"
            aria-label="Open LAX AI Assistant"
          >
            <Mascot
              directions="/mascots/lax-directions.webp?v=2"
              reactions="/mascots/lax-reactions.webp?v=2"
              size={52}
              fallbackImage="/lax-icon.png"
              className="transition-transform group-hover:scale-110"
              label="LAX Floating Mascot"
            />
            {/* Ambient emerald glow */}
            <div className="absolute -inset-2 rounded-full bg-[#16a34a]/35 blur-md -z-10 group-hover:opacity-100 opacity-70 transition-opacity" />
          </motion.button>
        )}

        {/* Expanded Assistant Dialog */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-[#12161f] border border-[#2b3342] rounded-3xl shadow-float text-white flex flex-col overflow-hidden relative font-sans"
          >
            {/* Header with Animated Mascot Avatar & Dynamic User Personalization */}
            <div className="p-3.5 bg-gradient-to-r from-[#181d28] via-[#141923] to-[#12161f] border-b border-[#232a36] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Animated LAX Mascot Container */}
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#0c0e14] border border-[#4ade80]/40 p-0.5 flex items-center justify-center shadow-xs">
                  <Mascot
                    directions="/mascots/lax-directions.webp?v=2"
                    reactions="/mascots/lax-reactions.webp?v=2"
                    size={32}
                    className="transition-transform hover:scale-105"
                    label="LAX Animated Mascot"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#4ade80] border-2 border-[#12161f]" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white">LAX</span>
                    <span className="text-[10px] bg-[#22c55e]/15 text-[#86efac] font-semibold px-2 py-0.5 rounded-full border border-[#22c55e]/30">
                      Brand Guardian
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#86efac] bg-[#0c2415] px-1.5 py-0.5 rounded-full border border-[#225431]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                      <span>Cognee Active</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9ca3af] flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3 h-3 text-[#86efac]" />
                    <span className="truncate max-w-[170px]">
                      For {displayName} ({user?.role || 'Creator'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Restart conversation"
                  aria-label="Restart conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
                  title="Close"
                  aria-label="Close assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cognee Memory Grounding Status Ribbon */}
            <div className="px-3.5 py-1.5 bg-[#0c0e14]/90 border-b border-[#232a36] flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-[#86efac] font-mono">
                <BrainCircuit className="w-3 h-3 text-[#4ade80]" />
                <span>Cognee Graph: {memoryStats.totalNodes} Nodes</span>
              </div>
              <div className="text-[#9ca3af] flex items-center gap-1.5">
                <span>Dataset:</span>
                <span className="text-white font-mono bg-[#181d28] px-1.5 py-0.2 rounded border border-[#232a36]">
                  {user?.role || 'creator'}
                </span>
                <span>•</span>
                <span className="text-[#86efac] truncate max-w-[90px]">
                  {workspace?.name || 'Acme Global'}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 dark-scrollbar">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-[#22c55e] text-[#051c0a] font-medium rounded-tr-xs'
                        : 'bg-[#1a212e] text-white/90 border border-[#2b3342] rounded-tl-xs'
                    }`}
                  >
                    <LaxMessageRenderer content={m.text} sender={m.sender} />
                  </div>
                  <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-[#6b7280]">
                    <span>{m.time}</span>
                    {m.memoryRef && (
                      <span className="text-[#86efac] font-mono text-[9px] flex items-center gap-1">
                        <span>•</span>
                        <span>Grounded in Cognee</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#9ca3af] italic pl-1 bg-[#1a212e]/50 border border-[#2b3342]/40 rounded-xl px-3 py-2 max-w-[85%]">
                  <Sparkles className="w-3.5 h-3.5 text-[#4ade80] animate-spin shrink-0" />
                  <span>LAX is traversing Cognee memory graph…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-[#0e1117] border-t border-[#1e2532] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setInputMessage('Is "guaranteed lifetime durability" compliant?')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#9ca3af] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342] cursor-pointer"
              >
                🔍 Check durability claim
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('Can you rewrite this headline to be on-brand?')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#9ca3af] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342] cursor-pointer"
              >
                ✨ Rewrite headline
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('What are the rules for health disclaimers?')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#9ca3af] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342] cursor-pointer"
              >
                📋 FDA health rule
              </button>
            </div>

            {/* Chat Input Field with accessibility & keyboard handling */}
            <form onSubmit={handleSend} className="p-3 bg-[#12161f] border-t border-[#232a36] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`Ask LAX anything, ${firstName}...`}
                disabled={isTyping}
                className="flex-1 h-9 px-3 rounded-xl bg-[#0c0e14] border border-[#2b3342] text-xs text-white placeholder-[#555f70] focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/25 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isTyping || !inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#051c0a] flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-[#22c55e] cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LaxAssistant;
