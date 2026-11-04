import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import Spinner from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../hooks/useToast.jsx';

const SCOPES = [
  { value: 'NATIONAL', label: 'National (all voters)' },
  { value: 'COUNTY', label: 'County (voters in a county)' },
  { value: 'CONSTITUENCY', label: 'Constituency' },
  { value: 'WARD', label: 'Ward' }
];

export default function Positions() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scope: 'NATIONAL', order: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/elections').then((r) => {
      setElections(r.data);
      if (r.data[0]) setSelectedElection(r.data[0].id);
    });
  }, []);

  const loadPositions = () => {
    if (!selectedElection) return;
    setLoading(true);
    api.get('/positions', { params: { electionId: selectedElection } })
      .then((r) => setPositions(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(loadPositions, [selectedElection]);

  const create = async () => {
    if (form.title.trim().length < 2) return toast.error('Title is required.');
    if (!selectedElection) return toast.error('Select an election first.');
    setSaving(true);
    try {
      await api.post('/positions', { ...form, electionId: selectedElection });
      toast.success('Position created');
      setCreateOpen(false);
      setForm({ title: '', description: '', scope: 'NATIONAL', order: 0 });
      loadPositions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete('/positions/' + deleteTarget.id);
      toast.success('Position deleted');
      setDeleteTarget(null);
      loadPositions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Positions</h1>
          <p className="text-sm text-slate-500">Define the roles that voters will vote for</p>
        </div>
        <button onClick={() => setCreateOpen(true)} disabled={!selectedElection} className="btn-primary">
          <Plus size={16} /> New Position
        </button>
      </div>

      <div className="card">
        <label className="label">Election</label>
        <select className="input" value={selectedElection} onChange={(e) => setSelectedElection(e.target.value)}>
          {elections.length === 0 && <option value="">No elections yet</option>}
          {elections.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.status})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : positions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No positions defined for this election.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Title</th>
                <th className="p-3">Scope</th>
                <th className="p-3">Candidates</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-mono text-xs">{p.order}</td>
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{p.scope}</span></td>
                  <td className="p-3">{p.candidates?.length || 0}</td>
                  <td className="p-3">
                    <button onClick={() => setDeleteTarget(p)} className="text-red-600 hover:underline text-xs inline-flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Position"
        onConfirm={create} confirmText={saving ? 'Saving...' : 'Create'}>
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="President" />
          </div>
          <div>
            <label className="label">Scope</label>
            <select className="input" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Scope decides which voters see this position.</p>
          </div>
          <div>
            <label className="label">Order (display sequence)</label>
            <input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete position?"
        onConfirm={remove} confirmText="Delete" danger>
        Deleting <strong>{deleteTarget?.title}</strong> will also remove its candidates and votes. This cannot be undone.
      </Modal>
    </div>
  );
}