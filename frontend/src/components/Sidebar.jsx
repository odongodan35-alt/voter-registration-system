import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users, Search, BarChart3, ShieldCheck, FileText, Settings, LogOut, X, Vote, ListOrdered, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/voters/new', icon: UserPlus, label: 'Register Voter', roles: ['ADMINISTRATOR', 'REGISTRATION_OFFICER'] },
  { to: '/voters', icon: Users, label: 'Voter Records' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['ADMINISTRATOR', 'REGISTRATION_OFFICER'] },
  { to: '/admin/elections', icon: Vote, label: 'Elections', roles: ['ADMINISTRATOR'] },
  { to: '/admin/positions', icon: ListOrdered, label: 'Positions', roles: ['ADMINISTRATOR'] },
  { to: '/admin/candidates', icon: UserCheck, label: 'Candidates', roles: ['ADMINISTRATOR'] },
  { to: '/users', icon: ShieldCheck, label: 'Users', roles: ['ADMINISTRATOR'] },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['ADMINISTRATOR'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['ADMINISTRATOR'] }
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/20 bg-white/70 backdrop-blur-xl transition-transform dark:border-slate-700/50 dark:bg-slate-900/70 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/20 px-4 dark:border-slate-700/50">
          <span className="font-bold text-brand dark:text-blue-400">VRS Admin</span>
          <button onClick={onClose} className="md:hidden" aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.filter(l => !l.roles || l.roles.includes(user?.role)).map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/voters'} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <l.icon size={18} /> {l.label}
            </NavLink>
          ))}
          <button onClick={logout} className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>
    </>
  );
}