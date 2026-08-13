@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Log

When the user asks to update the project log / summarize what we built / record today's work, append a new dated entry to `PROJECT_LOG.md` summarizing the session. Do this **only when asked or after a clearly-completed chunk of work** — not unprompted after every small change. Each entry is a reverse-chronological bullet summary of what changed and why, with key files mentioned.

## Commands

```bash
npm run dev      # start dev server (also re-syncs the AGENTS.md/CLAUDE.md agent-rules block)
npm run build    # production build
npm run start    # run production build
npm run lint      # eslint (flat config: eslint-config-next core-web-vitals + typescript)
```

There is no test suite/framework configured in this repo.

`prisma generate` runs automatically via the `postinstall` script — re-run manually (`npx prisma generate`) after editing `prisma/schema.prisma` without reinstalling. Common Prisma commands (schema at `prisma/schema.prisma`, migrations in `prisma/migrations`, config in `prisma.config.ts`, not `next.config.ts`):

```bash
npx prisma migrate dev   # create + apply a migration from schema changes
npx prisma studio        # browse data
```

Required env vars (`.env`, not committed): `DATABASE_URL` (Postgres connection string, consumed via the `@prisma/adapter-pg` driver adapter) and `SESSION_SECRET` (HMAC key for signing session JWTs — `lib/auth/jwt.ts` throws at request time if unset). Optional: `BLOB_READ_WRITE_TOKEN` for Vercel Blob — without it, agreement uploads return a 503 explaining the setup rather than crashing.

**`.env` points at the live Neon database.** Never run `prisma migrate dev`/`reset` against it. Write the migration SQL by hand, verify it on a throwaway Postgres (`docker run --rm -e POSTGRES_PASSWORD=… postgres:16-alpine`) seeded to look like production, and let the user apply it with `npx prisma migrate deploy` — before the matching code is pushed, since Vercel builds don't run migrations. Note the `datasource db` block in `prisma/schema.prisma` deliberately has **no `url`** — the CLI gets it from `prisma.config.ts` (which does its own `dotenv/config` load), and the app gets it from `process.env.DATABASE_URL` in `lib/prisma.ts`. Don't "fix" the schema by adding `url` back.

Hosting is Vercel (app) + Neon (Postgres), auto-deploying on push to `main`. `PROJECT_LOG.md` is the running history of what was built and why — read it for background on past sessions.

## Architecture

This is a Next.js 16 App Router app — note the `@AGENTS.md` warning above: some APIs differ from familiar Next.js conventions (e.g. `middleware.ts` is now `proxy.ts`; route params and page `params` are `Promise`s that must be `await`ed). Check `node_modules/next/dist/docs/` before assuming behavior from training data.

**Route groups.** `app/(auth)/` holds `/login` and `/register` (centered, unauthenticated layout); `app/(main)/` holds `/dashboard` and `/clients/[clientId]` (authenticated layout with `AppHeader`). `app/page.tsx` has no UI — it just redirects to `/dashboard` or `/login` based on session presence.

**Rendering model: client-side data fetching, not RSC.** Despite being App Router, no page reads the database during render. Prisma is imported *only* inside `app/api/**/route.ts`, and `app/page.tsx` is the only page that calls `getSession()` directly. Everything else is a `"use client"` component fetching through the API routes with TanStack Query. Server pages exist only to `await params` and hand the value to a client view (`app/(main)/clients/[clientId]/page.tsx` → `ClientDetailView`). Keep new UI on this path rather than mixing in server-component data loading — the query cache and its invalidation depend on all reads going through the same hooks.

**Auth is hand-rolled, not a library.** JWT session cookies signed with `jose`, not NextAuth/Clerk/etc.
- `lib/auth/config.ts` — cookie name (`client_tracker_session`), max-age (7 days), JWT alg.
- `lib/auth/jwt.ts` — signs/verifies the session JWT with `SESSION_SECRET`.
- `lib/auth/session.ts` — `getSession()`/`requireSession()`, server-only, reads the cookie via `next/headers`.
- `lib/auth/password.ts` — bcrypt hashing wrapper.
- Enforcement happens in **two independent places**: `proxy.ts` (the renamed middleware) does an optimistic redirect for protected/auth paths based on cookie + JWT validity alone, and every API route under `app/api/` independently calls `getSession()` and returns 401 if absent. Per Next.js's own docs, proxy is not a full authorization layer — don't remove the per-route checks even if proxy already covers the path.

**Data layer.** `lib/prisma.ts` builds `PrismaClient` with the `@prisma/adapter-pg` driver adapter (Prisma 7 style — no engine binary), memoized on `globalThis` to survive dev HMR. Schema (`prisma/schema.prisma`) is `User -> Client (1:many) -> Task | Payment | ClientDocument`, all scoped by `userId`; `Client` and `Task` share one `WORK_STATUS` enum (`PENDING | IN_PROGRESS | REVISIONS | DONE`), and `Client.projectType` uses `PROJECT_TYPE` (`SYSTEM | DOCU | BOTH`). Ownership is enforced in queries, not by DB-level row security: clients are filtered by `userId`; tasks, payments and documents are authorized via their parent client (`where: { id, client: { userId } }`).

`lib/client-include.ts` is the one `include` every client query uses, so a client always arrives with its members, tasks, payments and documents — the browser computes progress, balances, income and badges from that single response. It withholds each document's blob `url`/`pathname`.

**Money is whole pesos as `Int`** — DB column, API payload and form input alike. No centavos, no `Decimal`, no rounding. `lib/money.ts` owns every derived figure and only counts prices matching the client's `projectType`, so a Docu-only job ignores a stored `systemPrice` without erasing it. `lib/project-type.ts` mirrors `lib/status.ts` and exports the `hasSystem`/`hasDocu` predicates that gate prices, deadlines and form fields.

