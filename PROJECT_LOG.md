# Project Log

A running record of work done on the Client Tracker application — features added, bugs fixed, and deployments made. Entries are in reverse-chronological order (newest first). For architecture reference, see `CLAUDE.md`.

---

## 2026-08-13 — Group members, partner shares, and an income-focused dashboard

**What:** A client can now hold the whole group (3–4 students, each with a name and optional contact) instead of one name. Added a referring partner per client who takes a percentage of the **system** price, and reworked every money figure around what's actually *yours*: a "Your income" breakdown on each client, a "Yours" line on the card, and a six-tile dashboard split into income and outstanding money by System vs Thesis-Docu.

**Why:** Thesis clients are groups, not individuals. And when a partner refers a client they take 25% of the system price — so a ₱20,000 system is really ₱15,000 to you. Every number in the app was gross, which meant none of them answered "how much do I actually earn from this?"

**Files (key):**
- `prisma/schema.prisma` — new `ClientMember` model; `Client` gains `partnerName` + `partnerSharePercent` and loses `name`.
- `prisma/migrations/20260813231500_client_members_and_partner_share/migration.sql` — hand-written; any client whose `name` was filled in becomes that group's first member before the column is dropped.
- `lib/money.ts` — `partnerCut`, `myIncomeSystem` / `myIncomeDocu` / `myIncome`, `paidToward`, `owedFor`, `myCollected`.
- `lib/validation.ts` — `optionalPercent` and `parseMembers` (drops wholly blank rows, rejects a contact with no name).
- `app/api/clients/**` — members created nested on POST and replaced wholesale inside a `$transaction` on PATCH; clearing the partner zeroes their share.
- `features/clients/components/ClientFormFields.tsx` — `useFieldArray` members section, plus a partner section that shows the peso split live as you type.
- `features/clients/components/MoneySummary.tsx` — rebuilt as six tiles; the old single "Still owed" tile is gone.
- `features/payments/components/PaymentsPanel.tsx` — "Your income" breakdown above the existing totals.

**Details:**
- The partner's cut applies to the **system price only** — docu work is always kept in full.
- Your share is derived by *subtracting* the partner's cut from the price, so the two always add back exactly; no peso is ever lost to rounding.
- Payments aren't earmarked, so they're split between system and docu **in proportion to the two prices**. System is computed by ratio and docu takes the remainder, which guarantees "owed for system" + "owed for docu" always equals the client's real balance.
- Income tiles are net of the partner; "still owed" tiles are gross (what clients hand over). The labels say which is which.
- A client with no price set still shows no payment badge, unchanged from before.

**Verified:** migration applied to a throwaway Postgres seeded with a named / a null / a whitespace-only client — only the real name became a member row, tasks and payments survived, no schema drift. 24 direct assertions over `lib/money.ts` including the ₱20,000 → ₱15,000/₱5,000 example, a rounding sweep proving cut + share always equals the price, and 183 payment amounts with zero split drift. API walkthrough: 4 members created (blank row dropped), edited down to 2 with no orphans, blank-name and 101% rejected with readable messages, cross-user PATCH still 404, cascade delete clears members. `npm run build` and `npm run lint` clean.

**Deployed:** Not yet — needs `npx prisma migrate deploy` against Neon before the code is pushed.

---

## 2026-08-13 — Client details, money tracking, and agreement uploads

**What:** Turned a client from "a name, a note and one due date" into a full job record: separate project title and client name, school, course, project type (System / Thesis-Docu / Both), a price per deliverable, separate System and Docu deadlines, a payment history with computed balance, and an uploaded copy of the signed agreement. Added a money summary across the top of the dashboard and a Paid / Partial / Unpaid badge per client.

**Why:** The project title was being crammed into the client-name field, and everything needed to actually run the business — what the job is worth, what's been collected, what's still owed, which school the student is from, what's due next — either lived in freeform notes or nowhere at all.

**Files (key):**
- `prisma/schema.prisma` — new `PROJECT_TYPE` enum; `Client` gains `title`, `school`, `course`, `projectType`, `systemPrice`, `docuPrice`, `systemDueDate`, `docuDueDate` (and `name` becomes optional, `dueDate` is dropped); new `Payment` and `ClientDocument` models cascading from `Client`.
- `prisma/migrations/20260813215500_client_details_payments_documents/migration.sql` — hand-written so the backfill isn't lost: old `name` moves to `title`, the old `dueDate` is copied onto **both** new deadline fields, and existing rows are marked `BOTH`.
- `lib/money.ts` — whole-peso formatting plus `totalPrice` / `totalPaid` / `balance` / `paymentStatus` / `paidProgress`; only prices matching the project type count.
- `lib/project-type.ts` — labels, chip styles, options, and `hasSystem` / `hasDocu`.
- `lib/status.ts` — added `clientDeadlines` and `nextDeadline`; existing `isOverdue` reused unchanged.
- `lib/validation.ts` — shared server-side body parsers (`requiredText`, `optionalPeso`, `enumValue`, …) and `respondToError`, replacing the ad-hoc checks that were duplicated per route.
- `lib/blob.ts` — Vercel Blob wrapper: private-first upload with a public fallback, size/type limits, best-effort delete.
- `lib/client-include.ts` — the shared `include` so tasks, payments and documents always ship with a client; deliberately withholds each document's blob URL.
- `app/api/payments/**`, `app/api/documents/**` — new REST routes following the existing task-route shape, including `GET /api/documents/[id]/view`, the only path by which a file reaches the browser.
- `features/payments/`, `features/documents/` — new feature slices mirroring `features/tasks/`.
- `features/clients/components/ClientFormFields.tsx` — the client form extracted so the add and edit modals can't drift; price and deadline fields follow the selected project type.
- `components/ui/Badge.tsx` (new, `Chip` now builds on it), `components/ui/Modal.tsx` (`size` prop + scrolling body).

