import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Vote as VoteIcon, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../hooks/useToast.jsx';

const initialCreds = { referenceNumber: '', phone: '' };

export default function Vote() {
  const [step, setStep] = useState('verify');
  const [creds, setCreds] = useState(initialCreds);
  const [voter, setVoter] = useState(null);
  const [election, setElection] = useState(null);
  const [ballot, setBallot] = useState([]);
  const [votedPositionIds, setVotedPositionIds] = useState([]);
  const [choices, setChoices] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/vote/verify', {
        referenceNumber: creds.referenceNumber.trim().toUpperCase(),
        phone: creds.phone.trim()
      });
      setVoter(data.voter);
      setElection(data.election);
      setBallot(data.ballot);
      setVotedPositionIds(data.votedPositionIds);
      setStep('ballot');
      if (data.votedPositionIds.length > 0) {
        toast.info('You have already voted for some positions.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitVotes = async () => {
    const payloadChoices = Object.entries(choices)
      .filter(([posId]) => !votedPositionIds.includes(posId))
      .map(([positionId, candidateId]) => ({ positionId, candidateId }));

    if (payloadChoices.length === 0) {
      toast.error('Please select at least one candidate.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/vote/cast', {
        referenceNumber: voter.referenceNumber,
        phone: creds.phone.trim(),
        choices: payloadChoices
      });
      setReceipt(data);
      setStep('receipt');
      toast.success('Your vote has been cast.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cast vote.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep('verify');
    setCreds(initialCreds);
    setVoter(null);
    setElection(null);
    setBallot([]);
    setChoices({});
    setVotedPositionIds([]);
    setReceipt(null);
    setError('');
  };

  return (
    <div className="min-h-screen" style={{ background: '#eff6ff' }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand dark:text-slate-400">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex rounded-full bg-brand/10 p-3 text-brand">
            <VoteIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold">Cast Your Vote</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Verify your identity with your voter reference number and phone
          </p>
        </div>

        {step === 'verify' && (
          <form onSubmit={verify} className="card mx-auto max-w-md space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="label">Voter Reference Number</label>
              <input
                className="input font-mono"
                value={creds.referenceNumber}
                onChange={(e) => setCreds({ ...creds, referenceNumber: e.target.value })}
                placeholder="VRS-2024-00001"
                required
                autoFocus
              />
              <p className="mt-1 text-xs text-slate-500">Found on your voter registration slip.</p>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                value={creds.phone}
                onChange={(e) => setCreds({ ...creds, phone: e.target.value })}
                placeholder="0712345678"
                required
              />
              <p className="mt-1 text-xs text-slate-500">The number on your registration.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Spinner size={16} /> Verifying...</> : <><ShieldCheck size={16} /> Verify &amp; Continue</>}
            </button>

            <p className="text-center text-xs text-slate-500">
              Only voters with an <strong>APPROVED</strong> registration can vote.
            </p>
          </form>
        )}

        {step === 'ballot' && voter && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500">Voter</div>
                  <div className="font-semibold">{voter.fullName}</div>
                  <div className="text-xs text-slate-500 font-mono">{voter.referenceNumber}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{voter.county} County</div>
                  <div>{voter.constituency} Constituency</div>
                  <div>{voter.ward} Ward</div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <strong>Election:</strong> {election.title}
              {election.description && <p className="mt-1 text-xs">{election.description}</p>}
            </div>

            {ballot.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-slate-500">No positions available for you in this election.</p>
              </div>
            ) : (
              ballot.map(({ position, candidates }) => {
                const alreadyVoted = votedPositionIds.includes(position.id);
                return (
                  <div key={position.id} className="card">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                      <div>
                        <h3 className="font-semibold">{position.title}</h3>
                        <span className="text-xs text-slate-500">{position.scope}</span>
                      </div>
                      {alreadyVoted && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Already voted
                        </span>
                      )}
                    </div>

                    {alreadyVoted ? (
                      <p className="text-sm text-slate-500 italic">You have already cast a vote for this position.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {candidates.map((c) => {
                          const selected = choices[position.id] === c.id;
                          return (
                            <label
                              key={c.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                                selected
                                  ? 'border-brand bg-brand/5'
                                  : 'border-slate-200 hover:border-brand/50 dark:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={position.id}
                                checked={selected}
                                onChange={() => setChoices({ ...choices, [position.id]: c.id })}
                                className="sr-only"
                              />
                              {c.photoUrl ? (
                                <img src={c.photoUrl} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-bold">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{c.name}</div>
                                {c.party && <div className="text-xs text-slate-500">{c.party}</div>}
                              </div>
                              {selected && <CheckCircle2 size={20} className="text-brand" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="flex flex-wrap justify-between gap-2">
              <button onClick={resetAll} className="btn-secondary">
                <ArrowLeft size={16} /> Start Over
              </button>
              <button onClick={submitVotes} disabled={loading} className="btn-primary">
                {loading ? <><Spinner size={16} /> Casting...</> : 'Cast My Vote'}
              </button>
            </div>
          </div>
        )}

        {step === 'receipt' && receipt && (
          <div className="card mx-auto max-w-lg text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-green-100 p-4 text-green-700">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold">Vote Cast Successfully</h2>
            <p className="mt-1 text-sm text-slate-500">
              Thank you for participating in {election?.title}.
            </p>

            <div className="my-6 rounded-lg border-2 border-dashed border-brand/30 bg-brand/5 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Receipt Code</div>
              <div className="mt-2 font-mono text-2xl font-bold tracking-wider text-brand">
                {receipt.receiptCode}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Keep this code safe. It proves you cast {receipt.votedPositions} vote(s).
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => window.print()} className="btn-secondary">Print Receipt</button>
              <Link to="/results" className="btn-primary">View Results</Link>
              <button onClick={resetAll} className="btn-secondary">Done</button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Demo/Administrative System - Not an official election registration platform.
        </p>
      </div>
    </div>
  );
}