@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Required env vars (`.env`, not committed): `DATABASE_URL` (Postgres connection string, consumed via the `@prisma/adapter-pg` driver adapter) and `SESSION_SECRET` (HMAC key for signing session JWTs — `lib/auth/jwt.ts` throws at request time if unset).

## Architecture

This is a Next.js 16 App Router app — note the `@AGENTS.md` warning above: some APIs differ from familiar Next.js conventions (e.g. `middleware.ts` is now `proxy.ts`; route params and page `params` are `Promise`s that must be `await`ed). Check `node_modules/next/dist/docs/` before assuming behavior from training data.

**Route groups.** `app/(auth)/` holds `/login` and `/register` (centered, unauthenticated layout); `app/(main)/` holds `/dashboard` and `/clients/[clientId]` (authenticated layout with `AppHeader`). `app/page.tsx` has no UI — it just redirects to `/dashboard` or `/login` based on session presence.

**Auth is hand-rolled, not a library.** JWT session cookies signed with `jose`, not NextAuth/Clerk/etc.
- `lib/auth/config.ts` — cookie name (`client_tracker_session`), max-age (7 days), JWT alg.
- `lib/auth/jwt.ts` — signs/verifies the session JWT with `SESSION_SECRET`.
- `lib/auth/session.ts` — `getSession()`/`requireSession()`, server-only, reads the cookie via `next/headers`.
- `lib/auth/password.ts` — bcrypt hashing wrapper.
- Enforcement happens in **two independent places**: `proxy.ts` (the renamed middleware) does an optimistic redirect for protected/auth paths based on cookie + JWT validity alone, and every API route under `app/api/` independently calls `getSession()` and returns 401 if absent. Per Next.js's own docs, proxy is not a full authorization layer — don't remove the per-route checks even if proxy already covers the path.

**Data layer.** `lib/prisma.ts` builds `PrismaClient` with the `@prisma/adapter-pg` driver adapter (Prisma 7 style — no engine binary), memoized on `globalThis` to survive dev HMR. Schema (`prisma/schema.prisma`) is `User -> Client (1:many) -> Task (1:many)`, all scoped by `userId`; `Client` and `Task` share one `WORK_STATUS` enum (`PENDING | IN_PROGRESS | REVISIONS | DONE`). Ownership is enforced in queries, not by DB-level row security: clients are filtered by `userId`, tasks are authorized by first looking up their parent client with a matching `userId`.

**API routes** (`app/api/**/route.ts`) are plain REST-ish handlers, no RPC framework. Every handler: wraps in try/catch, returns `{ message, data? }` JSON, calls `getSession()` itself, and — for dynamic segments — takes `ctx: { params: Promise<{ id: string }> }` per the Next 16 async-params convention. Follow this shape for new routes rather than introducing a different response envelope.

**Frontend is feature-sliced** under `features/<feature>/` (currently `auth`, `clients`, `tasks`), each with the same internal shape:
- `services/*.api.ts` — `fetch` wrappers calling the API routes, throwing on non-OK responses (see `unwrap()` in `features/clients/services/clients.api.ts`).
- `hooks/*.ts` — TanStack Query v5 hooks (`useQuery`/`useMutation`), invalidating via the shared key registry.
- `schema/*.schema.ts` — `yup` schemas used with `react-hook-form` + `@hookform/resolvers`.
- `components/*.tsx` — feature UI.

`app/` pages stay thin — they compose feature hooks/components rather than holding logic themselves (see `app/(main)/dashboard/page.tsx`).

`lib/query/keys.ts` is the single source of truth for TanStack Query keys (`queryKeys.clients.*`, `queryKeys.tasks.*`). Extend this registry for new queries/mutations rather than inlining key arrays — invalidation across features depends on these shared prefixes. `lib/query/query-client.ts` + `providers/query-provider.tsx` implement the standard App Router split (fresh `QueryClient` per request on the server, one memoized client in the browser), wired in at `app/layout.tsx`.

`components/ui/*` are generic, feature-agnostic primitives (Button, Modal, Chip, inputs, etc.); `components/layout/AppHeader.tsx` is the authenticated shell chrome. `lib/status.ts` centralizes `WORK_STATUS` display concerns (`STATUS_LABELS`, `STATUS_STYLES`, `STATUS_OPTIONS`, `isOverdue`), keyed to Tailwind color tokens defined in `app/globals.css`'s `@theme inline` block (`--status-*-bg`/`-text` CSS vars) — adding a new status requires updating the enum in `prisma/schema.prisma`, `lib/status.ts`, and the CSS tokens together.

**Styling** is Tailwind CSS v4 configured entirely in CSS (`@theme inline` in `app/globals.css`) — there is no `tailwind.config.*`. Path alias `@/*` resolves to the repo root (`tsconfig.json`).

**Prisma skills.** `.agents/skills/`, `.claude/skills/`, and `.windsurf/skills/` contain Prisma reference skills installed via `skills-lock.json` — treat them as vendored/managed, don't hand-edit.
