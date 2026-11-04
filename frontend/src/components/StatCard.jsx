export default function StatCard({ icon: Icon, label, value, color = 'brand' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`rounded-lg bg-${color}-100 p-3 text-${color}-700`}><Icon size={22} /></div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}