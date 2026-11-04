import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', {
        email: email.trim().toLowerCase()
      });
      setSent(true);
      toast.success('If that email exists, a reset link has been sent.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send reset email.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-600" />
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          If <strong>{email}</strong> matches a registered account, we've sent a password reset link.
          The link expires in 30 minutes.
        </p>
        <div className="mt-6 space-y-2">
          <Link to="/login" className="btn-primary w-full inline-flex justify-center">
            Back to sign in
          </Link>
          <button onClick={() => { setSent(false); setEmail(''); }} className="btn-secondary w-full">
            Send to a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand">
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <div className="mb-4 flex items-center gap-2 text-brand">
        <Mail size={20} />
        <h1 className="text-xl font-bold">Forgot your password?</h1>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Enter the email address on your account. We'll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            autoComplete="email"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Spinner size={16} /> Sending...</> : 'Send reset link'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Only accounts with a registered email address can reset their password.
      </p>
    </div>
  );
}