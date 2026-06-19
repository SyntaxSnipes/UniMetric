# UniMetric

A web app for exploring and re-ranking the **QS World University Rankings 2026** by the factors that actually matter to you.

## What it does

UniMetric lets you pick any combination of QS ranking factors — academic reputation, research output, international diversity, and more — and instantly reranks all 1,501 universities based on your chosen weights. Filter by country or search by name to find exactly what you're looking for.

**10 QS factors across 4 categories:**

| Category | Factors |
|---|---|
| Reputation | Academic Reputation, Employer Reputation |
| Teaching & Outcomes | Faculty/Student Ratio, Employment Outcomes, Sustainability |
| Research | Citations per Faculty, International Research Network |
| International | International Faculty Ratio, International Student Ratio, International Student Diversity |

Factors are colour-coded by relevance: **amber** for undergraduate, **violet** for postgraduate.

## Stack

- React 19 + TypeScript
- Vite 8 with React Compiler enabled
- Tailwind CSS v4
- React Router v7

## Getting started

```bash
cd unimetric
npm install
npm run dev
```

Other commands:

```bash
npm run build    # type-check + production build
npm run preview  # serve the production build locally
npm run lint     # ESLint
```

## Data

University data is loaded from `/public/26QS.json` at runtime. Each record contains the institution name, country/territory, and raw scores for all 10 QS factors. When no factors are selected, the official QS overall score is shown.
