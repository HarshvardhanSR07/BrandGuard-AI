import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
      </div>

      {/* Interactive LAX AI Assistant Floating Widget */}
      <LaxAssistant />
    </div>
  );
};
