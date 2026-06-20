import {
  NavLink,
  Navigate,
  Route,
  Routes,
  type NavLinkRenderProps,
} from "react-router-dom";
import { RankingCard } from "./components/RankingCard";
import { useEffect, useMemo, useState } from "react";

const defaultFactorWeights = {
  arScore: 0.3,
  erScore: 0.15,
  fsrScore: 0.1,
  cpfScore: 0.2,
  ifrScore: 0.05,
  isrScore: 0.05,
  isdScore: 0,
  irnScore: 0.05,
  eoScore: 0.05,
  susScore: 0.05,
};

type FactorKey = keyof typeof defaultFactorWeights;

function calculateAggScore(
  datum: Record<string, unknown>,
  factors: FactorKey[],
): number {
  if (!factors.length) return 0;
  const raw = factors.map((k) => defaultFactorWeights[k]);
  const sum = raw.reduce((a, b) => a + b, 0);
  return factors.reduce((score, key, i) => {
    const v = datum[factorNames[key]];
    return score + (raw[i] / sum) * (typeof v === "number" ? v : 0);
  }, 0);
}

const factorNames: Record<FactorKey, string> = {
  arScore: "AR SCORE",
  erScore: "ER SCORE",
  fsrScore: "FSR SCORE",
  cpfScore: "CPF SCORE",
  ifrScore: "IFR SCORE",
  isrScore: "ISR SCORE",
  isdScore: "ISD SCORE",
  irnScore: "IRN SCORE",
  eoScore: "EO SCORE",
  susScore: "SUS SCORE",
};

