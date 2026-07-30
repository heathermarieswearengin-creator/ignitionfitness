# Ignition Fitness — Booking Backend Build Spec

> **For:** Claude Code, run inside the `ignition-fitness` repo (Next.js 16 App Router).
> **Goal:** Replace the browser-only `localStorage` prototype with a real backend — Postgres (Neon) + Prisma, email/password auth, member accounts, packages with an audit log, an admin calendar, availability blocking, and `.ics` calendar invites — without throwing away the existing "forge" UI.
> **Build in the numbered phases.** Each phase is independently testable. Do not skip ahead; get each phase running before starting the next.

---

## 0. Locked decisions

| Area | Decision |
|---|---|
| Database | Vercel Postgres (Neon) + **Prisma** ORM |
| Auth | **Auth.js (NextAuth v5)**, Credentials provider, **email + password** (bcrypt). Members + one admin, separated by a `role` field. |
| Payments | **Offline now**, schema is Stripe-ready (`Booking.paymentStatus`) — do NOT build Stripe yet. |
| Calendar | **Resend** email with a `.ics` attachment + an **"Add to Google Calendar"** link. No Google OAuth. |
| Members | Real accounts. Members can **book multiple sessions** in one flow (a cart). |
| Framework | Keep Next.js App Router + the existing single-file UI's design tokens. Do not introduce Tailwind or a component library. |

---

## 1. Current state (what exists today)

- **`app/page.jsx`** (~950 lines, `"use client"`): the entire app — landing, booking wizard, admin dashboard — in one `App` component.
- **Persistence:** a `localStorage` shim called `storage` (top of the file, ~lines 7–15) with two keys:
  - `ignition-bookings` → array of `{ id, ref, name, email, phone, classType, date, time, status, createdAt }`
  - `ignition-leads` → array of `{ id, email, source, createdAt }`
- **Sessions are hard-coded constants**, not data: `CLASSES` (group vs `pt`) and `WEEKLY` (recurring template, all `group`).
- **Admin login is a hard-coded string** `"ignite"` compared client-side (and printed on screen). No real auth.
- **Booking flow is single-session only** ("Book Another" resets the wizard). Availability is computed from `WEEKLY` minus counted bookings.
- **Nothing is sent** on confirmation; no `.ics`, no email.
- **Missing entirely:** member accounts, packages, package audit log, weekly/monthly admin calendar, attendee lists, availability/date blocking, drop-in-vs-member distinction, color-by-session-type.

Design tokens already in the file (reuse these — do not restyle):
`--black #0c0807`, `--f900 #140d0b`, `--f800 #1d1411`, `--f700 #281a15`, `--line #3a261d`, `--ember #c9251c`, `--flame #e02d24`, `--gold #f0ab33`, `--ash #b0a193`, `--bone #f3ece1`, `--steel #6f8a99`. Fonts: Anton (display), Archivo (body), Spline Sans Mono (mono).

**Color-by-type convention to introduce:** GROUP = ember/flame red; PT = **steel `#6f8a99`** (blue-grey) as the base, with fill level driving badge intensity. This keeps the two session types visually distinct on the calendar.

---

## 2. Dependencies to install

```bash
npm install @prisma/client @auth/prisma-adapter next-auth@beta bcryptjs zod date-fns resend
npm install -D prisma
```

Notes:
- **`next-auth@beta`** is Auth.js v5 (App Router native). If it conflicts with Next 16, fall back to a minimal custom auth: bcrypt + a signed JWT (`jose`) in an httpOnly cookie. The route contracts below don't change either way.
- `bcryptjs` (pure JS) avoids native-build issues on Vercel vs. `bcrypt`.
- `date-fns` for week/month grid math. `zod` for request validation.

---

## 3. Environment variables

After provisioning the DB (Phase 0), your `.env.local` should have:

```bash
# Database (from the Neon/Vercel integration — names may vary; map them like this)
DATABASE_URL="<pooled connection string>"          # app runtime (pgbouncer/pooled)
DIRECT_URL="<non-pooling connection string>"        # prisma migrate needs a direct connection

# Auth
AUTH_SECRET="<run: npx auth secret>"                # 32+ random bytes
AUTH_TRUST_HOST="true"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="Ignition Fitness <bookings@ignitionfitness.com>"

# App
NEXT_PUBLIC_SITE_URL="https://www.ignitionfitness.com"

# Admin bootstrap (used only by the seed script)
ADMIN_EMAIL="mike@ignitionfitness.com"
ADMIN_PASSWORD="<choose a strong password>"
```

