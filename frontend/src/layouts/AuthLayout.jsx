import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      
      {/* FIXED BACKGROUND IMAGE */}
      <div className="fixed inset-0 z-0">
        <img src="/hero-voting.png" alt="background" className="h-full w-full object-cover opacity-30 blur-sm scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-900/70 to-indigo-900/60 backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white drop-shadow-md">
          <ShieldCheck size={28} /> <span className="text-xl font-bold tracking-wide">VRS Kenya</span>
        </div>
        <Outlet />
        <p className="mt-6 text-center text-xs text-white/70">
          Demo/Administrative System — Not an official election registration platform.
        </p>
      </div>
    </div>
  );
}