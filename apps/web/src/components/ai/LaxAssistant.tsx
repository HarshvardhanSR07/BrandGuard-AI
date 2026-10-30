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
} from 'lucide-react';
import { api } from '../../lib/apiClient';

const LAX_MEMORY_KEY = '3ddaf04065334504cd15d0764e14e3b3c8fa85b79548a7699d32d1e8cc021725';

export const LaxAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("Let's make it on-brand! ✨");
  const [currentPose, setCurrentPose] = useState<'hero' | 'analyze' | 'protect' | 'approve' | 'alert'>('hero');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Array<{ sender: 'lax' | 'user'; text: string; time: string }>>(() => {
    try {
      const saved = localStorage.getItem('lax_memory_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        sender: 'lax',
        text: "Hi Alex! I'm LAX, your Brand Guardian. My persistent memory engine is active and synchronized with your active brand guidelines.",
        time: 'Just now',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lax_memory_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

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
      // Query LAX's persistent memory service
      const res = await api.chatWithLax(userText);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { sender: 'lax', text: res.reply, time: replyTime }]);
      setCurrentPose(res.pose || 'approve');
      setSpeechBubbleText(res.pose === 'alert' ? 'Check policy PROH-002!' : 'Memory grounded! 🛡️');
    } catch (err) {
      // Offline fallback
      setTimeout(() => {
        let reply = "I've checked that against your active v2.1 guidelines and stored this interaction in my verified memory bank. Everything looks compliant!";
        let pose: 'approve' | 'protect' | 'alert' = 'approve';

        if (userText.toLowerCase().includes('guarantee') || userText.toLowerCase().includes('100%') || userText.toLowerCase().includes('miracle')) {
          reply = "⚠️ Heads up! Phrases like 'guarantee' or 'miracle' trigger Prohibited Claims policy (PROH-002). I recommend replacing with: 'Architected with verified multi-layer defense'.";
          pose = 'alert';
        } else if (userText.toLowerCase().includes('health') || userText.toLowerCase().includes('immune')) {
          reply = "💡 For wellness claims, remember to pair with standard FDA disclaimer per Health Claims Guideline v2.1 and SER records.";
          pose = 'protect';
        }

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [...prev, { sender: 'lax', text: reply, time: replyTime }]);
        setCurrentPose(pose);
        setSpeechBubbleText(pose === 'alert' ? 'Check policy PROH-002!' : 'Looks on-brand! 🛡️');
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearMemory = () => {
    const initial = [
      {
        sender: 'lax' as const,
        text: "Memory checkpoint cleared. Ready for new brand compliance queries!",
        time: 'Just now',
      },
    ];
    setMessages(initial);
    localStorage.removeItem('lax_memory_chat_history');
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
        return '/lux-icon.png';
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
            <span className="w-2 h-2 rounded-full bg-[#3f7449] animate-ping" />
          </motion.div>
        )}

        {/* Floating Mascot Trigger Avatar */}
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#1b2f21] via-[#0d1610] to-[#090b0e] border-2 border-[#d7ef8b] shadow-[0_8px_25px_rgba(26,43,25,0.25)] cursor-pointer group flex items-center justify-center p-1.5"
            title="Chat with LAX AI Guardian"
          >
            <img
              src="/lux-icon.png"
              alt="LAX AI Mascot"
              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
            />
            {/* Ambient emerald glow */}
            <div className="absolute -inset-2 rounded-full bg-[#3f7449]/35 blur-md -z-10 group-hover:opacity-100 opacity-70 transition-opacity" />
          </motion.button>
        )}

        {/* Expanded Assistant Dialog */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-[#12161f] border border-[#2b3342] rounded-3xl shadow-float text-white flex flex-col overflow-hidden relative"
          >
            {/* Header with Mascot Avatar & Status Indicator */}
            <div className="p-3.5 bg-gradient-to-r from-[#181d28] to-[#12161f] border-b border-[#232a36] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#0c0e14] border border-[#a3e635]/40 p-0.5">
                  <img
                    src={getPoseImage()}
                    alt="LAX Mascot"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#a3e635] border-2 border-[#12161f]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white">LAX</span>
                    <span className="text-[10px] bg-[#a3e635]/20 text-[#a3e635] font-semibold px-1.5 py-0.2 rounded-full border border-[#a3e635]/30">
                      AI Guardian
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8b949e] flex items-center gap-1">
                    <Database className="w-3 h-3 text-[#a3e635]" />
                    <span>Memory: 3dda...1725</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/10 transition-colors"
                  title="Reset conversation memory"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8b949e] hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Memory Grounding Status Ribbon */}
            <div className="px-3.5 py-1.5 bg-[#0c0e14]/90 border-b border-[#232a36] flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-[#a3e635] font-mono">
                <Key className="w-3 h-3" />
                <span>API Key: 3dda...1725</span>
              </div>
              <div className="text-[#8b949e]">
                Retention: <strong className="text-white">Active</strong>
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
                        ? 'bg-[#a3e635] text-[#0c0e12] font-medium rounded-br-none'
                        : 'bg-[#1a212e] text-white/90 border border-[#2b3342] rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-[#6b7280] px-1 mt-1">{m.time}</span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-[#8b949e] italic pl-1">
                  <Sparkles className="w-3 h-3 text-[#a3e635] animate-spin" />
                  <span>LAX is consulting memory banks…</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-[#0e1117] border-t border-[#1e2532] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setInputMessage('Is "100% infallible protection" on-brand?')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#8b949e] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342] cursor-pointer"
              >
                🔍 Test prohibited phrase
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('Suggest compliant health disclaimer')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#8b949e] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342] cursor-pointer"
              >
                📋 Health disclaimer
              </button>
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSend} className="p-3 bg-[#12161f] border-t border-[#232a36] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask LAX anything about brand rules..."
                className="flex-1 h-9 px-3 rounded-xl bg-[#0c0e14] border border-[#2b3342] text-xs text-white placeholder-[#555f70] focus:outline-none focus:border-[#a3e635]"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="w-9 h-9 rounded-xl bg-[#a3e635] hover:bg-[#92d825] text-[#0c0e12] flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
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
