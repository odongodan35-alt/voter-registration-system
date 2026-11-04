import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, Clock, Plus, Search as SearchIcon, FileText, MapPin, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { fmtDate, fmtDateTime } from '../utils/format.js';

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
      {/* Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">Dashboard</h1>
<p className="text-sm font-medium text-slate-600 dark:text-slate-400">Overview of registration activity</p>
          <p className="text-sm text-slate-500">Overview of registration activity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/voters/new" className="btn-primary"><Plus size={16} /> New Registration</Link>
          <Link to="/voters" className="btn-secondary"><Users size={16} /> View Records</Link>
          <Link to="/reports" className="btn-secondary"><FileText size={16} /> Reports</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Records" value={stats.totalRecords} />
        <StatCard icon={Calendar} label="Today" value={stats.todayRegistrations} />
        <StatCard icon={CheckCircle} label="Verified" value={stats.verifiedRecords} />
        <StatCard icon={Clock} label="Pending" value={stats.pendingRecords} />
      </div>

      {/* Charts Row 1 */}
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
          <h2 className="mb-3 font-semibold">Registration Trend (Last 30 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={stats.registrationsOverTime}>
                <XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
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
        
        {stats.registrationsByGender.length > 0 ? (
          <div className="card">
            <h2 className="mb-3 font-semibold">By Gender</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.registrationsByGender} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {stats.registrationsByGender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center text-slate-400">No gender data yet</div>
        )}
      </div>

      {/* Tables & Lists Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Registrations */}
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Registrations</h2>
            <Link to="/voters" className="text-xs text-brand hover:underline">View all</Link>
          </div>
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
                      <td className="py-2"><Link to={`/voters/${r.id}`} className="text-brand font-mono text-xs hover:underline">{r.referenceNumber}</Link></td>
                      <td>{r.fullName}</td>
                      <td><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{r.registrationStatus}</span></td>
                      <td>{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel: Top Constituencies & Activity */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><MapPin size={16} /> Top Constituencies</h2>
            {stats.topConstituencies.length === 0 ? (
              <p className="text-xs text-slate-500">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topConstituencies.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="font-mono text-slate-500">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Activity size={16} /> Recent Activity</h2>
            <ul className="space-y-3">
              {stats.recentActivity.map((log) => (
                <li key={log.id} className="text-xs border-l-2 border-brand pl-2">
                  <div className="font-medium text-slate-700 dark:text-slate-300">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-slate-500">{log.description}</div>
                  <div className="text-slate-400 mt-1">{fmtDateTime(log.timestamp)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}