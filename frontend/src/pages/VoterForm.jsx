import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

const STEPS = ['Basic Information', 'Location', 'Registration', 'Review'];
const initialForm = { fullName: '', dateOfBirth: '', nationality: 'Kenyan', gender: '', phone: '', countyId: '', constituencyId: '', wardId: '', pollingStationId: '', registrationStatus: 'PENDING', notes: '' };

export default function VoterForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [stations, setStations] = useState([]);
  const [dupes, setDupes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => { api.get('/locations/counties').then(r => setCounties(r.data)); }, []);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = async () => {
    if (step === 0 && (!form.fullName || form.fullName.length < 2)) return toast.error('Full name is required');
    if (step === 1 && (!form.countyId || !form.constituencyId || !form.wardId)) return toast.error('Complete the location chain');
    if (step === 0) {
      const { data } = await api.get('/voters/check-duplicates', { params: { fullName: form.fullName, phone: form.phone, dateOfBirth: form.dateOfBirth || undefined } });
      setDupes(data.duplicates || []);
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
      const { data } = await api.post('/voters', payload);
      toast.success(`Saved â€” Reference ${data.record.referenceNumber}`);
      setResult(data.record);
    } catch (err) {
      const msg = err.response?.data?.errors?.map(e => e.message).join(', ') || err.response?.data?.message || 'Save failed';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-xl card text-center">
        <div className="mx-auto mb-3 inline-flex rounded-full bg-green-100 p-3 text-green-700"><Check size={28} /></div>
        <h1 className="text-xl font-bold">Registration saved</h1>
        <p className="mt-1 text-sm text-slate-500">Reference number generated</p>
        <div className="my-4 rounded-md bg-slate-100 p-4 font-mono text-lg dark:bg-slate-800">{result.referenceNumber}</div>
        <div className="flex justify-center gap-2">
          <button onClick={() => nav(`/voters/${result.id}`)} className="btn-primary">View Record</button>
          <button onClick={() => { setResult(null); setStep(0); setForm(initialForm); }} className="btn-secondary">Register Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New Voter Registration</h1>
        <p className="text-sm text-slate-500">Step {step + 1} of {STEPS.length} â€” {STEPS[step]}</p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 rounded-full h-2 ${i <= step ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      <div className="card space-y-4">
        {step === 0 && (
          <>
            <div><label className="label">Full Name *</label><input className="input" value={form.fullName} onChange={e => setField('fullName', e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} /></div>
              <div><label className="label">Gender (optional)</label>
                <select className="input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Prefer not to say</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Nationality</label><input className="input" value={form.nationality} onChange={e => setField('nationality', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+254712345678" /></div>
            </div>
            {dupes.length > 0 && (
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle size={16} /> Possible duplicate record(s) found</div>
                <ul className="list-disc pl-5">{dupes.map(d => <li key={d.id}>{d.fullName} â€” {d.referenceNumber}</li>)}</ul>
                <p className="mt-1 text-xs">Please verify before continuing. Records are not merged automatically.</p>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div><label className="label">County *</label>
              <select className="input" value={form.countyId} onChange={async e => { setField('countyId', e.target.value); setField('constituencyId', ''); setField('wardId', ''); setField('pollingStationId', ''); const r = await api.get(`/locations/counties/${e.target.value}/constituencies`); setConstituencies(r.data); }}>
                <option value="">Select County</option>
                {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="label">Constituency *</label>
              <select className="input" disabled={!form.countyId} value={form.constituencyId} onChange={async e => { setField('constituencyId', e.target.value); setField('wardId', ''); setField('pollingStationId', ''); const r = await api.get(`/locations/constituencies/${e.target.value}/wards`); setWards(r.data); }}>
                <option value="">Select Constituency</option>
                {constituencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="label">Ward *</label>
              <select className="input" disabled={!form.constituencyId} value={form.wardId} onChange={async e => { setField('wardId', e.target.value); setField('pollingStationId', ''); const r = await api.get(`/locations/wards/${e.target.value}/polling-stations`); setStations(r.data); }}>
                <option value="">Select Ward</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select></div>
            <div><label className="label">Polling Station (optional)</label>
              <select className="input" disabled={!form.wardId} value={form.pollingStationId} onChange={e => setField('pollingStationId', e.target.value)}>
                <option value="">Select Polling Station</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
          </>
        )}

        {step === 2 && (
          <>
            <div><label className="label">Registration Status</label>
              <select className="input" value={form.registrationStatus} onChange={e => setField('registrationStatus', e.target.value)}>
                {['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Only authorized workflows may set APPROVED. Prefer PENDING until verification.</p>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Review</h3>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Full Name" value={form.fullName} />
              <Row label="Date of Birth" value={form.dateOfBirth || 'â€”'} />
              <Row label="Nationality" value={form.nationality} />
              <Row label="Gender" value={form.gender || 'â€”'} />
              <Row label="Phone" value={form.phone || 'â€”'} />
              <Row label="County" value={counties.find(c => c.id === form.countyId)?.name || 'â€”'} />
              <Row label="Constituency" value={constituencies.find(c => c.id === form.constituencyId)?.name || 'â€”'} />
              <Row label="Ward" value={wards.find(w => w.id === form.wardId)?.name || 'â€”'} />
              <Row label="Polling Station" value={stations.find(s => s.id === form.pollingStationId)?.name || 'â€”'} />
              <Row label="Status" value={form.registrationStatus} />
            </div>
            {form.notes && <Row label="Notes" value={form.notes} />}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} className="btn-secondary">
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary">Next <ChevronRight size={16} /></button>
          ) : (
            <button onClick={submit} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={16} /> Saving...</> : 'Confirm & Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between gap-3 border-b border-slate-100 py-2 dark:border-slate-800"><span className="text-slate-500">{label}</span><span className="font-medium text-right">{value}</span></div>;
}