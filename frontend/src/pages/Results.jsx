import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, BarChart3, MapPin, X as XIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const imageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE + url;
};

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [countyId, setCountyId] = useState('');
  const [constituencyId, setConstituencyId] = useState('');

  // Load counties once
  useEffect(() => {
    api.get('/vote/regions/counties').then((r) => setCounties(r.data)).catch(() => {});
  }, []);

  // When county changes, load its constituencies
  useEffect(() => {
    setConstituencyId('');
    if (!countyId) { setConstituencies([]); return; }
    api.get('/vote/regions/counties/' + countyId + '/constituencies')
      .then((r) => setConstituencies(r.data))
      .catch(() => setConstituencies([]));
  }, [countyId]);

  // Load results whenever filters change
  useEffect(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (countyId) params.countyId = countyId;
    if (constituencyId) params.constituencyId = constituencyId;
    api.get('/vote/results', { params })
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load results.'))
      .finally(() => setLoading(false));
  }, [countyId, constituencyId]);

  const clearFilters = () => {
    setCountyId('');
    setConstituencyId('');
  };

  const hasFilter = countyId || constituencyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand dark:text-slate-400">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex rounded-full bg-brand/10 p-3 text-brand">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold">Live Election Results</h1>
        </div>

        {/* -------- Region filter -------- */}
        <div className="card mb-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-brand" />
              <span className="font-semibold">Filter by region</span>
            </div>
            {hasFilter && (
              <button onClick={clearFilters} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1">
                <XIcon size={12} /> Clear filters
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">County</label>
              <select className="input" value={countyId} onChange={(e) => setCountyId(e.target.value)}>
                <option value="">All Kenya</option>
                {counties.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Constituency</label>
              <select className="input" value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} disabled={!countyId}>
                <option value="">{countyId ? 'All constituencies' : 'Select a county first'}</option>
                {constituencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {hasFilter && (
            <div className="mt-3 rounded-md bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <strong>Viewing:</strong>{' '}
              {constituencyId
                ? `${constituencies.find((c) => c.id === constituencyId)?.name || ''} Constituency`
                : `${counties.find((c) => c.id === countyId)?.name || ''} County`}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20"><Spinner size={40} /></div>
        )}

        {error && !loading && (
          <div className="card mx-auto max-w-lg text-center">
            <p className="text-slate-600 dark:text-slate-300">{error}</p>
            <p className="mt-2 text-xs text-slate-500">Results will appear once the administrator publishes them.</p>
            <Link to="/" className="btn-secondary mt-4 inline-flex">Back to Home</Link>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{data.election.title}</h2>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                    data.election.status === 'OPEN'
                      ? 'bg-green-100 text-green-800'
                      : data.election.status === 'CLOSED'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.election.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Users size={14} /> Registered Voters</div>
                  <div className="mt-1 text-2xl font-bold">{data.totalVoters.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><BarChart3 size={14} /> Votes Cast</div>
                  <div className="mt-1 text-2xl font-bold">{data.totalVotesCast.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">Turnout</div>
                  <div className="mt-1 text-2xl font-bold">{data.turnoutPercent}%</div>
                </div>
              </div>
            </div>

            {data.positions.length === 0 && (
              <div className="card text-center py-12">
                <p className="text-slate-500">No positions match this region.</p>
              </div>
            )}

            {data.positions.map((pos) => (
              <div key={pos.id} className="card">
                <h3 className="mb-1 text-lg font-semibold">{pos.title}</h3>
                <div className="mb-4 text-xs text-slate-500">
                  {pos.scope} · {pos.totalVotes.toLocaleString()} vote(s)
                </div>

                {pos.candidates.length === 0 ? (
                  <p className="text-sm text-slate-500">No candidates in this region.</p>
                ) : (
                  <>
                    <div className="mb-4 h-64">
                      <ResponsiveContainer>
                        <BarChart data={pos.candidates} layout="vertical">
                          <XAxis type="number" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={140} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="votes" fill="#1e40af">
                            {pos.candidates.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 text-left dark:border-slate-700">
                          <tr>
                            <th className="p-2">Candidate</th>
                            <th className="p-2">Party</th>
                            <th className="p-2 text-right">Votes</th>
                            <th className="p-2 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pos.candidates.map((c, i) => (
                            <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="p-2 flex items-center gap-2">
                                {c.photoUrl ? (
                                  <img src={imageUrl(c.photoUrl)} alt={c.name} className="h-8 w-8 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                                    {c.name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-medium">{c.name}</span>
                                {i === 0 && pos.totalVotes > 0 && (
                                  <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Leading</span>
                                )}
                              </td>
                              <td className="p-2 text-slate-600 dark:text-slate-400">{c.party || '—'}</td>
                              <td className="p-2 text-right font-mono">{c.votes.toLocaleString()}</td>
                              <td className="p-2 text-right font-mono">{c.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Demo/Administrative System — Not an official election registration platform.
        </p>
      </div>
    </div>
  );
}