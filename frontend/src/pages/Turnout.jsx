import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, MapPin, ChevronRight, TrendingUp } from 'lucide-react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';

const colorFor = (pct, registered) => {
  if (!registered) return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-400', border: 'border-slate-200 dark:border-slate-700', accent: 'bg-slate-300' };
  if (pct >= 70) return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-700', accent: 'bg-green-500' };
  if (pct >= 40) return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700', accent: 'bg-yellow-500' };
  if (pct > 0)   return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-700', accent: 'bg-red-500' };
  return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500', border: 'border-slate-200 dark:border-slate-700', accent: 'bg-slate-400' };
};

export default function Turnout() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/vote/turnout/counties')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load turnout.'))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = (countyId) => {
    setSelectedCounty(countyId);
    setDetailLoading(true);
    api.get('/vote/turnout/counties/' + countyId)
      .then((r) => setDetail(r.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const clearDetail = () => {
    setSelectedCounty(null);
    setDetail(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand dark:text-slate-400">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex rounded-full bg-brand/10 p-3 text-brand">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-3xl font-bold">Voter Turnout</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Turnout across Kenyan counties in the current election
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20"><Spinner size={40} /></div>
        )}

        {error && !loading && (
          <div className="card text-center py-12">
            <p className="text-slate-500">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Totals header */}
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{data.election?.title || 'Election'}</h2>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                    data.election?.status === 'OPEN'
                      ? 'bg-green-100 text-green-800'
                      : data.election?.status === 'CLOSED'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.election?.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Users size={14} /> Registered Voters</div>
                  <div className="mt-1 text-2xl font-bold">{data.totals.registeredVoters.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><BarChart3 size={14} /> Votes Cast</div>
                  <div className="mt-1 text-2xl font-bold">{data.totals.votesCast.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">Overall Turnout</div>
                  <div className="mt-1 text-2xl font-bold">{data.totals.turnoutPercent}%</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500">Legend:</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-500" /> &gt;70%</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-yellow-500" /> 40–70%</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500" /> &lt;40%</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-slate-400" /> No data</span>
            </div>

            {/* County grid */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <MapPin size={16} /> County Turnout
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.counties.map((c) => {
                  const colors = colorFor(c.turnoutPercent, c.registeredVoters);
                  const isSelected = selectedCounty === c.id;
                  return (
                    <button
                      key={c.countyId}
                      onClick={() => isSelected ? clearDetail() : loadDetail(c.countyId)}
                      className={`text-left rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${colors.bg} ${colors.border} ${isSelected ? 'ring-2 ring-brand ring-offset-2' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{c.countyName}</span>
                            <span className="text-xs text-slate-400 font-mono">{c.countyCode}</span>
                          </div>
                          <div className={`mt-1 text-xs ${colors.text}`}>
                            {c.registeredVoters > 0
                              ? `${c.registeredVoters.toLocaleString()} registered · ${c.votesCast.toLocaleString()} voted`
                              : 'No registered voters'}
                          </div>
                        </div>
                        <ChevronRight size={16} className={`shrink-0 text-slate-400 transition ${isSelected ? 'rotate-90' : ''}`} />
                      </div>

                      <div className={`mt-3 text-2xl font-bold ${colors.text}`}>
                        {c.registeredVoters > 0 ? `${c.turnoutPercent}%` : '—'}
                      </div>

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full ${colors.accent}`}
                          style={{ width: `${Math.min(c.turnoutPercent, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selectedCounty && (
              <div className="card">
                {detailLoading && <div className="flex justify-center py-6"><Spinner size={24} /></div>}
                {!detailLoading && detail && (
                  <>
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                      <div>
                        <h3 className="text-lg font-semibold">{detail.county?.name} County</h3>
                        <p className="text-xs text-slate-500">Turnout by constituency</p>
                      </div>
                      <button onClick={clearDetail} className="text-xs text-slate-500 hover:text-slate-700">Close</button>
                    </div>

                    {detail.constituencies.length === 0 ? (
                      <p className="text-sm text-slate-500">No constituencies with data.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-slate-200 text-left dark:border-slate-700">
                            <tr>
                              <th className="p-2">Constituency</th>
                              <th className="p-2 text-right">Registered</th>
                              <th className="p-2 text-right">Voted</th>
                              <th className="p-2 text-right">Turnout</th>
                              <th className="p-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.constituencies.map((c) => {
                              const colors = colorFor(c.turnoutPercent, c.registeredVoters);
                              return (
                                <tr key={c.constituencyId} className="border-b border-slate-100 dark:border-slate-800">
                                  <td className="p-2 font-medium">{c.constituencyName}</td>
                                  <td className="p-2 text-right font-mono">{c.registeredVoters.toLocaleString()}</td>
                                  <td className="p-2 text-right font-mono">{c.votesCast.toLocaleString()}</td>
                                  <td className={`p-2 text-right font-mono font-semibold ${colors.text}`}>
                                    {c.registeredVoters > 0 ? `${c.turnoutPercent}%` : '—'}
                                  </td>
                                  <td className="p-2 w-32">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                      <div className={`h-full rounded-full ${colors.accent}`} style={{ width: `${Math.min(c.turnoutPercent, 100)}%` }} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Ranking table */}
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={16} /> County Ranking
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left dark:border-slate-700">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">County</th>
                      <th className="p-2 text-right">Registered</th>
                      <th className="p-2 text-right">Voted</th>
                      <th className="p-2 text-right">Turnout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.counties.map((c, i) => {
                      const colors = colorFor(c.turnoutPercent, c.registeredVoters);
                      return (
                        <tr key={c.countyId} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-2 font-medium">{c.countyName}</td>
                          <td className="p-2 text-right font-mono">{c.registeredVoters.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono">{c.votesCast.toLocaleString()}</td>
                          <td className={`p-2 text-right font-mono font-semibold ${colors.text}`}>
                            {c.registeredVoters > 0 ? `${c.turnoutPercent}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Demo/Administrative System — Not an official election registration platform.
        </p>
      </div>
    </div>
  );
}