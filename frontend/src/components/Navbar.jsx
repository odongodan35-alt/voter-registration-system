import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Vote, Trophy, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path) =>
    'hidden sm:inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ' +
    (pathname === path
      ? 'bg-brand text-white'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand dark:text-blue-400">
          <ShieldCheck /> <span className="hidden sm:inline">Voter Registration MS</span>
          <span className="sm:hidden">VRS</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/vote" className={linkClass('/vote')}>
            <Vote size={16} /> Vote
          </Link>
          <Link to="/results" className={linkClass('/results')}>
            <Trophy size={16} /> Results
          </Link>
          <Link to="/turnout" className={linkClass('/turnout')}>
            <TrendingUp size={16} /> Turnout
          </Link>
          <Link to="/login" className="btn-secondary">Sign In</Link>
          <Link to="/signup" className="btn-primary hidden sm:inline-flex">Create Account</Link>
        </div>
      </nav>
    </header>
  );
}