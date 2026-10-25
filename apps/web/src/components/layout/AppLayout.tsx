import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ScrollBasedVelocity } from '../ui/scroll-based-velocity';
import { LaxAssistant } from '../ai/LaxAssistant';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#f7f8f5] text-[#202820] overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f7f8f5]">
        <Header />

        {/* Dynamic Outlet Canvas with Clean Tactile Alabaster Styling */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Bottom Velocity Marquee Compliance Ticker */}
        <footer className="h-7 border-t border-[#e7ebe3] bg-[#ffffff] flex items-center overflow-hidden shrink-0 select-none">
          <ScrollBasedVelocity
            text="LAX AI ASSISTANT ONLINE · ON-BRAND DETERMINISTIC GOVERNANCE · REAL FACTS STRONGER STORIES · ZERO UNVERIFIED CLAIMS ·"
            default_velocity={18}
            className="text-[10px] font-mono tracking-widest text-[#858d83]"
          />
        </footer>
      </div>

      {/* Interactive LAX AI Assistant Floating Widget */}
      <LaxAssistant />
    </div>
  );
};