> The Vercel Neon integration typically injects vars like `POSTGRES_PRISMA_URL` (pooled) and `POSTGRES_URL_NON_POOLING`. Map `DATABASE_URL = POSTGRES_PRISMA_URL` and `DIRECT_URL = POSTGRES_URL_NON_POOLING`. Run `vercel env pull .env.local` after connecting the DB to fetch them, then add the non-DB vars above manually.
> Add every one of these to the Vercel project (Production + Preview) before `vercel --prod`.

---

## 4. Prisma schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role          { MEMBER ADMIN }
enum SessionType   { GROUP PT }
enum SessionStatus { SCHEDULED CANCELLED }
enum BookingStatus { CONFIRMED CHECKED_IN PENDING CANCELLED }
enum PaymentStatus { UNPAID PAID PACKAGE COMP }   // PACKAGE = covered by a credit

model User {
  id           String          @id @default(cuid())
  email        String          @unique
  passwordHash String
  name         String
  phone        String?
  role         Role            @default(MEMBER)
  createdAt    DateTime        @default(now())
  bookings     Booking[]
  packages     MemberPackage[]
  adminLogs    PackageLog[]    @relation("AdminLogs")
}

// Recurring schedule config -> used to generate ClassSession rows
model WeeklyTemplate {
  id          String      @id @default(cuid())
  dayOfWeek   Int         // 0=Sun … 6=Sat
  startTime   String      // "06:00" (24h)
  type        SessionType @default(GROUP)
  capacity    Int         @default(10)
  durationMin Int         @default(60)
  active      Boolean     @default(true)
}

// A concrete, dated, bookable slot. This is the canonical unit the calendar queries.
model ClassSession {
  id          String        @id @default(cuid())
  date        DateTime      @db.Date
  startTime   String        // "06:00"
  type        SessionType
  capacity    Int
  durationMin Int           @default(60)
  status      SessionStatus @default(SCHEDULED)
  notes       String?
  createdAt   DateTime      @default(now())
  bookings    Booking[]
  @@unique([date, startTime, type])
  @@index([date])
}

model Booking {
  id              String         @id @default(cuid())
  ref             String         @unique      // "IGN-XXXXX"
  session         ClassSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId       String
  user            User?          @relation(fields: [userId], references: [id])
  userId          String?        // null for guest/drop-in
  name            String         // snapshot (works for guests + members)
  email           String
  phone           String?
  isDropIn        Boolean        @default(false)
  status          BookingStatus  @default(CONFIRMED)
  paymentStatus   PaymentStatus  @default(UNPAID)
  memberPackage   MemberPackage? @relation(fields: [memberPackageId], references: [id])
  memberPackageId String?
  createdAt       DateTime       @default(now())
  @@index([sessionId])
  @@index([userId])
}

// Package definition (catalog)
model Package {
  id             String          @id @default(cuid())
  name           String          // "8 Group Sessions"
  type           SessionType
  totalCredits   Int
  price          Int             // whole dollars
  active         Boolean         @default(true)
  createdAt      DateTime        @default(now())
  memberPackages MemberPackage[]
}

// A package assigned to a member, tracking remaining credits
model MemberPackage {
  id               String       @id @default(cuid())
  user             User         @relation(fields: [userId], references: [id])
  userId           String
  type             SessionType
  creditsRemaining Int
  source           Package?     @relation(fields: [packageId], references: [id])
  packageId        String?
  active           Boolean      @default(true)
  createdAt        DateTime     @default(now())
  logs             PackageLog[]
  bookings         Booking[]
  @@index([userId])
}

// Append-only audit log: every credit change (assign, manual add/remove, booking, refund)
model PackageLog {
  id              String        @id @default(cuid())
  memberPackage   MemberPackage @relation(fields: [memberPackageId], references: [id], onDelete: Cascade)
  memberPackageId String
  delta           Int           // +N added, -N removed/consumed
  reason          String        // "assigned" | "manual-add" | "manual-remove" | "booking" | "cancel-refund"
  note            String?
  admin           User?         @relation("AdminLogs", fields: [adminId], references: [id])
  adminId         String?
  createdAt       DateTime      @default(now())
  @@index([memberPackageId])
}

