import { useState } from 'react';

export type RankingCardProps = {
  ranking: number;
  uniName: string;
  uniTerritory: string;
  arScore: number;
  erScore: number;
  fsrScore: number;
  cpfScore: number;
  ifrScore: number;
  isrScore: number;
  isdScore: number;
  irnScore: number;
  eoScore: number;
  susScore: number;
  aggScore: number;
  length: number;
  prevRank: number;
  onClick?: () => void;
  onCompare?: () => void;
  isCompared?: boolean;
  compareDisabled?: boolean;
};

const FACTORS = [
  { key: 'ar',  label: 'AR',  full: 'Academic Reputation' },
  { key: 'er',  label: 'ER',  full: 'Employer Reputation' },
  { key: 'fsr', label: 'FSR', full: 'Faculty/Student Ratio' },
  { key: 'cpf', label: 'CPF', full: 'Citations per Faculty' },
  { key: 'ifr', label: 'IFR', full: 'Intl. Faculty Ratio' },
  { key: 'isr', label: 'ISR', full: 'Intl. Student Ratio' },
  { key: 'isd', label: 'ISD', full: 'Intl. Student Diversity' },
  { key: 'irn', label: 'IRN', full: 'Intl. Research Network' },
  { key: 'eo',  label: 'EO',  full: 'Employment Outcomes' },
  { key: 'sus', label: 'SUS', full: 'Sustainability' },
];

export function RankingCard({
  ranking, uniName, uniTerritory,
  arScore, erScore, fsrScore, cpfScore, ifrScore,
  isrScore, isdScore, irnScore, eoScore, susScore, aggScore, length, prevRank, onClick, onCompare, isCompared, compareDisabled,
}: RankingCardProps) {
  const [activeTab, setActiveTab] = useState('ar');

  const scores: Record<string, number> = {
    ar: arScore, er: erScore, fsr: fsrScore, cpf: cpfScore,
    ifr: ifrScore, isr: isrScore, isd: isdScore, irn: irnScore,
    eo: eoScore, sus: susScore,
  };

  const active = FACTORS.find(f => f.key === activeTab)!;
  const score = scores[activeTab];

  const rankDiff = prevRank === 0 ? null : prevRank - ranking;
  const rankLabel = rankDiff === null ? null : rankDiff === 0 ? '–' : rankDiff > 0 ? `+${rankDiff}` : `${rankDiff}`;
  const rankColor = rankDiff === null || rankDiff === 0 ? 'text-slate-400' : rankDiff > 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] transition-colors duration-150${onClick ? ' cursor-pointer hover:border-white/20 active:border-white/30' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-4 sm:gap-4 sm:px-5">
      {rankLabel !== null && (
        <span className={`text-xs font-semibold tabular-nums ${rankColor}`}>{rankLabel}</span>
      )}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-sm font-semibold text-cyan-200 sm:h-10 sm:w-10">
          #{ranking}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">{uniName}</h3>
          <p className="text-sm text-slate-300">{uniTerritory}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{length ? "Aggregate Score" : "QS Score"}</p>
          <p className="text-2xl font-bold tabular-nums text-cyan-300">{aggScore.toFixed(1)}</p>
        </div>
        {onCompare && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onCompare(); }}
            disabled={compareDisabled}
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
            className={[
              'shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150',
              isCompared
                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                : compareDisabled
                  ? 'cursor-not-allowed border-white/5 text-slate-700'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300',
            ].join(' ')}
          >
            {isCompared ? (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto border-b border-white/8 bg-black/20">
        {FACTORS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={e => { e.stopPropagation(); setActiveTab(f.key); }}
            className={[
              'relative shrink-0 px-4 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors duration-150 touch-manipulation sm:py-2.5',
              activeTab === f.key
                ? 'text-cyan-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
                : 'text-slate-400 active:text-slate-200 sm:hover:text-slate-200',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-slate-300">{active.full}</span>
          <span className="text-2xl font-bold tabular-nums text-white">
            {score.toFixed(1)}
            <span className="ml-0.5 text-sm font-normal text-slate-400">/100</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 sm:h-2">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
