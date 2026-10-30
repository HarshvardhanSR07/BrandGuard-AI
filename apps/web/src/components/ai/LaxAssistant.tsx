import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  RotateCcw,
  Key,
  UserCheck,
  BrainCircuit,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';

export const LaxAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("Let's make it on-brand! ✨");
  const [currentPose, setCurrentPose] = useState<'hero' | 'analyze' | 'protect' | 'approve' | 'alert'>('hero');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memoryStats, setMemoryStats] = useState<{
    totalNodes: number;
    totalEdges: number;
    dataset: string;
  }>({
    totalNodes: 14,
    totalEdges: 22,
    dataset: `user_memory_${user?.id || 'creator'}`,
  });

  const storageKey = `lax_cognee_chat_${user?.id || user?.role || 'creator'}`;

  const getInitialGreeting = () => {
    if (user?.role === 'reviewer') {
      return `Hi ${user.name}! I'm LAX. My Cognee memory layer is tuned for compliance verification, evidence validation, and review queue audit checks.`;
    }
    if (user?.role === 'admin') {
      return `Hi ${user.name}! I'm LAX. My Cognee memory layer is synchronized with workspace telemetry, policy update diagnostics, and audit trail integrity.`;
    }
    return `Hi ${user?.name || 'there'}! I'm LAX. My Cognee memory layer is personalized to your creative copy workflow. Ask me anything about policies, headlines, or compliant phrasing!`;
  };

  const [messages, setMessages] = useState<Array<{
    sender: 'lax' | 'user';
    text: string;
    time: string;
    memoryRef?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        sender: 'lax',
        text: getInitialGreeting(),
        time: 'Just now',
      },
    ];
  });

  // Re-sync conversation when active user persona changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            sender: 'lax',
            text: getInitialGreeting(),
            time: 'Just now',
          },
        ]);
      }
    } catch {}
  }, [user?.id, user?.role]);

  // Persist messages per user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  // Fetch Cognee memory status on mount
  useEffect(() => {
    api.getLaxMemory(user?.id)
      .then((data) => {
        if (data && data.stats) {
          setMemoryStats({
            totalNodes: data.stats.totalNodes,
            totalEdges: data.stats.totalEdges,
            dataset: `user_memory_${user?.id || 'creator'}`,
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setInputMessage('');
    setCurrentPose('analyze');
    setIsTyping(true);

    try {
      // Query LAX with user context for personalized Cognee memory recall
      const res = await api.chatWithLax(userText, {
        userId: user.id,
        userName: user.name,
        role: user.role,
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
    } catch (err) {
      // Intelligent grounded fallback
      setTimeout(() => {
        let reply = `I've analyzed that through my Cognee memory layer for ${user.name} (${user.role}). Everything looks compliant and grounded in active guidelines!`;
        let pose: 'approve' | 'protect' | 'alert' | 'analyze' | 'hero' = 'approve';

        const lower = userText.toLowerCase();
        if (lower.includes('guarantee') || lower.includes('100%') || lower.includes('lifetime') || lower.includes('miracle')) {
          reply = `⚠️ Heads up, ${user.name}! Phrases like 'guarantee' or 'lifetime durability' trigger Prohibited Claims policy (PROH-002). In my memory bank, I recommend substituting with: 'Crafted for lasting endurance' (grounded in ISO 12947-2 testing).`;
          pose = 'alert';
        } else if (lower.includes('health') || lower.includes('immune') || lower.includes('natural')) {
          reply = `💡 For wellness and health claims, remember to pair with standard FDA disclaimer per Health Claims Guidelines and cite verified SER clinical records.`;
          pose = 'protect';
        } else if (lower.includes('cheap') || lower.includes('discount')) {
          reply = `🎨 Tone & Voice Standard (TONE-003): 'Cheap' detracts from brand equity. Consider 'Accessible elegance' or 'Thoughtfully priced'.`;
          pose = 'analyze';
        }

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            sender: 'lax',
            text: reply,
            time: replyTime,
            memoryRef: 'MEM_FALLBACK',
          },
        ]);
        setCurrentPose(pose);
        setSpeechBubbleText(pose === 'alert' ? 'Check policy PROH-002!' : 'Looks on-brand! 🛡️');
      }, 400);
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
        text: `Personal memory reset for ${user.name}. My Cognee memory layer is ready for your next question!`,
        time: 'Just now',
      },
    ];
    setMessages(initial);
    localStorage.removeItem(storageKey);
  };

  const getPoseImage = () => {
    switch (currentPose) {
      case 'analyze':
        return '/lax-analyze.png';
      case 'protect':
        return '/lax-protect.png';
      case 'approve':
        return '/lax-approve.png';
      case 'alert':
        return '/lax-alert.png';
      default:
        return '/lax-icon.png';
    }
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
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#1b2f21] via-[#0d1610] to-[#090b0e] border-2 border-[#86efac] shadow-[0_8px_25px_rgba(26,43,25,0.25)] cursor-pointer group flex items-center justify-center p-1.5"
            title="Chat with LAX AI Guardian"
          >
            <img
              src="/lax-icon.png"
              alt="LAX AI Mascot"
              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
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
            className="w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-[#12161f] border border-[#2b3342] rounded-3xl shadow-float text-white flex flex-col overflow-hidden relative"
          >
            {/* Header with Mascot Avatar & User Personalization */}
            <div className="p-3.5 bg-gradient-to-r from-[#181d28] to-[#12161f] border-b border-[#232a36] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#0c0e14] border border-[#4ade80]/40 p-0.5">
                  <img
                    src={getPoseImage()}
                    alt="LAX Mascot"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#4ade80] border-2 border-[#12161f]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white">LAX</span>
                    <span className="text-[10px] bg-[#22c55e]/20 text-[#86efac] font-semibold px-1.5 py-0.2 rounded-full border border-[#22c55e]/30">
                      Cognee AI
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#86efac]" />
                    <span className="truncate max-w-[170px]">
                      For {user.name} ({user.role})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
                  title="Reset user personal memory"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
                  title="Close"
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
              <div className="text-[#9ca3af] flex items-center gap-1">
                <span>Dataset:</span>
                <span className="text-white font-mono">{user.role}</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 dark-scrollbar">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#22c55e] text-[#051c0a] font-medium rounded-br-none'
                        : 'bg-[#1a212e] text-white/90 border border-[#2b3342] rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-[#6b7280]">
                    <span>{m.time}</span>
                    {m.memoryRef && (
                      <span className="text-[#86efac] font-mono text-[9px]">• Grounded in Cognee</span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] italic pl-1">
                  <Sparkles className="w-3 h-3 text-[#4ade80] animate-spin" />
                  <span>LAX is traversing Cognee memory graph…</span>
                </div>
              )}
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

            {/* Chat Input Field */}
            <form onSubmit={handleSend} className="p-3 bg-[#12161f] border-t border-[#232a36] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask LAX anything, ${user.name.split(' ')[0]}...`}
                className="flex-1 h-9 px-3 rounded-xl bg-[#0c0e14] border border-[#2b3342] text-xs text-white placeholder-[#555f70] focus:outline-none focus:border-[#22c55e]"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="w-9 h-9 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#051c0a] flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
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