Two invariants in `lib/money.ts` that new code must not break:
- **The partner's cut applies to the system price only** (docu is never shared), and your share is derived by *subtracting* the cut — so `partnerCut + myIncomeSystem === systemPrice` exactly, with no peso lost to rounding.
- **Payments are split system/docu in proportion to the two prices**, since nothing earmarks them. `paidToward("system")` rounds and `"docu"` takes the remainder, which guarantees `owedFor("system") + owedFor("docu") === balance()`. Compute derived money through these helpers rather than re-deriving ratios at the call site.

Income figures (`myIncome*`, `myCollected`) are **net of the partner**; `owedFor`/`balance` are **gross** — what the client still hands over. Label any new UI accordingly; the dashboard tiles in `MoneySummary.tsx` do.

**`Client.title` is the project; `Client.members` is the group** (`ClientMember`, ordered by `position`, index 0 = main contact). Members are edited as part of the client form, not a separate slice: `POST /api/clients` creates them nested and `PATCH` **replaces the list wholesale** inside a `$transaction` — there are no `/api/members` routes. Deadlines are split into `systemDueDate`/`docuDueDate`; `clientDeadlines`/`nextDeadline` in `lib/status.ts` pick the applicable ones.

**Agreement files** go to Vercel Blob via `lib/blob.ts`, which tries `access: "private"` and falls back to `"public"` with a random suffix, recording which on the row. Either way the blob URL never reaches the browser — `GET /api/documents/[id]/view` checks the session, then streams (private) or redirects (public). Deleting a client removes its blobs before the rows cascade.

**API routes** (`app/api/**/route.ts`) are plain REST-ish handlers, no RPC framework. Every handler: wraps in try/catch, returns `{ message, data? }` JSON, calls `getSession()` itself, and — for dynamic segments — takes `ctx: { params: Promise<{ id: string }> }` per the Next 16 async-params convention. Follow this shape for new routes rather than introducing a different response envelope.

Validation is deliberately asymmetric: the `yup` schemas live in `features/*/schema/` and run **client-side only**. Server handlers validate independently — coerce the id and 404 on `!Number.isInteger`, ownership-check via `findFirst` before mutating, and on `PATCH` copy only the keys actually present in the body into a partial `data` object. Field parsing goes through `lib/validation.ts` (`requiredText`, `optionalText`, `optionalPeso`, `optionalDate`, `enumValue`, …), which throws `ValidationError`; every handler's catch block calls `respondToError(error)` to turn that into a 400 and anything else into a logged 500. `app/api/tasks/**` still uses the older inline style — follow `app/api/clients/**` for new routes. Adding a field to a yup schema does nothing until the matching route handler accepts it too.

**Frontend is feature-sliced** under `features/<feature>/` (currently `auth`, `clients`, `tasks`, `payments`, `documents`), each with the same internal shape:
- `services/*.api.ts` — `fetch` wrappers calling the API routes, throwing on non-OK responses (see `unwrap()` in `features/clients/services/clients.api.ts`).
- `hooks/*.ts` — TanStack Query v5 hooks (`useQuery`/`useMutation`), invalidating via the shared key registry.
- `schema/*.schema.ts` — `yup` schemas used with `react-hook-form` + `@hookform/resolvers`.
- `components/*.tsx` — feature UI.

`app/` pages stay thin — they compose feature hooks/components rather than holding logic themselves (see `app/(main)/dashboard/page.tsx`).

List UX (status filtering, pagination) is done **in the browser over an already-fetched full list**, not with new query params or endpoints — `features/tasks/components/TaskList.tsx` holds `statusFilter`/`page` in local state and slices client-side. The one exception is the dashboard's client list, where `status` is passed through to `GET /api/clients` and is therefore part of the query key (`queryKeys.clients.list(filters)`).

`lib/query/keys.ts` is the single source of truth for TanStack Query keys (`queryKeys.clients.*`, `queryKeys.tasks.*`). Extend this registry for new queries/mutations rather than inlining key arrays — invalidation across features depends on these shared prefixes. `lib/query/query-client.ts` + `providers/query-provider.tsx` implement the standard App Router split (fresh `QueryClient` per request on the server, one memoized client in the browser), wired in at `app/layout.tsx`.

**Query keys:** payments and documents have no query of their own — they're read inside the client query, so their hooks only invalidate `queryKeys.clients.detail(clientId)` and `queryKeys.clients.all`, exactly as `features/tasks/hooks/use-tasks.ts` does. Nothing to add to `lib/query/keys.ts` unless you introduce a genuinely separate `useQuery`.

`components/ui/*` are generic, feature-agnostic primitives (Button, Modal, Badge, Chip, inputs, etc.); `components/layout/AppHeader.tsx` is the authenticated shell chrome. `Badge` is the generic pill — `Chip` is the `WORK_STATUS`-specific wrapper around it. `lib/status.ts` centralizes `WORK_STATUS` display concerns (`STATUS_LABELS`, `STATUS_STYLES`, `STATUS_OPTIONS`, `isOverdue`), keyed to Tailwind color tokens defined in `app/globals.css`'s `@theme inline` block (`--status-*`, `--type-*`, `--pay-*` CSS vars) — adding a new status or project type requires updating the enum in `prisma/schema.prisma`, the matching `lib/` module, and the CSS tokens together.

**Styling** is Tailwind CSS v4 configured entirely in CSS (`@theme inline` in `app/globals.css`) — there is no `tailwind.config.*`. Path alias `@/*` resolves to the repo root (`tsconfig.json`).

**Prisma skills.** `.agents/skills/`, `.claude/skills/`, and `.windsurf/skills/` contain Prisma reference skills installed via `skills-lock.json` — treat them as vendored/managed, don't hand-edit.
