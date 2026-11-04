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
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => setOpen(true)} className="md:hidden" aria-label="Open menu"><Menu /></button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <button onClick={() => setDark(d => !d)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="text-right">
              <div className="font-medium">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
        <footer className="border-t border-slate-200 p-3 text-center text-xs text-slate-500 dark:border-slate-800">
          Demo/Administrative System — Not an official election registration platform.
        </footer>
      </div>
    </div>
  );
}