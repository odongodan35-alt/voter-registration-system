import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

export default function VerifyVote() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (code.trim().length < 6) return toast.error('Please enter a valid receipt code.');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get('/vote/verify-receipt/' + code.trim().toUpperCase());
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No vote was found with this receipt code.');
      } else {
        setError(err.response?.data?.message || 'Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand dark:text-slate-400">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex rounded-full bg-brand/10 p-3 text-brand">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold">Verify Your Vote</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter the receipt code you received when you cast your vote.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Receipt Code</label>
            <input className="input font-mono text-center text-lg uppercase tracking-widest" placeholder="VT-2026-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Spinner size={16} /> Verifying...</> : <><Search size={16} /> Verify Vote</>}
          </button>
        </form>
        {error && (
          <div className="mt-6 card border-red-200 bg-red-50 text-center dark:border-red-900/50 dark:bg-red-900/20">
            <XCircle size={32} className="mx-auto mb-2 text-red-600" />
            <p className="font-medium text-red-800 dark:text-red-300">Not Found</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-6 card border-green-200 bg-green-50 text-center dark:border-green-900/50 dark:bg-green-900/20">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-600" />
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Vote Recorded Successfully</h2>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">Your ballot was securely cast in the <strong>{result.electionTitle}</strong>.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-white/50 p-3 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500">Date Cast</div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">{new Date(result.castAt).toLocaleString()}</div>
              </div>
              <div className="rounded-md bg-white/50 p-3 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500">Ballot Selections</div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">{result.positionsVoted} Positions</div>
              </div>
            </div>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-slate-500">Demo/Administrative System - Not an official election registration platform.</p>
      </div>
    </div>
  );
}