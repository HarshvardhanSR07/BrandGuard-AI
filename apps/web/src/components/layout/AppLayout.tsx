import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CommandMenu } from '../ui/CommandMenu';
import { LaxAssistant } from '../ai/LaxAssistant';

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('bg_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bg_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Global hotkeys (Ctrl+B for sidebar toggle, Cmd+K / Ctrl+K for command menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#f7f8f5] text-[#202820] overflow-hidden font-sans">
      {/* Left Desktop Navigation Sidebar (Collapsible) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Mobile Slide-over Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Workstation Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f7f8f5]">
        <Header
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        />

        {/* Dynamic Page Outlet with smooth scrolling and stable layout */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0" id="main-content">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Accessible Command Menu (Cmd+K / Ctrl+K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />

      {/* Interactive LAX AI Assistant Floating Widget */}
      <LaxAssistant />
    </div>
  );
};

export default AppLayout;