model Lead {
  id        String   @id @default(cuid())
  name      String?
  email     String
  phone     String?
  source    String   @default("web")     // "kb-basics" | "dropin" | "web"
  status    String   @default("new")      // "new" | "contacted" | "converted" | "dead"
  notes     String?
  createdAt DateTime @default(now())
  @@index([email])
}

model AvailabilityBlock {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  allDay    Boolean  @default(true)
  startTime String?  // "06:00" when partial
  endTime   String?  // "12:00" when partial
  reason    String?
  createdAt DateTime @default(now())
  @@index([date])
}
```

**Credit accounting rule (enforce in code, always inside a transaction):** any change to `MemberPackage.creditsRemaining` MUST write a matching `PackageLog` row in the same `prisma.$transaction`. Never mutate credits without a log entry — that log is the bookkeeping the coach asked for.

---

## 5. How this replaces the localStorage prototype

| Today (localStorage) | Becomes |
|---|---|
| `storage.get/set("ignition-bookings")` | `GET/POST/PATCH /api/bookings` |
| `storage.get/set("ignition-leads")` | `GET/POST /api/leads` |
| `persist()` rewriting whole array | per-record API calls |
| client IDs via `Date.now()` | DB-generated `cuid()` |
| `CLASSES` / `WEEKLY` constants | `WeeklyTemplate` + `ClassSession` tables |
| admin gate `pass === "ignite"` | Auth.js session with `role: ADMIN` |
| single-session wizard | multi-session cart → one `POST /api/bookings` with an array |

Add `lib/prisma.js` (singleton to avoid exhausting connections in dev):

```js
import { PrismaClient } from "@prisma/client";
const g = globalThis;
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

---

## 6. API route contracts (App Router route handlers)

All under `app/api/…/route.js`. Validate bodies with `zod`. Return JSON. Admin routes must check `session.user.role === "ADMIN"` and 403 otherwise.

**Auth**
- `POST /api/register` — `{ name, email, password, phone? }` → creates MEMBER (bcrypt hash), returns safe user. Reject duplicate email.
- `app/api/auth/[...nextauth]/route.js` — Auth.js handler (Credentials). JWT session strategy (required with Credentials); put `role` and `id` in the token/session.

**Availability & schedule**
- `GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` — public. Returns bookable slots in range: merges `ClassSession` rows (auto-generating missing ones from `WeeklyTemplate` for the range), subtracts `AvailabilityBlock`s, and includes `booked` count + `spotsLeft` per slot. Shape per slot: `{ sessionId, date, startTime, type, capacity, booked, spotsLeft, status }`.
- `GET /api/admin/sessions?from=&to=` — admin. Same as above **plus** `attendees: [{ bookingId, name, email, phone, status, isDropIn }]` per session.

**Bookings**
- `POST /api/bookings` — body `{ items: [{ sessionId }], contact?: { name, email, phone }, isDropIn? }`. If authenticated member, link `userId` and use their profile; if a member package of the matching `type` has credits, decrement one credit **per booked session** (transaction + `PackageLog reason:"booking"`) and set `paymentStatus: PACKAGE`. Enforce capacity (re-check `spotsLeft` inside the transaction; reject overbooking). Generate a unique `ref` per booking. Fire the confirmation email with `.ics` (Phase 7). Returns created bookings.
- `GET /api/bookings?from=&to=&status=` — admin list with filters.
- `PATCH /api/bookings/:id` — admin. `{ status }` (check-in / confirm / cancel). On cancel of a PACKAGE booking, refund one credit (transaction + `PackageLog reason:"cancel-refund"`).
- `GET /api/me/bookings` — member's own upcoming/past bookings.

