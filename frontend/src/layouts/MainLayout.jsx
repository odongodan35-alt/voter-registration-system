import { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="relative flex min-h-screen bg-slate-100 dark:bg-slate-900">
      
      {/* FIXED BACKGROUND IMAGE */}
      <div className="fixed inset-0 z-0">
        <img src="/hero-voting.png" alt="background" className="h-full w-full object-cover opacity-20 blur-sm scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 dark:from-slate-900/90 dark:to-slate-900/95 backdrop-blur-[2px]" />
      </div>

      <Sidebar open={open} onClose={() => setOpen(false)} />
      
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/20 bg-white/60 px-4 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/60">
          <button onClick={() => setOpen(true)} className="md:hidden" aria-label="Open menu"><Menu /></button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <button onClick={() => setDark(d => !d)} className="rounded-full p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition" aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="text-right">
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs text-brand dark:text-blue-400 font-medium">{user?.role}</div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
        
        <footer className="border-t border-white/20 bg-white/30 p-3 text-center text-xs text-slate-500 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/30 dark:text-slate-400">
          Demo/Administrative System — Not an official election registration platform.
        </footer>
      </div>
    </div>
  );
}