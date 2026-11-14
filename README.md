# CP Tracker

A personal **Competitive Programming Tracker** dashboard that follows your
problem-solving progress across competitive programming platforms. The MVP
integrates **Codeforces** (default handle: `zukozuno7`) using the official
Codeforces REST API — all statistics are computed from real submission data,
never mocked.

The visual design follows the Apple style reference in [`DESIGN.md`](./DESIGN.md):
white gallery canvas, `#f5f5f7` feature bands, 28px-radius hairline cards,
SF Pro–style typography, and a single blue accent reserved for links and
compact controls.

## Features

- **Profile** — handle, avatar, current/max rating, current/max rank, member
  since, and a link to the upstream profile.
- **Rating progression** — rated-contest history chart (from
  `user.rating`).
- **Overview statistics** — unique problems solved, total submissions, unique
  problems attempted, acceptance rate, and problems first-solved this
  month / this year.
- **Solved by difficulty** — interactive bar chart of unique solved problems
  grouped by rating; unrated problems are reported separately.
- **Activity heatmap** — GitHub-style 365-day heatmap of unique problems
  first solved each day, with hover tooltips and intensity levels.
- **Problem solving progress** — cumulative unique-solved curve with 7 days /
  30 days / 90 days / 1 year / all time filters (historical totals are
  preserved as the baseline).
- **Solved problems table** — searchable and filterable list of every unique
  problem: name, rating, tags, contest ID, first-solve date, and a direct
  link. Supports search, rating/tag filters, sorting, and pagination.
- **Manual refresh** — a header control that invalidates the cache and
  refetches from Codeforces.
- **Freshness & resilience** — the header always shows how old the data is;
  if Codeforces is unreachable, the dashboard keeps working from the last
  good snapshot and explicitly flags it as cached.

### Counting rules

- Only submissions with `verdict === "OK"` count as solved.
- Each problem is counted once — identified by a stable key
  (`contestId + index`, with safe fallbacks for incomplete metadata).
- Acceptance rate = accepted submissions ÷ total submissions × 100.
- Attempted = unique problems with at least one submission (any verdict).
- Monthly/yearly counts use the date of the **first** accepted submission.
- All day bucketing uses the **Asia/Jakarta** timezone (`DISPLAY_TIMEZONE`
  in `src/lib/config.ts`).

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Cache Components / PPR)
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style components (Radix primitives)
- [Recharts](https://recharts.org) for charts
- [Lucide React](https://lucide.dev) icons
- Vitest for unit tests

No database and no authentication — the MVP is a personal read-only
dashboard.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure environment — see .env.example
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

### Tests

```bash
npm test          # run once (vitest)
npm run test:watch
```

Tests cover unique-problem counting, first-acceptance dates, acceptance
rate, timezone-safe day bucketing, and the rating distribution.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CODEFORCES_HANDLE` | `zukozuno7` | Default Codeforces handle to track |
| `CODEFORCES_CACHE_TTL_SECONDS` | `600` | How long a fetched dashboard payload is served from cache |
| `CODEFORCES_API_TIMEOUT_MS` | `15000` | Timeout per upstream API request |

Copy `.env.example` to `.env.local` to override any of them.

## Architecture

```text
src/
├── app/
│   ├── page.tsx                  # Suspense shell + streaming dashboard
│   ├── layout.tsx                # Root layout & metadata
│   ├── globals.css               # Apple design tokens (Tailwind v4 @theme)
│   ├── actions.ts                # "Refresh" server action (cache invalidation)
│   ├── error.tsx                 # Route-level error boundary
│   └── api/codeforces/route.ts   # Read-only JSON endpoint of the payload
├── components/
│   ├── dashboard/                # Profile, stats, skeleton, error, freshness
│   ├── charts/                   # Rating bars, cumulative area, heatmap, trend
│   ├── problems/                 # Solved problems table
│   ├── layout/                   # Header / footer / refresh button
│   └── ui/                       # shadcn-style primitives (button, card, …)
├── lib/
│   ├── config.ts                 # Centralized handles, timezone, cache TTL
│   ├── dashboard.ts              # Payload assembly + TTL cache
│   ├── statistics.ts             # Aggregations & timezone-safe day math
│   ├── utils.ts                  # cn(), formatting helpers
│   └── codeforces/
│       ├── api.ts                # Transport: timeouts, retries, pacing,
│       │                         #   pagination, snapshot cache, stale fallback
│       ├── parser.ts             # Normalization: dedup, identity, URLs
│       └── types.ts              # Codeforces API response types
└── types/
    └── platform.ts               # Platform-agnostic domain types
```

### Layering

1. **Transport** (`lib/codeforces/api.ts`) — server-only. Handles request
   pacing (~1 req / 600 ms), timeouts with retries, envelope validation, and
   paginated retrieval of the complete submission history. Keeps a
   process-level snapshot of the last good payload for outage fallback.
2. **Normalization** (`lib/codeforces/parser.ts`) — converts raw API data
   into platform-agnostic domain types and deduplicates problems.
3. **Aggregation** (`lib/statistics.ts`) — all counting/bucketing math,
   timezone-safe. Pure functions, unit tested.
4. **Assembly** (`lib/dashboard.ts`) — builds the `DashboardData` payload
   behind a TTL cache, and is the single entry point for the page and the
   JSON route handler.
5. **Presentation** (`components/`) — generic, platform-agnostic components
   that consume only the domain types from `types/platform.ts`.

### Extensibility

Adding another platform (AtCoder, LeetCode, VJudge) means adding a
`lib/<platform>/` module that produces the same domain types
(`PlatformIdentity`, `SolvedProblem`, `DashboardData`, …). No dashboard
component needs to change; the platform id, handles and endpoints are wired
through `lib/config.ts`.

## Performance & reliability notes

- The dashboard renders inside a `<Suspense>` boundary: the static shell
  (header, footer, skeletons) is prerendered; data streams in at request
  time.
- Submission aggregation runs once per fetch on the server; the client only
  filters/sorts/paginates the already-deduplicated solved list.
- Charts disable entry animations (per the design brief) and use fixed
  heights so large datasets stay responsive.
- Upstream failures degrade to cached data with an explicit staleness flag —
  missing data is never silently rendered as zero.

## Deployment

The app is a standard Next.js 16 App Router project and deploys to Vercel
without extra configuration (`vercel deploy` or Git integration). The
Codeforces API is called server-side only, so no CORS concerns apply.
