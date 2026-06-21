import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const YEARS = [2023, 2024, 2025, 2026, 2027] as const;
type Year = typeof YEARS[number];

const YEAR_FILES: Record<Year, string> = {
  2023: '23QS.json',
  2024: '24QS.json',
  2025: '25QS.json',
  2026: '26QS.json',
  2027: '27QS.json',
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  arScore: 0.3, erScore: 0.15, fsrScore: 0.1, cpfScore: 0.2,
  ifrScore: 0.05, isrScore: 0.05, isdScore: 0, irnScore: 0.05,
  eoScore: 0.05, susScore: 0.05,
};

const METRICS = [
  { scoreKey: 'AR SCORE',  rankKey: 'AR RANK',  factorKey: 'arScore',  full: 'Academic Reputation',    color: '#22d3ee' },
  { scoreKey: 'ER SCORE',  rankKey: 'ER RANK',  factorKey: 'erScore',  full: 'Employer Reputation',     color: '#a78bfa' },
  { scoreKey: 'FSR SCORE', rankKey: 'FSR RANK', factorKey: 'fsrScore', full: 'Faculty/Student Ratio',   color: '#34d399' },
  { scoreKey: 'CPF SCORE', rankKey: 'CPF RANK', factorKey: 'cpfScore', full: 'Citations per Faculty',   color: '#fbbf24' },
  { scoreKey: 'IFR SCORE', rankKey: 'IFR RANK', factorKey: 'ifrScore', full: 'Intl. Faculty Ratio',     color: '#f472b6' },
  { scoreKey: 'ISR SCORE', rankKey: 'ISR RANK', factorKey: 'isrScore', full: 'Intl. Student Ratio',     color: '#60a5fa' },
  { scoreKey: 'ISD SCORE', rankKey: 'ISD RANK', factorKey: 'isdScore', full: 'Intl. Student Diversity', color: '#4ade80' },
  { scoreKey: 'IRN SCORE', rankKey: 'IRN RANK', factorKey: 'irnScore', full: 'Intl. Research Network',  color: '#fb923c' },
  { scoreKey: 'EO SCORE',  rankKey: 'EO RANK',  factorKey: 'eoScore',  full: 'Employment Outcomes',     color: '#e879f9' },
  { scoreKey: 'SUS SCORE', rankKey: 'SUS RANK', factorKey: 'susScore', full: 'Sustainability',          color: '#2dd4bf' },
] as const;

type HistEntry = { score: number | null; rank: number | null };
type YearHistory = Record<string, HistEntry>;

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

type ChartPoint = { year: Year; value: number };

type SparklineProps = {
  data: ChartPoint[];
  color: string;
  gradId: string;
  reversed: boolean;
  formatTooltip: (v: number) => string;
};

