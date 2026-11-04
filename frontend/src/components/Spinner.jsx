export default function Spinner({ size = 20, className = '' }) {
  return <div className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand ${className}`} style={{ width: size, height: size }} />;
}