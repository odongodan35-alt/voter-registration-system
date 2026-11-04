import { useEffect, useState } from 'react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import Pagination from '../components/Pagination.jsx';
import { fmtDateTime } from '../utils/format.js';

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/audit-logs', { params: { page, limit: 20 } }).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      {loading ? <div className="flex justify-center py-20"><Spinner size={28} /></div> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <tr><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Description</th><th className="p-3">IP</th><th className="p-3">Timestamp</th></tr>
            </thead>
            <tbody>
              {data?.items.map(l => (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3">{l.user?.fullName || '—'}<div className="text-xs text-slate-500">{l.user?.email}</div></td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{l.action}</span></td>
                  <td className="p-3">{l.description}</td>
                  <td className="p-3 text-xs text-slate-500">{l.ipAddress || '—'}</td>
                  <td className="p-3 text-xs">{fmtDateTime(l.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3"><Pagination page={data?.page || 1} pages={data?.pages || 1} onPage={setPage} /></div>
        </div>
      )}
    </div>
  );
}