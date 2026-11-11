import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Printer, Archive, FileText } from 'lucide-react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { fmtDate, fmtDateTime } from '../utils/format.js';
import { STATUS_COLORS } from '../utils/constants.js';

export default function VoterDetail() {
  const { id } = useParams();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/voters/${id}`).then(r => setV(r.data)).catch(() => toast.error('Record not found')).finally(() => setLoading(false));
  }, [id]);

  const archive = async () => {
    try {
      await api.patch(`/voters/${id}/archive`);
      toast.success('Record archived');
      setConfirmOpen(false);
      nav('/voters');
    } catch { toast.error('Archive failed'); }
  };

  const downloadIdCard = async () => {
    try {
      const res = await api.get(`/voters/${id}/card`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Voter-ID-${v.referenceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('ID Card downloaded');
    } catch (err) {
      toast.error('Failed to generate ID card. Make sure the backend is running.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!v) return <p>Record not found.</p>;

  const canEdit = ['ADMINISTRATOR', 'REGISTRATION_OFFICER'].includes(user?.role) && v.registrationStatus !== 'ARCHIVED';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button onClick={() => nav(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
        <div className="flex gap-2">
          {canEdit && <Link to={`/voters/${id}/edit`} className="btn-secondary"><Edit size={16} /> Edit</Link>}
          <button onClick={downloadIdCard} className="btn-primary"><FileText size={16} /> Download ID</button>
          <button onClick={() => window.print()} className="btn-secondary"><Printer size={16} /> Print</button>
          {canEdit && <button onClick={() => setConfirmOpen(true)} className="btn-danger"><Archive size={16} /> Archive</button>}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
          <div>
            <div className="text-xs text-slate-500">Reference</div>
            <div className="font-mono text-lg">{v.referenceNumber}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_COLORS[v.registrationStatus]}`}>{v.registrationStatus}</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Section title="Personal Information">
            <Row label="Full Name" value={v.fullName} />
            <Row label="ID Number" value={v.idNumber || '—'} />
            <Row label="Date of Birth" value={fmtDate(v.dateOfBirth)} />
            <Row label="Nationality" value={v.nationality} />
            <Row label="Gender" value={v.gender || '—'} />
            <Row label="Phone" value={v.phone || '—'} />
          </Section>
          <Section title="Location">
            <Row label="County" value={v.county?.name} />
            <Row label="Constituency" value={v.constituency?.name} />
            <Row label="Ward" value={v.ward?.name} />
            <Row label="Polling Station" value={v.pollingStation?.name || '—'} />
          </Section>
          <Section title="Registration">
            <Row label="Status" value={v.registrationStatus} />
            <Row label="Registered" value={fmtDate(v.createdAt)} />
            <Row label="Registered By" value={v.registeredBy?.fullName} />
            <Row label="Updated" value={fmtDateTime(v.updatedAt)} />
          </Section>
          {v.notes && <Section title="Notes"><p className="text-sm">{v.notes}</p></Section>}
        </div>
      </div>

      <p className="hidden text-center text-xs text-slate-500 print:block">Demo/Administrative System — Not an official election registration platform.</p>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Archive this record?"
        onConfirm={archive} confirmText="Archive" danger>
        Are you sure you want to archive this record? This action will remove it from active records.
      </Modal>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    <div className="space-y-1">{children}</div>
  </div>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-100 py-1.5 text-sm dark:border-slate-800">
    <span className="text-slate-500">{label}</span><span className="font-medium text-right">{value}</span>
  </div>
);