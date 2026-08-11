# Project Log

A running record of work done on the Client Tracker application — features added, bugs fixed, and deployments made. Entries are in reverse-chronological order (newest first). For architecture reference, see `CLAUDE.md`.

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
