import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import Pagination from '../components/Pagination.jsx';
import { fmtDate } from '../utils/format.js';
import { STATUS_COLORS } from '../utils/constants.js';
import { Plus } from 'lucide-react';

export default function VoterList() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/voters', { params: { page, limit: 10, sortBy, sortOrder } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [page, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Voter Records</h1><p className="text-sm text-slate-500">{data?.total ?? 0} records</p></div>
        <Link to="/voters/new" className="btn-primary"><Plus size={16} /> New Record</Link>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={28} /></div> : data?.items?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No voter records found.</p>
          <p className="text-xs text-slate-400 mt-1">Try changing filters or create a new registration record.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3 cursor-pointer" onClick={() => toggleSort('fullName')}>Name</th>
                <th className="p-3">County</th>
                <th className="p-3">Ward</th>
                <th className="p-3">Status</th>
                <th className="p-3 cursor-pointer" onClick={() => toggleSort('createdAt')}>Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
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
          <div className="p-3"><Pagination page={data.page} pages={data.pages} onPage={setPage} /></div>
        </div>
      )}
    </div>
  );
}