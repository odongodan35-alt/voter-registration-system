import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../hooks/useToast.jsx';

export default function VoterEdit() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [stations, setStations] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [vRes, cRes] = await Promise.all([api.get(`/voters/${id}`), api.get('/locations/counties')]);
        setCounties(cRes.data);
        const v = vRes.data;
        setForm({
          fullName: v.fullName, dateOfBirth: v.dateOfBirth?.slice(0, 10) || '',
          nationality: v.nationality, gender: v.gender || '', phone: v.phone || '',
          countyId: v.countyId, constituencyId: v.constituencyId, wardId: v.wardId,
          pollingStationId: v.pollingStationId || '', registrationStatus: v.registrationStatus,
          notes: v.notes || ''
        });
        const [conRes, wRes, sRes] = await Promise.all([
          api.get(`/locations/counties/${v.countyId}/constituencies`),
          api.get(`/locations/constituencies/${v.constituencyId}/wards`),
          v.wardId ? api.get(`/locations/wards/${v.wardId}/polling-stations`) : Promise.resolve({ data: [] })
        ]);
        setConstituencies(conRes.data); setWards(wRes.data); setStations(sRes.data);
      } catch { toast.error('Failed to load record'); }
    })();
  }, [id]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
      await api.put(`/voters/${id}`, payload);
      toast.success('Record updated');
      nav(`/voters/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (!form) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Edit Voter Record</h1>
      <form onSubmit={submit} className="card space-y-3">
        <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setField('fullName', e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} /></div>
          <div><label className="label">Nationality</label><input className="input" value={form.nationality} onChange={e => setField('nationality', e.target.value)} /></div>
          <div><label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
              <option value="">â€”</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
            </select></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
        </div>
        <div><label className="label">County</label>
          <select className="input" value={form.countyId} onChange={async e => { setField('countyId', e.target.value); setField('constituencyId', ''); setField('wardId', ''); setField('pollingStationId', ''); const r = await api.get(`/locations/counties/${e.target.value}/constituencies`); setConstituencies(r.data); }}>
            {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label className="label">Constituency</label>
          <select className="input" value={form.constituencyId} onChange={async e => { setField('constituencyId', e.target.value); setField('wardId', ''); setField('pollingStationId', ''); const r = await api.get(`/locations/constituencies/${e.target.value}/wards`); setWards(r.data); }}>
            {constituencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label className="label">Ward</label>
          <select className="input" value={form.wardId} onChange={async e => { setField('wardId', e.target.value); setField('pollingStationId', ''); const r = await api.get(`/locations/wards/${e.target.value}/polling-stations`); setStations(r.data); }}>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select></div>
        <div><label className="label">Polling Station</label>
          <select className="input" value={form.pollingStationId} onChange={e => setField('pollingStationId', e.target.value)}>
            <option value="">â€”</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div><label className="label">Status</label>
          <select className="input" value={form.registrationStatus} onChange={e => setField('registrationStatus', e.target.value)}>
            {['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'ARCHIVED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => nav(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}