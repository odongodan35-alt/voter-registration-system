import { useEffect, useState } from 'react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { fmtDateTime } from '../utils/format.js';
import { Plus, Trash2 } from 'lucide-react';
import { ROLES } from '../utils/constants.js';
import {
  validateFullName, validateEmail, validateKenyanPhone, validatePassword
} from '../utils/validators.js';

const emptyForm = { fullName: '', email: '', phone: '', password: '', role: 'VIEWER' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { user: me } = useAuth();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const errors = {
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    phone: validateKenyanPhone(form.phone),
    password: validatePassword(form.password)
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const openCreate = () => {
    setForm(emptyForm);
    setTouched({});
    setCreateOpen(true);
  };

  const create = async () => {
    setTouched({ fullName: true, email: true, phone: true, password: true });
    if (hasErrors) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role
      });
      toast.success('User created');
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    const status = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.patch(`/users/${u.id}/status`, { status });
      toast.success(`User ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const changeRole = async (u, role) => {
    if (u.id === me.id) {
      toast.error('You cannot change your own role.');
      return;
    }
    try {
      await api.put(`/users/${u.id}`, { role });
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const resetPw = async (u) => {
    const newPassword = window.prompt(
      'Enter new password (min 8, upper, lower, number, symbol):'
    );
    if (!newPassword) return;
    try {
      await api.patch(`/users/${u.id}/password`, { newPassword });
      toast.success('Password reset');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const fieldClass = (field) => {
    if (!touched[field]) return 'input';
    return errors[field]
      ? 'input border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'input border-green-400 focus:border-green-500 focus:ring-green-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Create User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3">{u.fullName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone}</td>
                  <td className="p-3">
                    <select
                      className="input py-1 text-xs"
                      value={u.role}
                      disabled={u.id === me.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                      title={u.id === me.id ? 'You cannot change your own role' : ''}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      u.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>{u.status}</span>
                  </td>
                  <td className="p-3">{fmtDateTime(u.lastLogin)}</td>
                  <td className="p-3 space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={u.id === me.id}
                      className="text-brand hover:underline text-xs disabled:opacity-40"
                    >
                      {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => resetPw(u)}
                      className="text-brand hover:underline text-xs"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      disabled={u.id === me.id}
                      className="text-red-600 hover:underline text-xs disabled:opacity-40 inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User"
        onConfirm={create}
        confirmText={saving ? 'Saving...' : 'Create'}
      >
        <div className="space-y-2">
          <div>
            <input
              className={fieldClass('fullName')}
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => {
                setForm({ ...form, fullName: e.target.value });
                if (!touched.fullName) setTouched({ ...touched, fullName: true });
              }}
            />
            {touched.fullName && errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>
          <div>
            <input
              className={fieldClass('email')}
              placeholder="Email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (!touched.email) setTouched({ ...touched, email: true });
              }}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
          <div>
            <input
              className={fieldClass('phone')}
              placeholder="0712345678"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (!touched.phone) setTouched({ ...touched, phone: true });
              }}
            />
            {touched.phone && errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              className={fieldClass('password')}
              placeholder="Password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (!touched.password) setTouched({ ...touched, password: true });
              }}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user?"
        onConfirm={confirmDelete}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        danger
      >
        Are you sure you want to permanently delete <strong>{deleteTarget?.fullName}</strong>?
        This action cannot be undone.
      </Modal>
    </div>
  );
}