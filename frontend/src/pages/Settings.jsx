import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState(() => ({
    systemName: 'Voter Registration Management System',
    organization: 'Administrative Demo Instance',
    defaultPageSize: 10,
    sessionHours: 8
  }));

  useEffect(() => { const s = localStorage.getItem('settings'); if (s) setSettings(JSON.parse(s)); }, []);

  const save = (e) => {
    e.preventDefault();
    localStorage.setItem('settings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">System Settings</h1>
      <p className="text-sm text-slate-500">Security-relevant settings like session length are enforced by the backend and cannot be lowered here.</p>
      <form onSubmit={save} className="card space-y-3">
        <div><label className="label">System Name</label><input className="input" value={settings.systemName} onChange={e => setSettings({ ...settings, systemName: e.target.value })} /></div>
        <div><label className="label">Organization</label><input className="input" value={settings.organization} onChange={e => setSettings({ ...settings, organization: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Default Page Size</label><input type="number" min={5} max={100} className="input" value={settings.defaultPageSize} onChange={e => setSettings({ ...settings, defaultPageSize: +e.target.value })} /></div>
          <div><label className="label">Session (hours)</label><input type="number" min={1} max={72} className="input" value={settings.sessionHours} onChange={e => setSettings({ ...settings, sessionHours: +e.target.value })} disabled /></div>
        </div>
        <button className="btn-primary">Save Settings</button>
      </form>
    </div>
  );
}