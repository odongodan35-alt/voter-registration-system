import { useEffect, useState } from 'react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import { Download } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { api.get('/reports/summary').then(r => setSummary(r.data)).finally(() => setLoading(false)); }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get('/reports/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `voter-records-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <button onClick={exportCsv} className="btn-primary"><Download size={16} /> Export CSV</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Total Registrations</h2>
          <div className="text-4xl font-bold text-brand">{summary.total}</div>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">By Status</h2>
          <ul className="space-y-1 text-sm">
            {summary.byStatus.map(s => (
              <li key={s.status} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                <span>{s.status}</span><span className="font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card md:col-span-2">
          <h2 className="mb-3 font-semibold">By County</h2>
          <ul className="space-y-1 text-sm">
            {summary.byCounty.map(c => (
              <li key={c.county} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                <span>{c.county || 'Unknown'}</span><span className="font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}