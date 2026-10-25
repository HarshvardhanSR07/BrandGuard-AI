import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

export const LaxAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("Let's make it on-brand! ✨");
  const [currentPose, setCurrentPose] = useState<'hero' | 'analyze' | 'protect' | 'approve' | 'alert'>('hero');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'lax' | 'user'; text: string; time: string }>>([
    {
      sender: 'lax',
      text: "Hi Alex! I'm LAX, your Brand Guardian. I continuously monitor drafts to make sure your messaging is safe, verified, and 100% on-brand.",
      time: 'Just now',
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setInputMessage('');
    setCurrentPose('analyze');

    // Simulate smart AI response
    setTimeout(() => {
      let reply = "I've checked that against your active v2.1 guidelines. Everything looks compliant and grounded in your approved facts database!";
      let pose: 'approve' | 'protect' | 'alert' = 'approve';

      if (userText.toLowerCase().includes('guarantee') || userText.toLowerCase().includes('100%') || userText.toLowerCase().includes('miracle')) {
        reply = "⚠️ Heads up! Phrases like 'guarantee' or 'miracle' trigger our Prohibited Claims policy (PROH-002). I recommend replacing with: 'Architected with verified multi-layer defense'.";
        pose = 'alert';
      } else if (userText.toLowerCase().includes('health') || userText.toLowerCase().includes('immune')) {
        reply = "💡 For wellness claims, please remember to pair with standard FDA disclaimer per Health Claims Guideline v2.1.";
        pose = 'protect';
      }

      setMessages((prev) => [...prev, { sender: 'lax', text: reply, time: 'Just now' }]);
      setCurrentPose(pose);
      setSpeechBubbleText(pose === 'alert' ? 'Check policy PROH-002!' : 'Looks on-brand! 🛡️');
    }, 700);
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
            title="Chat with LUX AI Assistant"
          >
            <img
              src="/lux-icon.png"
              alt="LUX AI Mascot"
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
            className="w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-[#12161f] border border-[#2b3342] rounded-3xl shadow-float text-white flex flex-col overflow-hidden relative"
          >
            {/* Header with Mascot Avatar & Status Indicator */}
            <div className="p-4 bg-gradient-to-r from-[#181d28] to-[#12161f] border-b border-[#232a36] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#0c0e14] border border-[#a3e635]/40 p-0.5">
                  <img
                    src={getPoseImage()}
                    alt="LAX Mascot"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#a3e635] border-2 border-[#12161f]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white">LAX</span>
                    <span className="text-[10px] bg-[#a3e635]/20 text-[#a3e635] font-semibold px-1.5 py-0.2 rounded-full border border-[#a3e635]/30">
                      AI Guardian
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8b949e]">Brand Safe & Active</div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-4 py-2 bg-[#0c0e14]/60 border-b border-[#232a36] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#a3e635]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On-Brand: 92%</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#f59e0b]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Needs Review: 3</span>
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
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-[#0e1117] border-t border-[#1e2532] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setInputMessage('Is "100% infallible protection" on-brand?')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#8b949e] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342]"
              >
                🔍 Test prohibited phrase
              </button>
              <button
                onClick={() => setInputMessage('Suggest compliant health disclaimer')}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-[#8b949e] hover:text-white whitespace-nowrap transition-colors border border-[#2b3342]"
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
                className="w-9 h-9 rounded-xl bg-[#a3e635] hover:bg-[#92d825] text-[#0c0e12] flex items-center justify-center font-bold transition-transform active:scale-95"
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
