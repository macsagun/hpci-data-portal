# Handoff: His Presence Church — Local Church Data Portal

## Overview
A two-sided app for His Presence Church International:
1. **Public submission page** — local church members report monthly Attendance, Tithes & Offering, Sermons, and Wins/Challenges, either via a guided on-screen form or a CSV upload.
2. **Leadership dashboard** (passphrase-gated) — pastors/admins review submissions per month across all local churches, drill into a single church's history, view trends, and **approve or reject** every submission before it becomes part of the official record.

## About the Design File
`Church Data Portal.dc.html` in this folder is an **HTML/React prototype** — a design and functional reference, not production code to copy directly. All UI, copy, and interaction logic in it should be treated as the intended behavior spec. The task is to **recreate this in the target codebase's environment** (whatever backend/frontend stack you choose — the prototype has no real backend) using real persistence, auth, and validation on the server side, not just in the browser.

## Fidelity
High-fidelity for layout, copy, and **all business/validation logic** (the rules below are exact and intentional — implement them, don't just eyeball the screenshots). Data persistence is **not** real: everything lives in in-memory React state and resets on page reload. There is no server, database, or real authentication.

---

## Screens / Views

### 1. Submit Report (public, no auth)
Mode toggle at the top: **✍️ Enter details** (default) or **Upload a CSV instead**.

**Enter details (form) mode**
- Three selects: Local Church (dropdown of known churches), Month, Year — all three **must** be chosen before anything else appears (empty state prompts "Choose your church, month and year to begin").
- Once all three are set, the app auto-lists every **Sunday** in that month. For each Sunday: Regulars (#), First Timers/VIP (#), Tithes & Offering (₱, combined single field), Sermon Title, Preacher.
- A Sunday row left completely blank = "no service that week" and is silently skipped (not an error).
- Wins this month / Challenges this month — two free-text areas, both required.
- **Duplicate-month detection**: if the selected church+month already has a submitted (live) record, an amber banner appears: "A report for {month} is already on file… Submitting again will send your changes for leadership approval," with a **Load & edit it** button that pre-fills the form from the existing record. The submit button label changes to "Submit changes for approval →".
- **Future-month notice**: if the selected month/year is after "today," a blue info note reminds the user to only fill in Sundays that already happened. ("Today" is hardcoded as July 2026 in the prototype — use the real current date in production.)
- Validation (inline, blocking submit until fixed): each filled week needs Regulars/VIP/Giving as numbers ≥ 0 and a non-empty Sermon Title; at least one week must have data; Wins and Challenges must both be non-empty. Errors are shown as a bulleted list naming the specific Sunday and field.
- Submit always routes to the **pending approval queue** — see Approval Workflow below. Success screen: "Sent for approval" with church/month and CTA to view dashboard or submit another.

**Upload a CSV instead mode**
- "Download blank template" button generates a CSV with the exact section layout below.
- "Try a filled sample file" loads a demo pre-filled CSV through the same parser (useful for QA).
- Drag-and-drop or browse to upload a `.csv`. Parsed client-side (see CSV Template Format below).
- Strict validation: any missing/malformed field blocks the whole file with a specific error list (never partial-imports). On success, shows a preview (church, month, weekly table, wins/challenges) before the user confirms.
- Confirm routes to the same pending approval queue as the form.

### 2. Leadership Dashboard (passphrase-gated)
**Access gate**: a lock-screen card asks for a passphrase (prototype default `hpci-pastors-2026`, configurable). Wrong passphrase shows an inline error. Correct passphrase unlocks the dashboard for the **browser session only** (sessionStorage) — a "Lock" button in the nav re-locks it immediately.

Once unlocked, three tabs:

**Overview**
- Month pills (one per month that has any data) to switch the reporting period.
- Four KPI cards: Reports In (x of N churches), Network Sunday Attendance (avg, summed across churches), First Timers/VIP welcomed, Total Giving.
- A table of every local church for the selected month: Status badge (**Submitted** / **Awaiting** / **↻ Pending review**), Avg Sunday Attendance, Regulars, VIP, Giving. Clicking a row opens that church's detail view.

**Trends**
- Two line charts: Network Sunday Attendance and Total Giving, both summed across all churches, one point per month.
- A table: attendance per church per month (grid).

**Approvals** (nav tab shows a live count badge)
- One card per pending submission, newest first. Each card shows:
  - Church name + badge: **✦ New report** (no live record yet) or **↻ Change requested** (updating an existing record).
  - "What changed" (or "Submitted data" for new reports): three metric tiles — Avg Sunday Attendance, VIP, Total Giving — each showing the new value, a colored delta vs. the current live value (green ↑ / red ↓ / blue "New"), and "was {old value}" (omitted for brand-new reports).
  - The full new weekly table (date, regulars, VIP, giving, sermon).
  - New Wins/Challenges text, with "Previously: …" shown underneath if it changed from the live record.
  - **Reject** button (discards the pending item, live record — if any — is untouched) and **Approve & Save/Update** button (writes the pending data into the live dataset, removing it from the queue).

**Church Detail** (via Overview row click)
- Back link to Overview.
- Two charts: Average Sunday Attendance and Total Giving, one point per month the church has a live record for.
- One card per month (newest first): summary chips (avg attendance, VIP, giving), full weekly table, Wins and Challenges.

---

## Approval Workflow (core business rule — implement exactly)
**Every submission — brand-new or an update to an existing church+month — goes into a pending queue first. Nothing is written to the "live"/official dataset until an admin explicitly approves it.**

- A submission's identity is `church + monthKey` (e.g. `HPCI Thrive|2026-06`) — one live record per church per month.
- Submitting again for a church+month that already has a **pending** item **replaces that pending draft** (does not stack multiple pending items for the same record).
- **Approve**: the pending record becomes the live record for that church+month (creating it if new, overwriting if it existed), then it's removed from the pending queue.
- **Reject**: the pending record is discarded; the live record (if any existed) is left exactly as it was.
- The Overview table and church rows must reflect three distinct states per church+month: no submission yet ("Awaiting"), a live submission exists ("Submitted"), and a pending submission is awaiting review ("↻ Pending review" — this can co-occur with either of the other two states, e.g. a church can be "Awaiting" a first-ever report while that very report sits pending).

## Data Model
```
Church
  name: string                      // 9 seeded: HPCI North Caloocan, Saturate, Cornerstone,
                                     // Thrive, LifeHouse, Maluid, Agape, Johanan, Valenzuela
                                     // (list grows automatically as new churches submit)

Submission (live) / PendingChange (queued) — same shape:
  id: string                        // `${church}|${monthKey}`
  church: string
  monthKey: string                  // "YYYY-MM"
  monthLabel: string                // "June 2026"
  weeks: Week[]
  wins: string
  challenges: string
  // PendingChange only:
  submittedLabel: string            // e.g. "Just now" / "Submitted 2 hours ago"
  isUpdate: boolean                 // true if a live record already existed at submit time

Week
  date: string                      // "YYYY-MM-DD", always a Sunday within monthKey
  regulars: number                  // integer ≥ 0
  vip: number                       // integer ≥ 0, "First Timers"
  giving: number                    // ≥ 0, PHP, Tithes + Offering COMBINED (single field, not split)
  sermon: string                    // sermon title
  preacher: string                  // preacher name, "—" if not provided
```

### Derived stats (per submission, compute — don't store)
- `avgAtt` = round(mean(regulars + vip) across weeks with data)
- `avgReg` = round(mean(regulars))
- `totalVip` = sum(vip)
- `giving` = sum(giving)

## CSV Template Format
Plain CSV, sections identified by exact label text in column A:
```
His Presence Church International - Monthly Local Church Report

Church Name:,<church name>
Report Month:,<Month YYYY>            e.g. "June 2026"

WEEKLY DATA
Sunday Date,Regulars,First Timers (VIP),Tithes & Offering (PHP),Sermon Title,Preacher
YYYY-MM-DD,<int>,<int>,<number>,<text>,<text>
...one row per Sunday in the month...

WINS
"<free text, wins for the month>"

CHALLENGES
"<free text, challenges for the month>"
```
Parser behavior to replicate: rows before the `WEEKLY DATA` header are scanned for `Church Name:` / `Report Month:` key-value pairs; weekly rows stop at the first blank cell or `WINS`/`CHALLENGES` marker; `WINS`/`CHALLENGES` blocks capture everything until the next marker or EOF. Any invalid date, non-numeric required field, or missing section produces a specific, human-readable error and blocks the whole import (no partial rows saved).

## Design Tokens
- Font: **Plus Jakarta Sans** (400/500/600/700/800), system-ui fallback.
- Background: `#f5f6f8`. Surface/cards: `#ffffff`, border `#e7e9ee`, radius 12–18px.
- Text: ink `#101828`, muted `#667085`, faint `#98a2b3`.
- Accent (primary actions, links, VIP figures): `#2f6ae0` (hover `#245bd0`), tint `#eaf0fd`.
- Positive/wins/approve: `#12946a` / `#0f7a56`, tint `#e6f6ef`.
- Warning/challenges/pending: `#a5600f` / `#b06514`, tint `#fbf1e4` / `#f9ecdc`.
- Destructive/reject/errors: `#b42318` / `#d64545`, tint `#fdecec`.
- Currency: Philippine Peso, formatted `₱12,345` (no decimals) in tables, compact `₱1.2M` / `₱45k` on chart axes.

## Assets
- Logo: `assets/logo.svg` (recolored to accent blue `#2f6ae0` background + white mark) — church-provided, already final.

## Known Gaps to Close When Wiring Up a Real Backend
- **No real auth** — dashboard access is a single shared static passphrase with no accounts, roles, or per-church login. Members have no login at all (fully public form). Decide on real auth (e.g. per-church submitter accounts + per-admin accounts with roles) before going live.
- **No persistence** — everything is React state; a refresh wipes all data. Needs a real database.
- **No audit trail** — who approved/rejected what, and when, isn't recorded. Add this for accountability.
- **No notifications** — local churches aren't told when their report is approved or rejected. Consider email/SMS.
- **Hardcoded "today"** (July 2026) drives the future-month warning — must use the real current date server-side.
- **CSV parsing happens entirely client-side** with no file storage — decide whether to keep raw uploaded files.
- **No search/pagination** — the prototype assumes a small, fixed-ish list of churches (~9). Revisit if the network grows significantly.
- **No edit/delete of already-approved live records** from the dashboard — only new pending changes (which still require approval) can alter a live record.

## Files
- `Church Data Portal.dc.html` — the full interactive prototype (all screens, styles, and logic described above).