**Members & packages**
- `GET /api/admin/members` / `GET /api/admin/members/:id` — admin. Member list / detail (with packages + recent bookings).
- `GET /api/packages` — active package catalog.
- `POST /api/admin/packages` — admin. Create/edit catalog entries.
- `POST /api/admin/members/:id/packages` — admin. Assign a package → creates `MemberPackage` with `creditsRemaining = totalCredits` + `PackageLog reason:"assigned"`.
- `PATCH /api/admin/member-packages/:id/credits` — admin. `{ delta, note }` → add/remove credits (transaction + `PackageLog reason:"manual-add"|"manual-remove"`). Reject if it would go below 0.
- `GET /api/admin/member-packages/:id/logs` — admin. Full audit trail for one package.

**Leads / drop-ins**
- `POST /api/leads` — public. `{ email, name?, phone?, source }`. Dedupe by lowercased email server-side.
- `GET /api/leads` / `PATCH /api/leads/:id` — admin (status + notes).

**Availability blocks**
- `GET /api/admin/blocks?from=&to=` · `POST /api/admin/blocks` (`{ date, allDay, startTime?, endTime?, reason? }`) · `DELETE /api/admin/blocks/:id` — all admin.

**Calendar**
- `GET /api/bookings/:id/ics` — returns the `.ics` file for a booking (download). Google "Add to Calendar" link is built client-side (see Phase 7).

---

## 7. Build phases (do them in order)

### Phase 1 — Foundation: DB + persist real bookings/leads
1. Add `prisma/schema.prisma` (§4), `lib/prisma.js` (§5).
2. `npx prisma migrate dev --name init`.
3. Seed script `prisma/seed.mjs` (§8). Run it.
4. Build `POST/GET/PATCH /api/bookings` and `POST/GET /api/leads` against the **existing** booking shape (map `classType` → session `type`; create/find the `ClassSession` for the chosen date/time).
5. In `page.jsx`: delete the `storage` shim; replace the mount `useEffect` load with `fetch("/api/bookings")` + `fetch("/api/leads")`; replace `addBooking`/`updateBooking`/`addLead` with the API calls. **Keep all UI/markup and the wizard as-is for now.**
6. ✅ Test: book on one device, see it in admin on another. Data survives reload.

### Phase 2 — Schedule as data + availability blocking
1. Move `WEEKLY`/`CLASSES` into `WeeklyTemplate` + `Package`/session config (seed).
2. Implement `GET /api/availability` (auto-generate `ClassSession`s for the requested range, subtract blocks).
3. Point the booking wizard's day/slot picker at `/api/availability` instead of the `WEEKLY` constant.
4. Admin: an "Availability" panel to block a date (all-day) or an hours range, listing/removing blocks. Blocked slots disappear from booking.
5. ✅ Test: block tomorrow → it's ungbookable; unblock → it returns.

### Phase 3 — Member accounts + multi-session booking
1. Wire Auth.js Credentials (email+password) + `POST /api/register`. Add `/login` and `/signup` screens (reuse the card styles).
2. Convert the hard-coded admin gate to a real session check (`role: ADMIN`). Remove the on-screen `"ignite"` code.
3. Add a **booking cart**: members select multiple slots across days, review, and submit one `POST /api/bookings` with `items[]`. Guests/drop-ins still book without an account (`isDropIn` / `contact`).
4. Member "My Sessions" view via `GET /api/me/bookings`.
5. ✅ Test: sign up, book 3 sessions at once, see them all; admin sees the member linked.

### Phase 4 — Admin calendar (weekly + monthly)
1. Build a calendar UI in the admin dashboard with **week** and **month** toggle, backed by `GET /api/admin/sessions`.
2. Each session tile shows time, type, and **booked/capacity count**. **Color by type:** GROUP = ember/flame, PT = steel (`#6f8a99`). Fill level adjusts intensity (e.g. full = solid, low = outlined).
3. Click a session → **attendee list** (name, contact, status, drop-in flag) with check-in / cancel actions.
4. Keep the existing flat bookings list + KPI row as a secondary tab.
5. ✅ Test: week and month render; PT and group visually distinct; clicking shows who's booked.

