import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion } from 'motion/react';
import { sidebarConfig } from '@/config/sidebar';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-slate-50 overflow-hidden flex">
      {/* Desktop Sidebar, hidden on mobile */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pb-[72px] lg:pb-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Grab-style Bottom Navigation for Mobile */}
      <nav className="block lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 z-[9999] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between h-[72px] px-2 pb-[env(safe-area-inset-bottom)]">
          {sidebarConfig.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation tap-highlight-transparent h-full cursor-pointer"
              >
                <div className={cn(
                  "relative p-1.5 rounded-2xl transition-all duration-200",
                  isActive ? "text-sky-600 bg-sky-50 shadow-sm" : "text-slate-400"
                )}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-tight transition-colors duration-200 whitespace-nowrap truncate w-full text-center px-1",
                  isActive ? "text-sky-600" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
