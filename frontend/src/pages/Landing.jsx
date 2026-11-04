import { Link } from 'react-router-dom';
import { ShieldCheck, Users, BarChart3, Lock, Search, Vote, Trophy, ChevronRight, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

const features = [
  { icon: Vote, title: 'Cast Your Vote', desc: 'Verify your identity with your reference number and vote securely.', link: '/vote' },
  { icon: Trophy, title: 'Live Results', desc: 'Watch the tally update in real time as votes are counted.', link: '/results' },
{ icon: TrendingUp, title: 'Voter Turnout', desc: 'See turnout by county with color-coded cards and rankings.', link: '/turnout' },
  { icon: Users, title: 'Register Voter Records', desc: 'Multi-step guided registration with location intelligence.', link: '/login' },
  { icon: Search, title: 'Advanced Search', desc: 'Find records by name, reference, county, ward, station or status.', link: '/login' },
  { icon: BarChart3, title: 'Live Dashboards', desc: 'Real-time statistics by county, ward, and status.', link: '/login' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Administrator, Registration Officer, and Viewer roles.', link: '/login' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      <section className="relative overflow-hidden bg-blue-950">
        <div className="absolute inset-0">
          <img
            src="/hero-voting.png"
            alt=""
            className="h-full w-full object-cover"
            style={{ opacity: 0.35 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(23, 37, 84, 0.72)' }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32 text-center" style={{ color: '#ffffff' }}>
          <span className="inline-block rounded-full px-4 py-1 text-xs font-medium tracking-wide" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
            Demo / Administrative System
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            Your Voice, Your Vote
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: '#dbeafe' }}>
            A modern platform for voter registration, secure ballot casting, and transparent real-time results.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs" style={{ color: '#bfdbfe' }}>
            Not an official IEBC or government platform - for administrative and educational use only.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/vote"
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold shadow-lg transition hover:scale-105"
              style={{ background: '#ffffff', color: '#1e3a8a' }}
            >
              <Vote size={20} /> Cast Your Vote
              <ChevronRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/results"
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold transition"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }}
            >
              <Trophy size={20} /> View Live Results
              <ChevronRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm" style={{ color: '#dbeafe' }}>
            <Link to="/login" className="underline-offset-4 hover:underline">Officer Sign In</Link>
            <span>/</span>
            <Link to="/signup" className="underline-offset-4 hover:underline">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Everything you need</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.link}
              className="card group block transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-lg p-3" style={{ background: 'rgba(30,64,175,0.1)', color: '#1e40af' }}>
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 py-16" style={{ background: '#f8fafc' }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full p-3" style={{ background: 'rgba(30,64,175,0.1)', color: '#1e40af' }}>
            <Lock size={28} />
          </div>
          <h2 className="text-3xl font-bold">Secure by design</h2>
          <p className="mt-3 text-slate-600">
            Passwords hashed with bcrypt, signed JWTs, role-based access control on every endpoint,
            and full audit logging. Votes are anonymous, one per voter per position, enforced at the database level.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <p>Copyright {new Date().getFullYear()} Voter Registration Management System</p>
        <p className="mt-1">Demo/Administrative System - Not an official election registration platform.</p>
      </footer>
    </div>
  );
}