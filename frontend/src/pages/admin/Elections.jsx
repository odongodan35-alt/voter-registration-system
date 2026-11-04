import { useEffect, useState } from 'react';
import { Plus, Play, Square, Eye, EyeOff, Calendar } from 'lucide-react';
import api from '../../services/api.js';
import Spinner from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { fmtDate } from '../../utils/format.js';

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'UPCOMING' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get('/elections').then((r) => setElections(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (form.title.trim().length < 3) return toast.error('Title must be at least 3 characters.');
    setSaving(true);
    try {
      await api.post('/elections', form);
      toast.success('Election created');
      setCreateOpen(false);
      setForm({ title: '', description: '', status: 'UPCOMING' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const update = async (id, patch) => {
    try {
      await api.patch('/elections/' + id, patch);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const statusColor = (s) => s === 'OPEN'
    ? 'bg-green-100 text-green-800'
    : s === 'CLOSED'
    ? 'bg-slate-200 text-slate-700'
    : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-sm text-slate-500">Manage election state and results visibility</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> New Election
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : elections.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No elections yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Election" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {elections.map((e) => (
            <div key={e.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{e.title}</h3>
                    <span className={'rounded-full px-2 py-0.5 text-xs ' + statusColor(e.status)}>{e.status}</span>
                  </div>
                  {e.description && <p className="text-sm text-slate-500 mt-1">{e.description}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Created {fmtDate(e.createdAt)}</span>
                    <span>{e.resultsVisible ? 'Results published' : 'Results hidden'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.status !== 'OPEN' && (
                    <button onClick={() => update(e.id, { status: 'OPEN' })} className="btn-primary text-xs">
                      <Play size={14} /> Open
                    </button>
                  )}
                  {e.status === 'OPEN' && (
                    <button onClick={() => update(e.id, { status: 'CLOSED' })} className="btn-secondary text-xs">
                      <Square size={14} /> Close
                    </button>
                  )}
                  <button
                    onClick={() => update(e.id, { resultsVisible: !e.resultsVisible })}
                    className="btn-secondary text-xs"
                  >
                    {e.resultsVisible ? <><EyeOff size={14} /> Hide Results</> : <><Eye size={14} /> Publish Results</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Election"
        onConfirm={create}
        confirmText={saving ? 'Saving...' : 'Create'}
      >
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="General Election 2026" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Initial Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="UPCOMING">UPCOMING (not yet open)</option>
              <option value="OPEN">OPEN (voting active)</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}