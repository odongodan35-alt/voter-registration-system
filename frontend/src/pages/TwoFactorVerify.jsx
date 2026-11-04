import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

export default function TwoFactorVerify() {
  const [mode, setMode] = useState('totp'); // 'totp' | 'recovery'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const pendingToken = sessionStorage.getItem('pending2faToken');
  const pendingEmail = sessionStorage.getItem('pending2faEmail');

  useEffect(() => {
    if (!pendingToken) nav('/login');
  }, [pendingToken, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', {
        pendingToken,
        code: code.trim()
      });
      sessionStorage.removeItem('pending2faToken');
      sessionStorage.removeItem('pending2faEmail');
      login(data.token, data.user);
      if (data.usedRecovery) {
        toast.info(`Signed in with a recovery code. ${data.remainingRecoveryCodes} left.`);
      } else {
        toast.success('Signed in successfully.');
      }
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2 text-brand">
        <ShieldCheck size={20} />
        <h1 className="text-xl font-bold">Two-factor authentication</h1>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        {pendingEmail && <>Signing in as <strong>{pendingEmail}</strong>. </>}
        {mode === 'totp'
          ? 'Enter the 6-digit code from your authenticator app.'
          : 'Enter one of your recovery codes (format XXXX-XXXX).'}
      </p>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">{mode === 'totp' ? 'Authentication code' : 'Recovery code'}</label>
          <input
            className={`input font-mono text-center tracking-widest ${mode === 'totp' ? 'text-2xl' : 'text-lg'}`}
            inputMode={mode === 'totp' ? 'numeric' : 'text'}
            maxLength={mode === 'totp' ? 6 : 12}
            value={code}
            onChange={(e) => setCode(mode === 'totp' ? e.target.value.replace(/\D/g, '') : e.target.value)}
            placeholder={mode === 'totp' ? '000000' : 'XXXX-XXXX'}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || (mode === 'totp' && code.length !== 6) || (mode === 'recovery' && code.length < 8)}
          className="btn-primary w-full"
        >
          {loading ? <><Spinner size={16} /> Verifying...</> : <>Verify and sign in <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => { setMode(mode === 'totp' ? 'recovery' : 'totp'); setCode(''); setError(''); }}
          className="text-brand hover:underline inline-flex items-center gap-1"
        >
          <Key size={14} />
          {mode === 'totp' ? 'Use a recovery code' : 'Use authenticator app'}
        </button>
        <button
          type="button"
          onClick={() => { sessionStorage.clear(); nav('/login'); }}
          className="text-slate-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}