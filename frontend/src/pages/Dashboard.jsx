import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, Clock, Plus, Search as SearchIcon, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { fmtDate } from '../utils/format.js';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/statistics').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (!stats) return <p>Unable to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of registration activity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/voters/new" className="btn-primary"><Plus size={16} /> New Registration</Link>
          <Link to="/voters" className="btn-secondary"><Users size={16} /> View Records</Link>
          <Link to="/search" className="btn-secondary"><SearchIcon size={16} /> Search</Link>
          <Link to="/reports" className="btn-secondary"><FileText size={16} /> Reports</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Records" value={stats.totalRecords} />
        <StatCard icon={Calendar} label="Today" value={stats.todayRegistrations} />
        <StatCard icon={CheckCircle} label="Verified" value={stats.verifiedRecords} />
        <StatCard icon={Clock} label="Pending" value={stats.pendingRecords} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Registrations by County</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stats.registrationsByCounty}>
                <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Bar dataKey="value" fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Activity over last 7 days</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={stats.registrationsOverTime}>
                <XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">By Ward</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stats.registrationsByWard}>
                <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {stats.registrationsByGender.length > 0 && (
          <div className="card">
            <h2 className="mb-3 font-semibold">By Gender</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.registrationsByGender} dataKey="value" nameKey="name" outerRadius={80} label>
                    {stats.registrationsByGender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Recent Registrations</h2>
        {stats.recentRecords.length === 0 ? (
          <p className="text-sm text-slate-500">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left dark:border-slate-700">
                <tr><th className="py-2">Reference</th><th>Name</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {stats.recentRecords.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2"><Link to={`/voters/${r.id}`} className="text-brand hover:underline">{r.referenceNumber}</Link></td>
                    <td>{r.fullName}</td>
                    <td>{r.registrationStatus}</td>
                    <td>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}