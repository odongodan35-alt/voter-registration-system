import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import Pagination from '../components/Pagination.jsx';
import { fmtDate } from '../utils/format.js';
import { STATUS_COLORS } from '../utils/constants.js';

export default function Search() {
  const [filters, setFilters] = useState({ search: '', countyId: '', constituencyId: '', wardId: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/locations/counties').then(r => setCounties(r.data)); }, []);

  const run = async (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 10 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const { data } = await api.get('/voters', { params });
    setResults(data); setLoading(false);
  };

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Advanced Search</h1>
      <div className="card space-y-3">
        <div>
          <label className="label">Search (reference, name, phone)</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="input pl-9" value={filters.search} onChange={e => setF('search', e.target.value)} placeholder="e.g. Daniel or VRS-2024" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label">County</label>
            <select className="input" value={filters.countyId} onChange={async e => { setF('countyId', e.target.value); setF('constituencyId', ''); setF('wardId', ''); if (e.target.value) { const r = await api.get(`/locations/counties/${e.target.value}/constituencies`); setConstituencies(r.data); } else setConstituencies([]); }}>
              <option value="">All</option>{counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Constituency</label>
            <select className="input" value={filters.constituencyId} onChange={async e => { setF('constituencyId', e.target.value); setF('wardId', ''); if (e.target.value) { const r = await api.get(`/locations/constituencies/${e.target.value}/wards`); setWards(r.data); } else setWards([]); }}>
              <option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Ward</label>
            <select className="input" value={filters.wardId} onChange={e => setF('wardId', e.target.value)}>
              <option value="">All</option>{wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select></div>
          <div><label className="label">Status</label>
            <select className="input" value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">All</option>{['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'ARCHIVED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run(1)} className="btn-primary"><SearchIcon size={16} /> Search</button>
          <button onClick={() => { setFilters({ search: '', countyId: '', constituencyId: '', wardId: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' }); setResults(null); }} className="btn-secondary">Reset</button>
          <select className="input w-auto" value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)}>
            <option value="createdAt">Sort by Date</option><option value="fullName">Sort by Name</option>
          </select>
          <select className="input w-auto" value={filters.sortOrder} onChange={e => setF('sortOrder', e.target.value)}>
            <option value="desc">Desc</option><option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
      {results && !loading && (
        results.items.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-500">No voter records found.</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your search filters.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-x-auto">
            <div className="p-3 text-sm text-slate-500">{results.total} result(s)</div>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
                <tr><th className="p-3">Reference</th><th className="p-3">Name</th><th className="p-3">County</th><th className="p-3">Ward</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {results.items.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-mono text-xs">{r.referenceNumber}</td>
                    <td className="p-3">{r.fullName}</td>
                    <td className="p-3">{r.county?.name}</td>
                    <td className="p-3">{r.ward?.name}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[r.registrationStatus]}`}>{r.registrationStatus}</span></td>
                    <td className="p-3">{fmtDate(r.createdAt)}</td>
                    <td className="p-3"><Link to={`/voters/${r.id}`} className="text-brand hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3"><Pagination page={results.page} pages={results.pages} onPage={run} /></div>
          </div>
        )
      )}
    </div>
  );
}