function App() {
  const linkClassName = ({ isActive }: NavLinkRenderProps) =>
    [
      "inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-medium transition duration-150 touch-manipulation sm:py-2",
      isActive
        ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50 shadow-[0_12px_32px_-18px_rgba(34,211,238,0.65)]"
        : "border-white/15 bg-white/8 text-slate-200 active:border-white/30 active:bg-white/10 active:text-white sm:hover:-translate-y-0.5 sm:hover:border-white/30 sm:hover:bg-white/10 sm:hover:text-white",
    ].join(" ");

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-6">
        <header className="relative overflow-hidden rounded-4xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_40%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                UniMetric
              </h1>
            </div>

            <nav className="flex flex-wrap gap-2" aria-label="Primary">
              <NavLink to="/" end className={linkClassName}>
                Home
              </NavLink>
              <NavLink to="/rankings" className={linkClassName}>
                Rankings
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="grid flex-1 place-items-center py-2 sm:py-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <section className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_28px_90px_-32px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[2.25rem] sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_45%)]" />
      <div className="relative flex flex-col gap-8 sm:gap-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold leading-tight tracking-tighter text-white sm:text-4xl lg:text-5xl">
            Find your ideal
            <br />
            <span className="text-cyan-300">university.</span>
          </h2>
          <p className="mt-4 max-w-prose text-base leading-7 text-slate-300 sm:text-lg">
            UniMetric lets you cut through the noise — pick the ranking factors
            that matter to you and see which universities rise to the top.
          </p>
          <div className="mt-7">
            <NavLink
              to="/rankings"
              className="inline-flex touch-manipulation items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-6 py-3.5 text-sm font-semibold text-cyan-50 transition active:bg-cyan-300/25 active:text-white sm:py-3 sm:hover:-translate-y-0.5 sm:hover:border-cyan-200/60 sm:hover:bg-cyan-300/20 sm:hover:text-white"
            >
              Explore 2027 Rankings
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </NavLink>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-white/8 pt-7 sm:gap-6 sm:pt-8">
          <div>
            <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
              1,501
            </p>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Universities ranked
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
              10
            </p>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              QS ranking factors
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-cyan-300 sm:text-3xl">
              2026 and 2027
            </p>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Latest QS data
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              title: "Custom weights",
              body: "Choose which factors matter most to you — reputation, research, international mix — and rerank instantly.",
            },
            {
              title: "Instant search",
              body: "Filter 1,500+ institutions by name in real time, no page reloads.",
            },
            {
              title: "Score breakdown",
              body: "Tap any ranking card to explore each university's score across all 10 QS factors.",
            },
          ].map(({ title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/8 bg-white/8 p-4 sm:p-5"
            >
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PAGE_SIZE = 20;

function RankingsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [year, setYear] = useState(2027);
  const [factors, setFactors] = useState<FactorKey[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loadedYear, setLoadedYear] = useState<number | null>(null);
  const loading = loadedYear !== year;
  const [country, setCountry] = useState("Global");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const file = year === 2027 ? "27QS.json" : "26QS.json";
    fetch(import.meta.env.BASE_URL + file)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoadedYear(year);
      });
  }, [year]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setVisibleCount(PAGE_SIZE);
    }, 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const countries = useMemo(
    () =>
      data.length
        ? [
            "Global",
            ...Array.from(
              new Set(
                data.map(
                  (d) => (d["Country"] as Record<string, string>)["Territory"],
                ),
              ),
            ).sort(),
          ]
        : ["Global"],
    [data],
  );

  const processed = useMemo((): Record<string, unknown>[] => {
    if (!data.length) return [];
    return [...data]
      .map(
        (datum) =>
          ({
            ...datum,
            "AGG SCORE": calculateAggScore(datum, factors),
          }) as Record<string, unknown>,
      )
      .sort(
        (a, b) =>
          ((b["AGG SCORE"] as number) ?? 0) - ((a["AGG SCORE"] as number) ?? 0),
      )
      .map(
        (datum, index) =>
          ({ ...datum, "AGG RANK": index + 1 }) as Record<string, unknown>,
      )
      .filter(
        (item) =>
          (country === "Global" ||
            (item["Country"] as Record<string, string>)["Territory"] ===
              country) &&
          (item["Institution Name"] as string)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
  }, [data, factors, country, searchTerm]);

  return (
    <section className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_28px_90px_-32px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[2.25rem] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_45%)]" />
      <div className="relative flex flex-col gap-5 sm:gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tighter text-white sm:text-4xl">
            {`${year}`} Rankings
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            QS World University Rankings · 1,501 institutions
          </p>
        </div>
        <div>
          <p className="text-center text-sm font-medium text-slate-300 sm:text-left">
            Select the QS Rankings year:
          </p>
          <div className="mt-2 flex justify-center gap-2 sm:justify-start">
            {([2026, 2027] as const).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={[
                  "inline-flex touch-manipulation items-center rounded-full border px-3.5 py-2 text-xs font-medium transition duration-150 sm:px-4 sm:py-1.5 sm:text-sm",
                  year === y
                    ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50 shadow-[0_8px_24px_-12px_rgba(34,211,238,0.65)]"
                    : "border-white/15 bg-white/8 text-slate-300 active:border-white/30 active:bg-white/12 active:text-white sm:hover:-translate-y-0.5 sm:hover:border-white/30 sm:hover:bg-white/12 sm:hover:text-white",
                ].join(" ")}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm font-medium text-slate-300 sm:text-left">
            Select what factors you care about:
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-3">
            {(
              [
                {
                  group: "Reputation",
                  factors: [
                    {
                      key: "arScore",
                      label: "Academic Reputation",
                      audience: "ug",
                    },
                    {
                      key: "erScore",
                      label: "Employer Reputation",
                      audience: "ug",
                    },
                  ],
                },
                {
                  group: "Teaching & Outcomes",
                  factors: [
                    {
                      key: "fsrScore",
                      label: "Faculty/Student Ratio",
                      audience: "ug",
                    },
                    {
                      key: "eoScore",
                      label: "Employment Outcomes",
                      audience: "ug",
                    },
                    {
                      key: "susScore",
                      label: "Sustainability",
                      audience: "ug",
                    },
                  ],
                },
                {
                  group: "Research",
                  factors: [
                    {
                      key: "cpfScore",
                      label: "Citations per Faculty",
                      audience: "pg",
                    },
                    {
                      key: "irnScore",
                      label: "Intl. Research Network",
                      audience: "pg",
                    },
                  ],
                },
                {
                  group: "International",
                  factors: [
                    {
                      key: "ifrScore",
                      label: "Intl. Faculty Ratio",
                      audience: "pg",
                    },
                    {
                      key: "isrScore",
                      label: "Intl. Student Ratio",
                      audience: "pg",
                    },
                    {
                      key: "isdScore",
                      label: "Intl. Student Diversity",
                      audience: "pg",
                      onlyYear: 2026,
                    },
                  ],
                },
              ] as {
                group: string;
                factors: {
                  key: FactorKey;
                  label: string;
                  audience: "ug" | "pg";
                  onlyYear?: number;
                }[];
              }[]
            ).map(({ group, factors: groupFactors }) => (
              <div
                key={group}
                className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {group}
                </span>
                <div className="flex flex-wrap justify-center gap-2 sm:contents">
                  {groupFactors.map(({ key, label, audience }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setFactors(
                          factors.includes(key)
                            ? factors.filter((f) => f !== key)
                            : [...factors, key],
                        );
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className={[
                        "inline-flex touch-manipulation items-center rounded-full border px-3 py-2 text-xs font-medium transition duration-150 sm:px-3.5 sm:py-1.5 sm:text-sm",
                        factors.includes(key)
                          ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50 shadow-[0_8px_24px_-12px_rgba(34,211,238,0.65)]"
                          : audience === "ug"
                            ? "border-amber-400/35 bg-white/8 text-amber-200 active:border-amber-300/60 active:bg-white/10 active:text-amber-100 sm:hover:-translate-y-0.5 sm:hover:border-amber-300/60 sm:hover:bg-white/10 sm:hover:text-amber-100"
                            : "border-violet-400/35 bg-white/8 text-violet-200 active:border-violet-300/60 active:bg-white/10 active:text-violet-100 sm:hover:-translate-y-0.5 sm:hover:border-violet-300/60 sm:hover:bg-white/10 sm:hover:text-violet-100",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 text-xs text-slate-400 mt-1 sm:justify-start">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 sm:h-2 sm:w-2" />
              Undergrad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400/80 sm:h-2 sm:w-2" />
              Postgrad
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-sm font-medium text-slate-200">
              Search rankings
            </span>
            <input
              type="search"
              placeholder="Search by university name"
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-white/25 focus:ring-2 focus:ring-white/10"
            />
          </label>
          <label className="flex flex-col gap-2 sm:w-52">
            <span className="text-sm font-medium text-slate-200">Country</span>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-zinc-900 pl-4 pr-10 py-3 text-slate-100 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </label>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading rankings…
            </p>
          ) : (
            <>
              {processed.slice(0, visibleCount).map((ranking) => (
                <RankingCard
                  key={ranking["Institution Name"] as string}
                  ranking={ranking["AGG RANK"] as number}
                  uniName={ranking["Institution Name"] as string}
                  uniTerritory={
                    (ranking["Country"] as Record<string, string>)["Territory"]
                  }
                  arScore={(ranking["AR SCORE"] as number) ?? 0}
                  erScore={(ranking["ER SCORE"] as number) ?? 0}
                  fsrScore={(ranking["FSR SCORE"] as number) ?? 0}
                  cpfScore={(ranking["CPF SCORE"] as number) ?? 0}
                  ifrScore={(ranking["IFR SCORE"] as number) ?? 0}
                  isrScore={(ranking["ISR SCORE"] as number) ?? 0}
                  isdScore={(ranking["ISD SCORE"] as number) ?? 0}
                  irnScore={(ranking["IRN SCORE"] as number) ?? 0}
                  eoScore={(ranking["EO SCORE"] as number) ?? 0}
                  susScore={(ranking["SUS SCORE"] as number) ?? 0}
                  length={factors.length}
                  aggScore={
                    Number(
                      factors.length
                        ? ranking["AGG SCORE"]
                        : ranking["Overall SCORE"],
                    ) || 0
                  }
                />
              ))}
              {visibleCount < processed.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Load more ({processed.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default App;
