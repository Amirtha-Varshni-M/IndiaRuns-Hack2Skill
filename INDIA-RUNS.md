# India.RUNS — Adversarial Candidate Ranking System (ACRS)

AI-powered hiring intelligence platform that stress-tests candidate rankings using adversarial perturbations to detect manipulation and surface only the most defensible hiring decisions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (Tailwind CSS, dark navy + amber theme, recharts, wouter)
- API: Express 5 (port 8080, routed at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/acrs-frontend/` — React + Vite frontend, served at `/`
- `artifacts/api-server/src/routes/` — Express route handlers (auth, jobs, candidates, ranking, adversary, analytics)
- `artifacts/api-server/src/lib/auth.ts` — HMAC token auth system
- `artifacts/api-server/src/routes/ranking.ts` — Adversarial ranking engine (cosine similarity + stress tests)
- `lib/db/src/schema/` — Drizzle ORM schemas (users, jobs, candidates, ranking_jobs, ranking_results, adversary_config)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas

## Architecture decisions

- **Auth**: Custom HMAC token system. Tokens stored in `localStorage` under `acrs_token`. 7-day expiry. `setAuthTokenGetter` from `@workspace/api-client-react` wires this into all API calls.
- **Ranking engine**: Purely algorithmic — cosine similarity via bag-of-words TF for fit scoring, simulated adversarial perturbations per configured stress test types. No external AI dependency.
- **Adversarial tests**: Per-ranking, each candidate is run through N perturbation variants (skill_swap, keyword_stuffing, experience_fluff, etc.). Rank shifts are recorded; robustness = inverse of max shift / total candidates.
- **Red flag detection**: Keyword stuffing (term frequency > threshold), prompt injection pattern matching, experience claim validation.
- **Frontend routing**: Wouter at base path `/` (read from `import.meta.env.BASE_URL`).

## Product

- **Dashboard**: One-shot ranking flow — paste JD + candidate resumes, start adversarial analysis, auto-navigate to results
- **Ranking Results**: Leaderboard with final score, fit, robustness, risk badge, explainability modal per candidate (5 tabs: profile, match, adversarial tests, red flags, verdict), CSV export, scatter + distribution charts
- **Candidates**: CRUD for candidate profiles with skill tags, experience, education
- **Jobs**: CRUD for job descriptions with skills, experience requirements
- **Admin**: Adversary engine configuration — number of variants, intensity, enable/disable individual perturbation types
- **Analytics**: Trend charts, manipulation detection breakdown, recommendation distribution

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new routes to `api-server`, rebuild is needed — restart the workflow to pick them up
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after OpenAPI spec changes
- Drizzle `push` changes schema in place (no migrations in dev); use `pnpm --filter @workspace/db run push`
- Demo user: `demo@acrs.io` / `demo1234` — seeded via `POST /api/auth/register` or re-seed by calling the endpoint

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