function Sparkline({ data, color, gradId, reversed, formatTooltip }: SparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="mt-3 h-18">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={reversed ? 0 : 0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={reversed ? 0.3 : 0} />
            </linearGradient>
          </defs>
          <YAxis hide reversed={reversed} />
          <XAxis
            dataKey="year"
            tick={{ fill: '#52525b', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 11,
              padding: '4px 10px',
            }}
            labelStyle={{ color: '#94a3b8', marginBottom: 2 }}
            itemStyle={{ color }}
            formatter={(v) => [typeof v === 'number' ? formatTooltip(v) : v, '']}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={{ fill: color, r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type Props = {
  datum: Record<string, unknown>;
  year: number;
  factors: string[];
  baseUrl: string;
  onClose: () => void;
};

export function UniversityModal({ datum, year, factors, baseUrl, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useState<Partial<Record<Year, YearHistory>>>({});
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
    const name = (datum['Institution Name'] as string).trim();
    Promise.all(
      YEARS.map(async (y) => {
        try {
          const res = await fetch(baseUrl + YEAR_FILES[y]);
          const json: Record<string, unknown>[] = await res.json();
          const entry = findUni(json, name);
          if (!entry) return [y, null] as const;
          const hist: YearHistory = {};
          METRICS.forEach(({ scoreKey, rankKey }) => {
            hist[scoreKey] = {
              score: typeof entry[scoreKey] === 'number' ? entry[scoreKey] as number : null,
              rank: parseRank(entry[rankKey]),
            };
          });
          return [y, hist] as const;
        } catch {
          return [y, null] as const;
        }
      })
    ).then(results => {
      const map: Partial<Record<Year, YearHistory>> = {};
      results.forEach(([y, hist]) => { if (hist) map[y] = hist; });
      setHistory(map);
    });
  }, [datum, baseUrl]);

  const rawWeights = factors.map(k => DEFAULT_WEIGHTS[k] ?? 0);
  const weightSum = rawWeights.reduce((a, b) => a + b, 0);
  const effectiveWeight = (factorKey: string) => {
    if (!factors.includes(factorKey) || weightSum === 0) return null;
    return (DEFAULT_WEIGHTS[factorKey] / weightSum) * 100;
  };

  const uniName = datum['Institution Name'] as string;
  const territory = (datum['Country'] as Record<string, string>)?.['Territory'] ?? '';
  const qsRank = datum[`${year} Rank`] as string | undefined;
  const prevRankStr = datum['Previous Rank'] as string | undefined;
  const overallScore = Number(datum['Overall SCORE']) || 0;

  const rankDiff = qsRank && prevRankStr ? Number(prevRankStr) - Number(qsRank) : null;
  const rankLabel = rankDiff === null ? null : rankDiff === 0 ? '–' : rankDiff > 0 ? `+${rankDiff}` : `${rankDiff}`;
  const rankColor = rankDiff === null || rankDiff === 0 ? 'text-slate-400' : rankDiff > 0 ? 'text-emerald-400' : 'text-red-400';

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
          'relative w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-300',
          visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-10 sm:translate-y-0 sm:scale-95',
        ].join(' ')}
      >
        {/* Sticky header */}
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
          <div className="pr-10">
            <h2 className="text-lg font-semibold tracking-tight text-white leading-snug">{uniName}</h2>
            <p className="text-sm text-slate-400">{territory}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {qsRank && (
              <span className="inline-flex items-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">
                #{qsRank}
              </span>
            )}
            {rankLabel && (
              <span className={`text-sm font-semibold tabular-nums ${rankColor}`}>
                {rankLabel} from last year
              </span>
            )}
            <span className="ml-auto text-xs uppercase tracking-wider text-slate-500">{year} QS</span>
          </div>
        </div>

        {/* Overall score */}
        <div className="border-b border-white/8 px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">QS Overall Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-cyan-300">{overallScore.toFixed(1)}</span>
            <span className="text-slate-500">/100</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-cyan-300 transition-all duration-700"
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Metric Breakdown</p>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setView('score')}
                className={[
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150',
                  view === 'score'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                Score
              </button>
              <button
                type="button"
                onClick={() => setView('rank')}
                className={[
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150',
                  view === 'rank'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                Rank
              </button>
            </div>
          </div>

          {view === 'rank' && (
            <p className="mb-3 text-[11px] text-slate-600">Lower rank = better. Chart inverted accordingly.</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {METRICS.map(({ scoreKey, rankKey, factorKey, full, color }) => {
              const score = typeof datum[scoreKey] === 'number' ? (datum[scoreKey] as number) : null;
              const rank = parseRank(datum[rankKey]);
              const wt = effectiveWeight(factorKey);

              const chartData: ChartPoint[] = YEARS.flatMap(y => {
                const entry = history[y]?.[scoreKey];
                if (!entry) return [];
                const v = view === 'score' ? entry.score : entry.rank;
                return typeof v === 'number' ? [{ year: y, value: v }] : [];
              });

              return (
                <div key={scoreKey} className="rounded-xl border border-white/8 bg-white/3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{full}</p>
                    {wt !== null && (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {wt.toFixed(0)}% wt
                      </span>
                    )}
                  </div>

                  {view === 'score' ? (
                    score !== null ? (
                      <>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                          {score.toFixed(1)}
                          <span className="ml-0.5 text-xs font-normal text-slate-500">/100</span>
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-base text-slate-600">N/A</p>
                    )
                  ) : (
                    rank !== null ? (
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                        #{rank}
                        {String(datum[rankKey]).endsWith('=') && (
                          <span className="ml-0.5 text-xs font-normal text-slate-500"> tied</span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-base text-slate-600">N/A</p>
                    )
                  )}

                  {historyLoaded ? (
                    chartData.length >= 2
                      ? (
                        <Sparkline
                          data={chartData}
                          color={color}
                          gradId={`grad-${factorKey}-${view}`}
                          reversed={view === 'rank'}
                          formatTooltip={view === 'score'
                            ? (v) => `${v.toFixed(1)}/100`
                            : (v) => `#${Math.round(v)}`
                          }
                        />
                      )
                      : <p className="mt-3 text-[10px] text-slate-700">No historical data</p>
                  ) : (
                    <div className="mt-3 h-18 flex items-center justify-center">
                      <span className="text-[10px] text-slate-700">Loading…</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Institution profile */}
        <div className="px-5 pb-6">
          <div className="rounded-xl border border-white/8 bg-white/3 p-3.5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500">Institution Profile</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['Size', datum['Size']],
                  ['Focus', datum['Focus']],
                  ['Research', datum['Research']],
                  ['Status', datum['Status']],
                  ['Region', datum['Region']],
                ] as [string, unknown][]
              ).filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-medium text-slate-200">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
