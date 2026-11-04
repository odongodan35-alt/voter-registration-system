import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2 text-brand dark:text-blue-400">
          <ShieldCheck /> <span className="font-bold">Voter Registration MS</span>
        </div>
        <Outlet />
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo/Administrative System — Not an official election registration platform.
        </p>
      </div>
    </div>
  );
}