### Phase 5 — Packages + audit log
1. Admin **Packages** page: view catalog, assign a package to a member, and **add/remove credits** with a required note.
2. Every credit change writes a `PackageLog` (transaction). Show the **full log** (timestamp, delta, reason, admin, note) on the member's package.
3. Member booking consumes a credit when a matching-type package has one (set in Phase 3's `POST /api/bookings`); cancellation refunds it.
4. ✅ Test: assign an 8-pack → 8 credits; book → 7 + a "booking" log line; admin removes 2 → 5 + a "manual-remove" log line; cancel a booking → +1 refund log line.

### Phase 6 — Leads / drop-ins
1. Persist leads server-side (already in Phase 1). Add a **drop-in capture** path: a quick form (name/email/phone) that both books the session as a drop-in **and** creates a `Lead` with `source:"dropin"` (these are leads to follow up with).
2. Admin **Leads** panel: list, status (new/contacted/converted/dead), notes, and a one-click "convert to member".
3. ✅ Test: a drop-in booking shows in both the session's attendee list and the Leads panel.

### Phase 7 — Calendar invites (.ics + Google link + Resend)
1. `lib/ics.js` — build a VCALENDAR string from a booking (date + `startTime` + `durationMin`, `SUMMARY` = session type, `LOCATION` = `9125 Archibald Ave Ste D, Rancho Cucamonga, CA` — currently hard-coded at ~line 618 of page.jsx, move it to a config constant).
2. `lib/email.js` — Resend client; send confirmation with the `.ics` as an attachment. For multi-session bookings, attach one `.ics` per session (or a combined calendar).
3. Confirmation screen + member "My Sessions": **"Add to Google Calendar"** button building `https://calendar.google.com/calendar/render?action=TEMPLATE&text=<title>&dates=<START>/<END>&details=<...>&location=<...>` where dates are UTC `YYYYMMDDTHHMMSSZ`. Also a "Download .ics" link to `GET /api/bookings/:id/ics`.
4. **Resend domain setup:** verify `ignitionfitness.com` in Resend by adding its SPF/DKIM records in **Hostinger's DNS** (same DNS editor you used for the migration). Until verified, send from Resend's `onboarding@resend.dev` for testing.
5. ✅ Test: booking triggers an email with a working calendar attachment; the Google link opens a prefilled event at the right local time.

---

## 8. Seed data (`prisma/seed.mjs`)

- **Admin user** from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bcrypt), `role: ADMIN`.
- **WeeklyTemplate** rows matching the current `WEEKLY` schedule (all GROUP, cap 10, 60 min) plus a couple of PT slots (cap 1) so color-by-type is visible.
- **Packages** catalog: e.g. `Drop-In` (1 GROUP), `8 Group Sessions`, `12 Group Sessions`, `5 PT Sessions` — mirror the pricing copy in `page.jsx` (~lines 540–568).
- Optionally a demo member + an assigned package so the admin views aren't empty.

Add to `package.json`: `"prisma": { "seed": "node prisma/seed.mjs" }` and run `npx prisma db seed`.

---

## 9. Setup & run (do this once, before Phase 1)

1. **Provision the database (only you can do this):** Vercel dashboard → your `ignitionfitness` project → **Storage** → **Create Database** → **Neon Postgres** → connect it to the project. This injects the DB env vars.
2. **Pull env locally:** `vercel env pull .env.local` (you're already linked). Then add `AUTH_SECRET` (`npx auth secret`), `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and map `DATABASE_URL` / `DIRECT_URL` (§3).
3. `npm install` the deps in §2.
4. `npx prisma migrate dev --name init` then `npx prisma db seed`.
5. `npm run dev` → build Phase 1, test locally.
6. When a phase is solid: add any new env vars to Vercel (Production), commit, and `vercel --prod`. Run `npx prisma migrate deploy` against production (or let the build step do it) after schema changes.

**Guardrails for Claude Code:** work phase by phase; run `npx prisma generate` after schema edits; never mutate package credits without a `PackageLog` in the same transaction; re-check capacity inside the booking transaction to prevent overbooking; keep secrets in env (never commit `.env.local` — it's already gitignored); preserve the existing design tokens and markup.

---

## 10. Definition of done

Bookings persist in Postgres and sync across devices; members sign up / log in and book multiple sessions at once; drop-ins book as guests and land in Leads; the admin has a weekly+monthly calendar with counts, attendee lists, and PT-vs-group colors; the coach can assign packages and add/remove credits with a full audit log; dates/hours can be blocked; and every booking sends a `.ics` invite with an Add-to-Google-Calendar link. Stripe is not built, but `paymentStatus` is ready for it.
