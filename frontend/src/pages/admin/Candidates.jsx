import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, User, Upload, X as XIcon, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import api from '../../services/api.js';
import Spinner from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../hooks/useToast.jsx';

const emptyForm = {
  name: '', party: '', slogan: '', bio: '',
  positionId: '', countyId: '', constituencyId: ''
};

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const imageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE + url;
};

export default function Candidates() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- CREATE modal ----
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadState, setUploadState] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---- EDIT modal ----
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editUploadPercent, setEditUploadPercent] = useState(0);
  const [editUploadState, setEditUploadState] = useState('idle');
  const [editDragging, setEditDragging] = useState(false);
  const [editRemovePhoto, setEditRemovePhoto] = useState(false);
  const editAbortRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get('/elections'), api.get('/locations/counties')]).then(([e, c]) => {
      setElections(e.data);
      setCounties(c.data);
      if (e.data[0]) setSelectedElection(e.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedElection) return;
    setLoading(true);
    Promise.all([
      api.get('/positions', { params: { electionId: selectedElection } }),
      api.get('/candidates', { params: { electionId: selectedElection } })
    ]).then(([p, c]) => {
      setPositions(p.data);
      setCandidates(c.data);
    }).finally(() => setLoading(false));
  }, [selectedElection]);

  const reloadCandidates = () => {
    if (!selectedElection) return;
    api.get('/candidates', { params: { electionId: selectedElection } }).then((r) => setCandidates(r.data));
  };

  const selectedPosition = positions.find((p) => p.id === form.positionId);
  const editSelectedPosition = positions.find((p) => p.id === editForm.positionId);

  useEffect(() => {
    if (!form.countyId) { setConstituencies([]); return; }
    api.get('/counties/' + form.countyId + '/constituencies').then((r) => setConstituencies(r.data));
  }, [form.countyId]);

  // ------- create helpers -------
  const resetModal = () => {
    setForm(emptyForm);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setUploadPercent(0);
    setUploadState('idle');
    setDragging(false);
    abortRef.current = null;
  };

  const acceptFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB.');
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setUploadState('idle');
    setUploadPercent(0);
  };

  const handleFileChange = (e) => {
    acceptFile(e.target.files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setUploadState('idle');
    setUploadPercent(0);
  };

  const cancelUpload = () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setUploadState('idle');
    setUploadPercent(0);
    setSaving(false);
  };

  const create = async () => {
    if (form.name.trim().length < 2) return toast.error('Candidate name is required.');
    if (!form.positionId) return toast.error('Select a position.');
    if (selectedPosition?.scope === 'COUNTY' && !form.countyId) return toast.error('This position requires a county.');
    if (selectedPosition?.scope === 'CONSTITUENCY' && (!form.countyId || !form.constituencyId)) {
      return toast.error('This position requires a county and constituency.');
    }

    setSaving(true);
    setUploadState('uploading');
    setUploadPercent(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.party.trim()) fd.append('party', form.party.trim());
      if (form.slogan.trim()) fd.append('slogan', form.slogan.trim());
      if (form.bio.trim()) fd.append('bio', form.bio.trim());
      fd.append('positionId', form.positionId);
      if (form.countyId) fd.append('countyId', form.countyId);
      if (form.constituencyId) fd.append('constituencyId', form.constituencyId);
      if (photoFile) fd.append('photo', photoFile);

      await api.post('/candidates', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        onUploadProgress: (evt) => {
          if (evt.total) setUploadPercent(Math.round((evt.loaded / evt.total) * 100));
          else setUploadPercent((p) => Math.min(95, p + 5));
        }
      });

      setUploadState('success');
      setUploadPercent(100);
      toast.success('Candidate registered');
      setTimeout(() => {
        setCreateOpen(false);
        resetModal();
        reloadCandidates();
      }, 700);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') { /* silent */ }
      else {
        setUploadState('error');
        toast.error(err.response?.data?.message || 'Failed');
      }
    } finally {
      setSaving(false);
      abortRef.current = null;
    }
  };

  // ------- edit helpers -------
  const openEdit = (c) => {
    setEditing(c);
    setEditForm({
      name: c.name || '',
      party: c.party || '',
      slogan: c.slogan || '',
      bio: c.bio || '',
      positionId: c.positionId || '',
      countyId: c.countyId || '',
      constituencyId: c.constituencyId || ''
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(c.photoUrl ? imageUrl(c.photoUrl) : null);
    setEditRemovePhoto(false);
    setEditUploadState('idle');
    setEditUploadPercent(0);
    setEditDragging(false);
    editAbortRef.current = null;

    // Load constituencies if county is set
    if (c.countyId) {
      api.get('/counties/' + c.countyId + '/constituencies').then((r) => setConstituencies(r.data));
    } else {
      setConstituencies([]);
    }

    setEditOpen(true);
  };

  const resetEdit = () => {
    setEditing(null);
    setEditForm(emptyForm);
    setEditPhotoFile(null);
    if (editPhotoPreview && editPhotoPreview.startsWith('blob:')) URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoPreview(null);
    setEditRemovePhoto(false);
    setEditUploadState('idle');
    setEditUploadPercent(0);
    setEditDragging(false);
    editAbortRef.current = null;
  };

  const editAcceptFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB.');
    setEditPhotoFile(file);
    if (editPhotoPreview && editPhotoPreview.startsWith('blob:')) URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoPreview(URL.createObjectURL(file));
    setEditRemovePhoto(false);
    setEditUploadState('idle');
    setEditUploadPercent(0);
  };

  const editHandleFileChange = (e) => {
    editAcceptFile(e.target.files?.[0]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const editHandleDrop = (e) => {
    e.preventDefault();
    setEditDragging(false);
    editAcceptFile(e.dataTransfer.files?.[0]);
  };

  const editClearPhoto = () => {
    setEditPhotoFile(null);
    if (editPhotoPreview && editPhotoPreview.startsWith('blob:')) URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoPreview(null);
    // If original had a photo and user clears it, mark for removal
    if (editing?.photoUrl) setEditRemovePhoto(true);
  };

  const editCancelUpload = () => {
    if (editAbortRef.current) { editAbortRef.current.abort(); editAbortRef.current = null; }
    setEditUploadState('idle');
    setEditUploadPercent(0);
    setEditSaving(false);
  };

  const saveEdit = async () => {
    if (editForm.name.trim().length < 2) return toast.error('Candidate name is required.');
    if (!editForm.positionId) return toast.error('Select a position.');
    if (editSelectedPosition?.scope === 'COUNTY' && !editForm.countyId) return toast.error('This position requires a county.');
    if (editSelectedPosition?.scope === 'CONSTITUENCY' && (!editForm.countyId || !editForm.constituencyId)) {
      return toast.error('This position requires a county and constituency.');
    }

    setEditSaving(true);
    setEditUploadState('uploading');
    setEditUploadPercent(0);

    const controller = new AbortController();
    editAbortRef.current = controller;

    try {
      const fd = new FormData();
      fd.append('name', editForm.name.trim());
      fd.append('party', editForm.party.trim());
      fd.append('slogan', editForm.slogan.trim());
      fd.append('bio', editForm.bio.trim());
      fd.append('positionId', editForm.positionId);
      fd.append('countyId', editForm.countyId || '');
      fd.append('constituencyId', editForm.constituencyId || '');
      if (editPhotoFile) fd.append('photo', editPhotoFile);
      if (editRemovePhoto && !editPhotoFile) fd.append('removePhoto', 'true');

      await api.put('/candidates/' + editing.id, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        onUploadProgress: (evt) => {
          if (evt.total) setEditUploadPercent(Math.round((evt.loaded / evt.total) * 100));
          else setEditUploadPercent((p) => Math.min(95, p + 5));
        }
      });

      setEditUploadState('success');
      setEditUploadPercent(100);
      toast.success('Candidate updated');
      setTimeout(() => {
        setEditOpen(false);
        resetEdit();
        reloadCandidates();
      }, 700);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') { /* silent */ }
      else {
        setEditUploadState('error');
        toast.error(err.response?.data?.message || 'Failed to update');
      }
    } finally {
      setEditSaving(false);
      editAbortRef.current = null;
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete('/candidates/' + deleteTarget.id);
      toast.success('Candidate deleted');
      setDeleteTarget(null);
      reloadCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const groupByPosition = () => {
    const map = {};
    candidates.forEach((c) => {
      const key = c.positionId;
      if (!map[key]) map[key] = { position: c.position, items: [] };
      map[key].items.push(c);
    });
    return Object.values(map).sort((a, b) => (a.position?.order || 0) - (b.position?.order || 0));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm text-slate-500">Register candidates running for each position</p>
        </div>
        <button onClick={() => { resetModal(); setCreateOpen(true); }} disabled={!selectedElection} className="btn-primary">
          <Plus size={16} /> Register Candidate
        </button>
      </div>

      <div className="card">
        <label className="label">Election</label>
        <select className="input" value={selectedElection} onChange={(e) => setSelectedElection(e.target.value)}>
          {elections.length === 0 && <option value="">No elections yet</option>}
          {elections.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.status})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : candidates.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No candidates registered yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Register Candidate" to add one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupByPosition().map(({ position, items }) => (
            <div key={position?.id} className="card">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold">{position?.title}</h3>
                  <span className="text-xs text-slate-500">{position?.scope}</span>
                </div>
                <span className="text-xs text-slate-500">{items.length} candidate(s)</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    {c.photoUrl ? (
                      <img src={imageUrl(c.photoUrl)} alt={c.name} className="h-14 w-14 shrink-0 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <User size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      {c.party && <div className="text-xs text-slate-500 truncate">{c.party}</div>}
                      {c.county && <div className="text-xs text-slate-400 truncate">{c.county.name}</div>}
                      {c.constituency && <div className="text-xs text-slate-400 truncate">{c.constituency.name}</div>}
                      <div className="mt-2 flex items-center gap-3">
                        <button onClick={() => openEdit(c)} className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------- CREATE MODAL -------- */}
      <Modal open={createOpen} onClose={() => { if (saving) return; setCreateOpen(false); resetModal(); }} title="Register Candidate"
        onConfirm={saving ? undefined : create}
        confirmText={saving ? 'Uploading...' : 'Register'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="label">Position</label>
            <select className="input" value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value, countyId: '', constituencyId: '' })} disabled={saving}>
              <option value="">Select position</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.scope})</option>)}
            </select>
          </div>

          {(selectedPosition?.scope === 'COUNTY' || selectedPosition?.scope === 'CONSTITUENCY') && (
            <div>
              <label className="label">County</label>
              <select className="input" value={form.countyId} onChange={(e) => setForm({ ...form, countyId: e.target.value, constituencyId: '' })} disabled={saving}>
                <option value="">Select county</option>
                {counties.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {selectedPosition?.scope === 'CONSTITUENCY' && (
            <div>
              <label className="label">Constituency</label>
              <select className="input" value={form.constituencyId} onChange={(e) => setForm({ ...form, constituencyId: e.target.value })} disabled={saving}>
                <option value="">Select constituency</option>
                {constituencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Candidate Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alice Wanjiku" disabled={saving} />
          </div>
          <div>
            <label className="label">Party</label>
            <input className="input" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="e.g. Progressive Alliance" disabled={saving} />
          </div>
          <div>
            <label className="label">Slogan</label>
            <input className="input" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} placeholder="Optional" disabled={saving} />
          </div>

          {/* Photo upload */}
          <div>
            <label className="label">Candidate Photo</label>
            {uploadState === 'uploading' && (
              <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-brand">Uploading...</span>
                  <span className="font-mono text-brand">{uploadPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-brand transition-all duration-200" style={{ width: uploadPercent + '%' }} />
                </div>
                <button type="button" onClick={cancelUpload} className="mt-3 text-xs text-red-600 hover:underline">Cancel upload</button>
              </div>
            )}
            {uploadState === 'success' && (
              <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
                <CheckCircle2 size={18} /><span className="font-medium">Registered successfully</span>
              </div>
            )}
            {uploadState === 'error' && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                <AlertCircle size={18} /><span className="font-medium">Upload failed. Please try again.</span>
              </div>
            )}
            {uploadState === 'idle' && (
              <>
                {!photoPreview ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-sm transition ${
                      dragging ? 'border-brand bg-brand/5 text-brand' : 'border-slate-300 text-slate-500 hover:border-brand hover:text-brand dark:border-slate-600'
                    }`}
                  >
                    <Upload size={22} />
                    <span className="font-medium">{dragging ? 'Drop image here' : 'Click to choose a photo'}</span>
                    <span className="text-xs text-slate-400">or drag and drop into this box</span>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{photoFile?.name}</div>
                      <div className="text-xs text-slate-500">{(photoFile?.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button type="button" onClick={clearPhoto} className="text-red-600 hover:text-red-700" aria-label="Remove photo">
                      <XIcon size={18} />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WEBP. Max 5MB.</p>
              </>
            )}
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Optional" disabled={saving} />
          </div>
        </div>
      </Modal>

      {/* -------- EDIT MODAL -------- */}
      <Modal open={editOpen} onClose={() => { if (editSaving) return; setEditOpen(false); resetEdit(); }} title="Edit Candidate"
        onConfirm={editSaving ? undefined : saveEdit}
        confirmText={editSaving ? 'Saving...' : 'Save Changes'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="label">Position</label>
            <select className="input" value={editForm.positionId} onChange={(e) => setEditForm({ ...editForm, positionId: e.target.value, countyId: '', constituencyId: '' })} disabled={editSaving}>
              <option value="">Select position</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.scope})</option>)}
            </select>
          </div>

          {(editSelectedPosition?.scope === 'COUNTY' || editSelectedPosition?.scope === 'CONSTITUENCY') && (
            <div>
              <label className="label">County</label>
              <select className="input" value={editForm.countyId} onChange={(e) => {
                setEditForm({ ...editForm, countyId: e.target.value, constituencyId: '' });
                if (e.target.value) api.get('/counties/' + e.target.value + '/constituencies').then((r) => setConstituencies(r.data));
                else setConstituencies([]);
              }} disabled={editSaving}>
                <option value="">Select county</option>
                {counties.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {editSelectedPosition?.scope === 'CONSTITUENCY' && (
            <div>
              <label className="label">Constituency</label>
              <select className="input" value={editForm.constituencyId} onChange={(e) => setEditForm({ ...editForm, constituencyId: e.target.value })} disabled={editSaving}>
                <option value="">Select constituency</option>
                {constituencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Candidate Name</label>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} disabled={editSaving} />
          </div>
          <div>
            <label className="label">Party</label>
            <input className="input" value={editForm.party} onChange={(e) => setEditForm({ ...editForm, party: e.target.value })} disabled={editSaving} />
          </div>
          <div>
            <label className="label">Slogan</label>
            <input className="input" value={editForm.slogan} onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })} disabled={editSaving} />
          </div>

          {/* Photo */}
          <div>
            <label className="label">Candidate Photo</label>
            {editUploadState === 'uploading' && (
              <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-brand">Saving...</span>
                  <span className="font-mono text-brand">{editUploadPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-brand transition-all duration-200" style={{ width: editUploadPercent + '%' }} />
                </div>
                <button type="button" onClick={editCancelUpload} className="mt-3 text-xs text-red-600 hover:underline">Cancel</button>
              </div>
            )}
            {editUploadState === 'success' && (
              <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
                <CheckCircle2 size={18} /><span className="font-medium">Updated successfully</span>
              </div>
            )}
            {editUploadState === 'error' && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                <AlertCircle size={18} /><span className="font-medium">Save failed. Please try again.</span>
              </div>
            )}
            {editUploadState === 'idle' && (
              <>
                {!editPhotoPreview ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setEditDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setEditDragging(false); }}
                    onDrop={editHandleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-sm transition ${
                      editDragging ? 'border-brand bg-brand/5 text-brand' : 'border-slate-300 text-slate-500 hover:border-brand hover:text-brand dark:border-slate-600'
                    }`}
                  >
                    <Upload size={22} />
                    <span className="font-medium">{editDragging ? 'Drop image here' : 'Choose a new photo'}</span>
                    <span className="text-xs text-slate-400">or drag and drop into this box</span>
                    <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={editHandleFileChange} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
                    <img src={editPhotoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {editPhotoFile?.name || 'Current photo'}
                      </div>
                      {editPhotoFile && (
                        <div className="text-xs text-slate-500">{(editPhotoFile.size / 1024).toFixed(0)} KB</div>
                      )}
                    </div>
                    <button type="button" onClick={editClearPhoto} className="text-red-600 hover:text-red-700" aria-label="Remove photo">
                      <XIcon size={18} />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {editRemovePhoto ? 'Photo will be removed on save.' : 'Leave unchanged to keep the current photo.'}
                </p>
              </>
            )}
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={2} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} disabled={editSaving} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete candidate?"
        onConfirm={remove} confirmText="Delete" danger>
        Deleting <strong>{deleteTarget?.name}</strong> will remove their votes from the results. This cannot be undone.
      </Modal>
    </div>
  );
}