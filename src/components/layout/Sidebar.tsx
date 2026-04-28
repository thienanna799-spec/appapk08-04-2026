import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sidebarConfig } from '@/config/sidebar';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-sky-600 text-sky-100 flex-col">
      <div className="flex flex-col h-full">
        <div className="p-6 pt-10 flex items-center gap-3">
          <img 
            src="/gep-logo.png" 
            alt="GEP" 
            className="w-12 h-12 object-contain brightness-0 invert"
          />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">GEP</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-sky-200 mt-1">Driver Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarConfig.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all duration-300 outline-none",
                  isActive 
                    ? "bg-white text-sky-600 shadow-xl shadow-sky-900/20" 
                    : "text-sky-100 hover:bg-sky-500/50 hover:text-white"
                )}
              >
                <Icon size={22} className={isActive ? "text-sky-600" : ""} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <footer className="p-6 border-t border-sky-500">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 text-center">v1.1.0 • APK Ready</p>
        </footer>
      </div>
    </aside>
  );
}