**Details:**
- Money is whole pesos as `Int` everywhere — no centavos, so totals are exact and never need rounding.
- Switching a client from Both to Docu-only hides and stops counting the system price but doesn't erase it; switching back brings it right back.
- A client with no price set gets no payment badge at all, rather than a misleading "Unpaid".
- Agreements upload as **private** blobs where the plan allows it, falling back to public-with-random-suffix otherwise. Either way the raw blob URL never reaches the browser — `/api/documents/[id]/view` checks the session first, then streams or redirects.
- Uploads are capped at 4 MB (Vercel's serverless body ceiling is 4.5 MB) and limited to PDF/JPG/PNG/WebP, checked in the browser and again on the server.
- Deleting a client now removes its blobs before the rows cascade, so no orphaned files are left in the store.

**Verified:** migration applied to a throwaway Postgres seeded to look like production (titles preserved, dates copied to both deadline fields, tasks intact, no schema drift); full API walkthrough against that scratch database covering create/update, payments, validation rejections, cross-user access (all 404), unauthenticated access (all 401), and cascade delete; `lib/money.ts` exercised directly with 18 assertions; `npm run build` and `npm run lint` clean. The blob upload path itself is untested — it needs a real `BLOB_READ_WRITE_TOKEN`.

**Deployed:** Not yet — needs `npx prisma migrate deploy` against Neon **before** the code is pushed.

---

## 2026-08-11 — Task filtering and pagination

**What:** Added client-side filtering and pagination to the task checklist displayed on a client's detail page. Tasks can now be filtered by status (Pending / In Progress / Revisions / Done / All), and task lists are paginated at 10 items per page with Previous/Next navigation buttons.

**Why:** As clients accumulate tasks over time, a single flat list becomes hard to scan and manage. Filtering by status lets users focus on one work stream at a time, and pagination keeps the page responsive and uncluttered.

**Files:**
- `features/tasks/components/TaskList.tsx` — added `statusFilter` and `page` state, integrated `StatusFilterBar` (reused from dashboard), derived `filteredTasks` and `pagedTasks`, render `Pagination` component when needed.
- `components/ui/Pagination.tsx` — new reusable primitive (Previous/Next buttons, page counter, disabled states at boundaries).

**Details:**
- Both operations happen client-side; all tasks are fetched in one API call (no new endpoints).
- Page resets to 1 when the user changes the status filter (avoids landing on blank pages).
- Empty state messaging distinguishes "No tasks yet" (empty checklist) from "No tasks with this status" (filter resulted in nothing).
- Pagination controls only render when there are more than 10 filtered tasks.

**Deployed:** Yes — pushed to GitHub; Vercel auto-deployed the new version.

---

## 2026-08-11 — Initial build: scaffolding, auth, CRUD, and deployment

**What:** Bootstrapped a full-stack web application (Next.js 16 + Prisma 7 + PostgreSQL on Neon) with email/password authentication, multi-user data isolation, and a complete task-tracking UI. Deployed to Vercel with a Neon serverless database backend.

**Why:** Foundation for a client project management system that multiple team members can use to track work across different clients and tasks, organized by status (Pending / In Progress / Revisions / Done).

**Architecture:**
- **Frontend:** Next.js 16 App Router (route groups for auth vs. authenticated flows) with TanStack Query v5 for data fetching and caching.
- **Backend:** RESTful API routes with JWT session cookies (hand-rolled auth using `jose` + `bcryptjs`). Per-request session validation via `proxy.ts` middleware and per-route checks.
- **Database:** Prisma 7 with PostgreSQL driver adapter (`@prisma/adapter-pg`); Neon serverless pooled connections. Schema: `User -> Client (1:many) -> Task (1:many)`, all scoped by `userId`.
- **UI:** Tailwind CSS v4 (CSS-first, no config file) with hand-rolled component primitives (Button, Modal, Input, etc.). Feature-sliced architecture under `features/<feature>/`.
- **Deployment:** Vercel (frontend) + Neon (database), auto-deploying on git push to `main`.

**Files (key):**
- `app/(auth)/` — login and register pages (unauthenticated).
- `app/(main)/` — dashboard and client detail pages (authenticated).
- `app/api/` — auth and CRUD endpoints.
- `lib/auth/` — JWT signing, session validation, password hashing.
- `lib/status.ts` — centralized `WORK_STATUS` enum and display helpers.
- `prisma/schema.prisma` — data model.
- `features/` — auth, clients, and tasks feature modules.
- `components/ui/` — generic UI primitives.

**Features:**
- User registration and login with email/password.
- Add, edit, and delete clients; mark them as Pending / In Progress / Revisions / Done.
- Within each client: add, edit, delete, and reorder tasks; change task status.
- Dashboard showing all clients with a status filter.
- Client detail page showing tasks for a single client.
- Full CRUD operations on both clients and tasks.

**Deployed:** Yes — live at Vercel URL, connected to Neon database.
