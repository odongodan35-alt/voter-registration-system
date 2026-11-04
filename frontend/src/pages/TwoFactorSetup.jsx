import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Copy, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';

export default function TwoFactorSetup() {
  const [step, setStep] = useState('loading'); // loading | scan | codes | done
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const pendingToken = sessionStorage.getItem('pending2faToken');
  const pendingEmail = sessionStorage.getItem('pending2faEmail');

  useEffect(() => {
    if (!pendingToken) {
      nav('/login');
      return;
    }
    api.post('/auth/2fa/setup/start', { pendingToken })
      .then((r) => {
        setQrDataUrl(r.data.qrDataUrl);
        // Pull the base32 secret out of the otpauth URL
        try {
          const url = new URL(r.data.otpauth);
          const s = url.searchParams.get('secret') || '';
          setSecret(s);
        } catch {
          setSecret('');
        }
        setStep('scan');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to start 2FA setup.');
        setStep('scan');
      });
  }, [pendingToken, nav]);

  const submitCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/2fa/setup/complete', {
        pendingToken,
        code: code.trim()
      });
      sessionStorage.removeItem('pending2faToken');
      sessionStorage.removeItem('pending2faEmail');
      setRecoveryCodes(data.recoveryCodes || []);
      setStep('codes');
      // Log the user in immediately
      login(data.token, data.user);
      toast.success('2FA enabled and you are now signed in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCodesCopied(true);
      toast.success('Recovery codes copied.');
      setTimeout(() => setCodesCopied(false), 3000);
    } catch {
      toast.error('Could not copy. Please save the codes manually.');
    }
  };

  const downloadCodes = () => {
    const blob = new Blob(
      [
        'VRS Kenya — Two-Factor Authentication Recovery Codes\n',
        'Account: ' + (pendingEmail || '') + '\n',
        'Generated: ' + new Date().toISOString() + '\n',
        'Each code can be used ONCE.\n\n',
        recoveryCodes.join('\n'),
        '\n\nKeep this file safe. Do not share these codes.\n'
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vrs-2fa-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'loading') {
    return (
      <div className="card text-center">
        <div className="flex justify-center py-6"><Spinner size={32} /></div>
        <p className="text-sm text-slate-500">Preparing your 2FA setup...</p>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="card">
        <div className="mb-4 flex items-center gap-2 text-brand">
          <ShieldCheck size={20} />
          <h1 className="text-xl font-bold">Secure your account</h1>
        </div>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Administrators must enable two-factor authentication. Scan the QR code below with
          Google Authenticator, Authy, Microsoft Authenticator, or any TOTP app.
        </p>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="2FA QR code" className="rounded-lg border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="flex h-60 w-60 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <Spinner size={24} />
            </div>
          )}

          {secret && (
            <div className="mt-3 text-center">
              <div className="text-xs text-slate-500">Or enter this code manually:</div>
              <div className="mt-1 rounded-md bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">
                {secret}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submitCode} className="mt-6 space-y-3">
          <div>
            <label className="label">Enter the 6-digit code from your app</label>
            <input
              className="input font-mono text-center text-2xl tracking-widest"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
            />
          </div>
          <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full">
            {submitting ? <><Spinner size={16} /> Verifying...</> : <>Verify and enable 2FA <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          After verifying, you'll receive 10 recovery codes to keep somewhere safe.
        </p>
      </div>
    );
  }

  if (step === 'codes') {
    return (
      <div className="card">
        <div className="mb-4 flex items-center gap-2 text-green-600">
          <CheckCircle2 size={22} />
          <h1 className="text-xl font-bold">2FA enabled — save your recovery codes</h1>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Important:</strong> these codes will not be shown again. If you lose your
            phone, you'll need one of these codes to sign in. Each code can only be used once.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-4 font-mono text-sm dark:bg-slate-900">
          {recoveryCodes.map((rc, i) => (
            <div key={i} className="rounded border border-slate-200 px-2 py-1 text-center dark:border-slate-700">
              {rc}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={copyCodes} className="btn-secondary">
            <Copy size={16} /> {codesCopied ? 'Copied!' : 'Copy all'}
          </button>
          <button onClick={downloadCodes} className="btn-secondary">
            Download .txt
          </button>
          <button onClick={() => setStep('done')} className="btn-primary ml-auto">
            I've saved them <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="card text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-600" />
        <h1 className="text-xl font-bold">You're all set</h1>
        <p className="mt-2 text-sm text-slate-500">
          2FA is now active on your account.
        </p>
        <button onClick={() => nav('/dashboard')} className="btn-primary mt-4">
          Go to dashboard
        </button>
      </div>
    );
  }

  return null;
}