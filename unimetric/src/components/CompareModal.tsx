import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const YEARS = [2023, 2024, 2025, 2026, 2027] as const;
type Year = typeof YEARS[number];

const YEAR_FILES: Record<Year, string> = {
  2023: '23QS.json', 2024: '24QS.json', 2025: '25QS.json', 2026: '26QS.json', 2027: '27QS.json',
};

export const UNI_COLORS = ['#22d3ee', '#fbbf24', '#a78bfa'] as const;

const DEFAULT_WEIGHTS: Record<string, number> = {
  arScore: 0.3, erScore: 0.15, fsrScore: 0.1, cpfScore: 0.2,
  ifrScore: 0.05, isrScore: 0.05, isdScore: 0, irnScore: 0.05,
  eoScore: 0.05, susScore: 0.05,
};

const METRICS = [
  { scoreKey: 'AR SCORE',  rankKey: 'AR RANK',  factorKey: 'arScore',  full: 'Academic Reputation' },
  { scoreKey: 'ER SCORE',  rankKey: 'ER RANK',  factorKey: 'erScore',  full: 'Employer Reputation' },
  { scoreKey: 'FSR SCORE', rankKey: 'FSR RANK', factorKey: 'fsrScore', full: 'Faculty/Student Ratio' },
  { scoreKey: 'CPF SCORE', rankKey: 'CPF RANK', factorKey: 'cpfScore', full: 'Citations per Faculty' },
  { scoreKey: 'IFR SCORE', rankKey: 'IFR RANK', factorKey: 'ifrScore', full: 'Intl. Faculty Ratio' },
  { scoreKey: 'ISR SCORE', rankKey: 'ISR RANK', factorKey: 'isrScore', full: 'Intl. Student Ratio' },
  { scoreKey: 'ISD SCORE', rankKey: 'ISD RANK', factorKey: 'isdScore', full: 'Intl. Student Diversity' },
  { scoreKey: 'IRN SCORE', rankKey: 'IRN RANK', factorKey: 'irnScore', full: 'Intl. Research Network' },
  { scoreKey: 'EO SCORE',  rankKey: 'EO RANK',  factorKey: 'eoScore',  full: 'Employment Outcomes' },
  { scoreKey: 'SUS SCORE', rankKey: 'SUS RANK', factorKey: 'susScore', full: 'Sustainability' },
] as const;

type HistEntry = { score: number | null; rank: number | null };
type YearHistory = Record<string, HistEntry>;
type UniHistory = Partial<Record<Year, YearHistory>>;

