import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | ready | invalid | success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    api.post('/auth/password-reset/verify', { token })
      .then((r) => {
        setEmail(r.data.email);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'This link is invalid or has expired.');
        setStatus('invalid');
      });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(password)) return setError('Password must contain an uppercase letter.');
    if (!/[a-z]/.test(password)) return setError('Password must contain a lowercase letter.');
    if (!/[0-9]/.test(password)) return setError('Password must contain a number.');
    if (!/[^A-Za-z0-9]/.test(password)) return setError('Password must contain a special character.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: password });
      setStatus('success');
      toast.success('Password updated. You can now sign in.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not reset password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="card text-center">
        <div className="flex justify-center py-6"><Spinner size={32} /></div>
        <p className="text-sm text-slate-500">Verifying your reset link...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="card text-center">
        <XCircle size={48} className="mx-auto mb-3 text-red-600" />
        <h1 className="text-xl font-bold">Invalid or expired link</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error || 'This reset link is not valid. It may have expired or already been used.'}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/forgot-password" className="btn-primary w-full inline-flex justify-center">
            Request a new link
          </Link>
          <Link to="/login" className="btn-secondary w-full inline-flex justify-center">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="card text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-600" />
        <h1 className="text-xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your password has been changed successfully. You can now sign in with your new password.
        </p>
        <button onClick={() => nav('/login')} className="btn-primary mt-6">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand">
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <div className="mb-4 flex items-center gap-2 text-brand">
        <KeyRound size={20} />
        <h1 className="text-xl font-bold">Set a new password</h1>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Resetting password for <strong>{email}</strong>
      </p>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              required
              minLength={8}
              className="input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Min 8 chars · uppercase · lowercase · number · symbol
          </p>
        </div>

        <div>
          <label className="label">Confirm new password</label>
          <input
            type={show ? 'text' : 'password'}
            required
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <><Spinner size={16} /> Saving...</> : 'Update password'}
        </button>
      </form>
    </div>
  );
}