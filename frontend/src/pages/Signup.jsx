import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../hooks/useToast.jsx';
import Spinner from '../components/Spinner.jsx';
import {
  validateFullName, validateEmail, validateKenyanPhone,
  validatePassword, validateConfirmPassword, passwordStrength
} from '../utils/validators.js';

const initialForm = {
  fullName: '', email: '', phone: '', password: '', confirmPassword: ''
};

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const toast = useToast();
  const nav = useNavigate();

  const errors = {
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    phone: validateKenyanPhone(form.phone),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.password, form.confirmPassword)
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const showError = (field) => touched[field] && errors[field];
  const showOk = (field) => touched[field] && !errors[field] && form[field].length > 0;

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (!touched[field]) setTouched({ ...touched, [field]: true });
  };
  const handleBlur = (field) => () => setTouched({ ...touched, [field]: true });

  const fieldClass = (field) => {
    if (!touched[field]) return 'input';
    return errors[field]
      ? 'input border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'input border-green-400 focus:border-green-500 focus:ring-green-500';
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    setTouched({
      fullName: true, email: true, phone: true,
      password: true, confirmPassword: true
    });
    if (hasErrors) {
      toast.error('Please fix the errors above.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      toast.success(data.message || 'Account created. Please sign in.');
      nav('/login');
    } catch (err) {
      const res = err.response?.data;
      let msg = res?.message || 'Registration failed.';
      if (res?.errors?.length) msg = res.errors.map((x) => x.message).join(' ');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(form.password);
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="card">
      <h1 className="mb-1 text-xl font-bold">Create account</h1>
      <p className="mb-4 text-sm text-slate-500">
        New accounts are created with read-only (Viewer) access.
        Contact an administrator to upgrade your role.
      </p>

      {serverError && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-3">
        <Field
          label="Full Name"
          value={form.fullName}
          onChange={handleChange('fullName')}
          onBlur={handleBlur('fullName')}
          error={showError('fullName')}
          ok={showOk('fullName')}
          className={fieldClass('fullName')}
          autoComplete="name"
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          error={showError('email')}
          ok={showOk('email')}
          className={fieldClass('email')}
          autoComplete="email"
          placeholder="example@gmail.com"
        />
        <Field
          label="Phone Number"
          value={form.phone}
          onChange={handleChange('phone')}
          onBlur={handleBlur('phone')}
          error={showError('phone')}
          ok={showOk('phone')}
          className={fieldClass('phone')}
          autoComplete="tel"
          placeholder="0712345678 or 0112345678"
          hint="10 digits starting with 01 or 07"
        />

        <div>
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={showError('password')}
            ok={showOk('password')}
            className={fieldClass('password')}
            autoComplete="new-password"
          />
          {form.password.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full transition-all ${strengthColors[strength]}`}
                  style={{ width: `${((strength + 1) / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{strengthLabels[strength]}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Min 8 chars, upper, lower, number, symbol.
          </p>
        </div>

        <Field
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
          error={showError('confirmPassword')}
          ok={showOk('confirmPassword')}
          className={fieldClass('confirmPassword')}
          autoComplete="new-password"
        />

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <><Spinner size={16} /> Creating...</> : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Have an account? <Link to="/login" className="text-brand hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ label, error, ok, className, hint, ...inputProps }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className={className} {...inputProps} />
        {ok && !error && (
          <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
        )}
        {error && (
          <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}