function parseRank(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseInt(v.replace('=', ''), 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function findUni(json: Record<string, unknown>[], name: string): Record<string, unknown> | undefined {
  const norm = (s: string) => s.trim().toLowerCase();
  const sigWords = (s: string) => s.split(/\W+/).filter(w => w.length > 2);
  const target = norm(name);
  const tw = sigWords(target);
  return (
    json.find(d => norm(d['Institution Name'] as string) === target) ??
    json.find(d => { const n = norm(d['Institution Name'] as string); return n.startsWith(target) || target.startsWith(n); }) ??
    (tw.length >= 3 ? json.find(d => { const dw = sigWords(norm(d['Institution Name'] as string)); return tw.every(w => dw.includes(w)) || dw.every(w => tw.includes(w)); }) : undefined)
  );
}

type Props = {
  unis: Record<string, unknown>[];
  year: number;
  factors: string[];
  baseUrl: string;
  onClose: () => void;
};

export function CompareModal({ unis, year, factors, baseUrl, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useState<Record<string, UniHistory>>({});
  const [view, setView] = useState<'score' | 'rank'>('score');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const names = unis.map(u => (u['Institution Name'] as string).trim());
    Promise.all(
      YEARS.map(async (y) => {
        try {
          const res = await fetch(baseUrl + YEAR_FILES[y]);
          const json: Record<string, unknown>[] = await res.json();
          const byName: Record<string, YearHistory> = {};
          names.forEach(name => {
            const entry = findUni(json, name);
            if (!entry) return;
            const hist: YearHistory = {};
            METRICS.forEach(({ scoreKey, rankKey }) => {
              hist[scoreKey] = {
                score: typeof entry[scoreKey] === 'number' ? entry[scoreKey] as number : null,
                rank: parseRank(entry[rankKey]),
              };
            });
            byName[name] = hist;
          });
          return [y, byName] as const;
        } catch {
          return [y, {}] as const;
        }
      })
    ).then(results => {
      const map: Record<string, UniHistory> = {};
      names.forEach(name => { map[name] = {}; });
      results.forEach(([y, byName]) => {
        Object.entries(byName).forEach(([name, hist]) => {
          if (map[name]) map[name][y] = hist;
        });
      });
      setHistory(map);
    });
  }, [unis, baseUrl]);

  const rawWeights = factors.map(k => DEFAULT_WEIGHTS[k] ?? 0);
  const weightSum = rawWeights.reduce((a, b) => a + b, 0);
  const effectiveWeight = (factorKey: string) => {
    if (!factors.includes(factorKey) || weightSum === 0) return null;
    return (DEFAULT_WEIGHTS[factorKey] / weightSum) * 100;
  };

  const historyLoaded = Object.keys(history).length > 0;

  const modal = (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className={[
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300',
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0',
      ].join(' ')}
    >
      <div
        className={[
          'relative w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-300',
          visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-10 sm:translate-y-0 sm:scale-95',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 border-b border-white/8 bg-zinc-900/95 backdrop-blur-md px-5 py-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-slate-400 transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="pr-10 text-lg font-semibold tracking-tight text-white">
            Comparing {unis.length} {unis.length === 1 ? 'University' : 'Universities'}
          </h2>
        </div>

        <div className="border-b border-white/8 px-5 py-4">
          <div className={`grid gap-3 grid-cols-${unis.length}`}>
            {unis.map((uni, i) => {
              const name = uni['Institution Name'] as string;
              const territory = (uni['Country'] as Record<string, string>)?.['Territory'] ?? '';
              const qsRank = uni[`${year} Rank`] as string | undefined;
              const prevRankStr = uni['Previous Rank'] as string | undefined;
              const overallScore = Number(uni['Overall SCORE']) || 0;
              const rankDiff = qsRank && prevRankStr ? Number(prevRankStr) - Number(qsRank) : null;
              const rankLabel = rankDiff === null ? null : rankDiff === 0 ? '–' : rankDiff > 0 ? `+${rankDiff}` : `${rankDiff}`;
              const rankColor = rankDiff === null || rankDiff === 0 ? 'text-slate-400' : rankDiff > 0 ? 'text-emerald-400' : 'text-red-400';
              return (
                <div key={name} className="rounded-xl border bg-white/3 p-3" style={{ borderColor: `${UNI_COLORS[i]}33` }}>
                  <div className="mb-1 flex items-start gap-1.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: UNI_COLORS[i] }} />
                    <p className="text-xs font-semibold leading-tight text-slate-200 line-clamp-2">{name}</p>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">{territory}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {qsRank && <span className="text-xs font-semibold text-white">#{qsRank}</span>}
                    {rankLabel && <span className={`text-[11px] font-medium tabular-nums ${rankColor}`}>{rankLabel}</span>}
                  </div>
                  <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: UNI_COLORS[i] }}>
                    {overallScore.toFixed(1)}
                    <span className="ml-0.5 text-xs font-normal text-slate-500">/100</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Metric Breakdown</p>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setView('score')}
                className={['rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150', view === 'score' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'].join(' ')}
              >Score</button>
              <button
                type="button"
                onClick={() => setView('rank')}
                className={['rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150', view === 'rank' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'].join(' ')}
              >Rank</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {METRICS.map(({ scoreKey, rankKey, factorKey, full }) => {
              const wt = effectiveWeight(factorKey);

              const chartData = YEARS.map(yr => {
                const point: Record<string, number> = { year: yr };
                unis.forEach((uni, i) => {
                  const name = (uni['Institution Name'] as string).trim();
                  const entry = history[name]?.[yr]?.[scoreKey];
                  if (entry) {
                    const v = view === 'score' ? entry.score : entry.rank;
                    if (v !== null) point[`v${i}`] = v;
                  }
                });
                return point;
              });

              const hasChart = historyLoaded && chartData.some(p => unis.some((_, i) => `v${i}` in p));

              return (
                <div key={scoreKey} className="rounded-xl border border-white/8 bg-white/3 p-3.5">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{full}</p>
                    {wt !== null && (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {wt.toFixed(0)}% wt
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {unis.map((uni, i) => {
                      const score = typeof uni[scoreKey] === 'number' ? uni[scoreKey] as number : null;
                      const rank = parseRank(uni[rankKey]);
                      const color = UNI_COLORS[i];
                      return (
                        <div key={i}>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                            <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                              {(uni['Institution Name'] as string).replace(/\(.*?\)/, '').trim()}
                            </span>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-white">
                              {view === 'score'
                                ? (score !== null ? score.toFixed(1) : '—')
                                : (rank !== null ? `#${rank}` : '—')}
                            </span>
                          </div>
                          {view === 'score' && score !== null && (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hasChart ? (
                    <div className="mt-3 h-18">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                          <YAxis hide reversed={view === 'rank'} />
                          <XAxis
                            dataKey="year"
                            tick={{ fill: '#52525b', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, padding: '4px 10px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: 2 }}
                            itemStyle={{ fontSize: 11 }}
                            formatter={(v, name) => {
                              const idx = parseInt(String(name).replace('v', ''), 10);
                              const label = (unis[idx]['Institution Name'] as string).replace(/\(.*?\)/, '').trim();
                              return [view === 'score' ? `${(v as number).toFixed(1)}/100` : `#${Math.round(v as number)}`, label];
                            }}
                            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                          />
                          {unis.map((_, i) => (
                            <Line
                              key={i}
                              type="monotone"
                              dataKey={`v${i}`}
                              stroke={UNI_COLORS[i]}
                              strokeWidth={2}
                              dot={{ fill: UNI_COLORS[i], r: 2.5, strokeWidth: 0 }}
                              activeDot={{ r: 4, fill: UNI_COLORS[i], strokeWidth: 0 }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-3 h-18 flex items-center justify-center">
                      <span className="text-[10px] text-slate-700">{historyLoaded ? 'No historical data' : 'Loading…'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
