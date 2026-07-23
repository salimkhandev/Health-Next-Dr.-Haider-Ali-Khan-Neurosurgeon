# IlmPath — Course Platform: Final Build Specification (v1)

This is the single source of truth. All resolved decisions are baked directly into their relevant sections — no separate "gap list," no contradictions. Build exactly to this document.

---

## 1. Project Overview

A Progressive Web App (PWA) built with Next.js where students browse paid courses, submit payment for manual verification, and stream or cache videos securely. Videos are protected from local device downloads using the Origin Private File System (OPFS). Works on Android, iOS, Windows, and desktop — no APK needed.

---

## 2. Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js (App Router) | Frontend + API routes in one, serverless-ready |
| Hosting | Vercel (free tier) | Serverless, auto-scaling, zero maintenance |
| Database | MongoDB Atlas (free tier) | Document-shaped data, 512MB free |
| File & video storage | Cloudflare R2 | 10GB free, zero egress fees, S3-compatible API |
| Authentication | NextAuth.js | Free, supports roles (student / admin) |
| Email | Resend (free tier) | 3000 emails/month free |
| Rate limiting | Upstash Redis (free tier) | Brute force protection |
| Error logging | Sentry (free tier) | Frontend + backend error capture |
| Image compression | browser-image-compression (npm) | Client-side, no server timeout risk |
| PWA | next-pwa | Service worker, offline shell, installable |

---

## 3. Architecture

```
Student (PWA browser)
        │
        ▼
Next.js API Routes (Vercel serverless)
  ├── Auth (NextAuth.js)
  ├── Course routes
  ├── Payment routes
  ├── Admin routes (protected)
  └── Presigned URL generator
        │
        ├──▶ MongoDB Atlas
        │     (users, payments, passwordResets, courses, progress)
        │
        └──▶ Cloudflare R2
              ├── /videos/          (course videos)
              ├── /screenshots/     (payment screenshots)
              ├── /thumbnails/      (course thumbnails)
              ├── /certificates/    (completion PDFs)
              └── /backups/         (weekly MongoDB export)
```

### Hard Rule — Never Upload Through the Server
```
WRONG: Browser → Next.js API → R2   (times out on Vercel free tier)
RIGHT: Next.js API generates presigned URL → Browser uploads directly to R2
```

---

## 4. MongoDB Collections & Schema

### `users`
```json
{
  "_id": "ObjectId",
  "name": "Ahmed Khan",
  "email": "ahmed@gmail.com",
  "passwordHash": "bcrypt hash",
  "role": "student",
  "status": "pending",
  "createdAt": "2026-07-20T10:00:00Z",
  "accessExpiresAt": null
}
```
**Status enum:** `pending` | `paid` | `rejected` | `expired` | `revoked`

Rules:
- `accessExpiresAt` is `null` until first approval, then set to `now + 1 year` on each approval.
- `status` always reflects the outcome of the **most recent** payment document (see below), except when manually set to `revoked` by an admin — `revoked` overrides everything until an admin reverses it.

### `payments`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId ref",
  "name": "Ahmed Khan",
  "email": "ahmed@gmail.com",
  "phone": "03001234567",
  "paymentMethod": "JazzCash",
  "transactionId": "TXN123456789",
  "amount": 2500,
  "currency": "PKR",
  "screenshotKey": "screenshots/abc123-1720000000.jpg",
  "status": "pending",
  "submittedAt": "2026-07-20T10:00:00Z",
  "reviewedAt": null,
  "reviewedBy": null,
  "adminNote": ""
}
```
**Status enum:** `pending` | `approved` | `rejected`

Rules:
- **Multiple documents per `userId` are expected and correct.** A rejected student may resubmit; each submission creates a **new** document — never overwrite or delete old ones (they're the audit trail).
- Always query the "current" payment by: `find({ userId }).sort({ submittedAt: -1 }).limit(1)`.
- `user.status` is updated only from the **latest** payment doc's outcome.
- `transactionId` + `amount` are **required fields** on the payment form — without them, an admin cannot cross-check the submission against their own bank/wallet statement.
- Do **not** store `screenshotUrl` as a permanent field (URLs expire) — only store `screenshotKey`. Generate a fresh presigned view URL on every admin panel load.

### `passwordResets` (new)
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId ref",
  "token": "random 32-byte hex string",
  "expiresAt": "2026-07-20T11:00:00Z",
  "used": false,
  "createdAt": "2026-07-20T10:00:00Z"
}
```

### `courses`
```json
{
  "_id": "ObjectId",
  "title": "Complete Web Development",
  "description": "Learn HTML, CSS, JS and more",
  "thumbnailKey": "thumbnails/course1.jpg",
  "videos": [
    {
      "_id": "ObjectId",
      "order": 1,
      "title": "Introduction",
      "duration": 1800,
      "r2Key": "videos/course1/intro.mp4",
      "sizeBytes": 1073741824
    }
  ],
  "createdAt": "2026-07-20T10:00:00Z"
}
```
Note: store `thumbnailKey`, not a full URL — thumbnails are also private R2 objects accessed via presigned URL (or, if you want thumbnails public for SEO/sharing on the course listing page, make **only** the `/thumbnails/` prefix public in R2 bucket settings — decide this explicitly before launch; default assumption here is **private**, matching the rest of the bucket).

### `progress`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId ref",
  "courseId": "ObjectId ref",
  "videoId": "ObjectId ref",
  "watchedSeconds": 342,
  "completed": false,
  "updatedAt": "2026-07-20T10:00:00Z"
}
```
Unique constraint: one document per `(userId, courseId, videoId)` triple — upsert on every save, never insert duplicates.

### MongoDB Indexes (create on setup)
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ status: 1 })
db.payments.createIndex({ userId: 1, submittedAt: -1 })
db.payments.createIndex({ status: 1 })
db.passwordResets.createIndex({ token: 1 }, { unique: true })
db.passwordResets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // auto-delete expired tokens
db.progress.createIndex({ userId: 1, courseId: 1, videoId: 1 }, { unique: true })
```

---

## 5. Cloudflare R2 Structure

```
your-bucket/
├── videos/
│   └── course1/
│       ├── intro.mp4
│       └── lesson2.mp4
├── screenshots/
│   └── userId-timestamp.jpg
├── thumbnails/
│   └── course1.jpg
├── certificates/
│   └── userId-courseId.pdf
├── backups/
│   └── 2026-07-20-users.json
└── dev/                          ← all dev-environment uploads live under this prefix
    ├── screenshots/
    ├── videos/
    └── thumbnails/
```

- Bucket is fully private — no public access, no exceptions, unless you explicitly decided otherwise for `/thumbnails/` (see §4 note above).
- All access via presigned URLs generated by the backend only. Frontend never sees R2 credentials or bucket name.
- **CORS configuration (required — set this in the R2 dashboard, not in code):**
  ```json
  [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://your-vercel-domain.vercel.app",
        "https://yourdomain.com"
      ],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```
  Without this, direct browser-to-R2 uploads will fail silently with a CORS error in the console.

---

## 6. Environment Separation

- **Same** MongoDB Atlas cluster for dev and prod, **different database name**: `ilmpath_dev` vs `ilmpath_prod`, controlled via `MONGODB_URI`.
- **Same** R2 bucket for dev and prod, but all dev-created keys are prefixed with `dev/` (e.g. `dev/screenshots/...`), so they can be bulk-deleted later and never mix with prod data visually.
- Two separate `.env` files:
  - `.env.local` → dev values, git-ignored
  - Vercel Production Environment Variables → prod values, set in Vercel dashboard
- `NEXTAUTH_SECRET` must be **different** between dev and prod. Generate with:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- Full env var list:
  ```
  MONGODB_URI=
  R2_ACCESS_KEY_ID=
  R2_SECRET_ACCESS_KEY=
  R2_BUCKET_NAME=
  R2_ENDPOINT=
  R2_KEY_PREFIX=              # "" in prod, "dev/" in dev
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=
  RESEND_API_KEY=
  SUPPORT_EMAIL=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  SENTRY_DSN=
  ```

---

## 7. All Pages & Routes

### Public
| Page | Route |
|---|---|
| Home / landing | `/` |
| Course listing | `/courses` |
| Course detail | `/courses/[id]` |
| Login | `/login` |
| Register | `/register` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password/[token]` |
| Terms & conditions | `/terms` |
| Privacy policy | `/privacy` |
| Refund policy | `/refund` |
| About / contact | `/about` |

### Student (logged in)
| Page | Route | Notes |
|---|---|---|
| Dashboard | `/dashboard` | Redirect here only if `status === "paid"` and not expired |
| Payment form | `/payment` | Accessible if `status` is `pending` (first-time) or `rejected` (resubmit) |
| Payment pending | `/payment/pending` | Shown when `status === "pending"` |
| Video player | `/watch/[courseId]/[videoId]` | |
| Downloaded videos | `/downloads` | OPFS-cached video management (delete, see space used) |

**Route guard logic (apply in a layout or middleware):**
- `status === "pending"` → force redirect to `/payment/pending` if visiting `/dashboard` or `/watch/*`
- `status === "rejected"` → force redirect to `/payment` (with rejection reason shown)
- `status === "expired"` or `"revoked"` → force redirect to a dedicated `/access-ended` page with the appropriate message; block `/watch/*` and `/dashboard`
- `status === "paid"` **and** `accessExpiresAt > now` → full access

### Admin (role === "admin", middleware protected)
| Page | Route |
|---|---|
| Admin dashboard | `/admin` |
| Students list | `/admin/students` |
| Student profile | `/admin/students/[id]` |
| Payment reviews | `/admin/payments` |
| Course manager | `/admin/courses` |

---

## 8. Authentication (NextAuth.js)

- Credentials provider: email + password, bcrypt-hashed (min cost factor 10).
- Two roles: `student`, `admin` — stored in `users.role`, embedded in JWT session.
- Admin accounts are created manually (e.g. via a seed script or direct DB insert) — **never** through `/register`. `/register` always creates `role: "student"`.
- Session expiry: 7 days (student), 24 hours (admin).
- Password requirements (enforce server-side): min 8 characters, at least 1 letter and 1 number.
- **Email verification:** not required in v1. Students can use the app immediately after registering.
- **Password reset flow:**
  1. `/forgot-password` — student submits email. Always respond with the same generic message ("If that email exists, a reset link has been sent") regardless of whether the email exists, to avoid leaking which emails are registered.
  2. If the email exists, generate a random 32-byte hex token, save to `passwordResets` with `expiresAt: now + 1hr`, email the link via Resend.
  3. `/reset-password/[token]` — verify token exists, not expired, not used. On submit: hash new password, update `users.passwordHash`, set `passwordResets.used = true`.
  4. Reject reused or expired tokens with a clear error and a link back to `/forgot-password`.
- **Account lockout:** handled entirely by the Upstash rate limiter (§11). No separate lockout email in v1 — the 429 response is sufficient.

---

## 9. Payment Flow (Step by Step)

```
Step 1 — Student fills payment form (only reachable if status is pending-first-time or rejected)
  Fields: full name, email, phone, payment method, transaction ID, amount paid
  Checkbox: "I agree to terms & conditions and refund policy" (required, blocks submit if unchecked)

Step 2 — Student selects screenshot
  Client validates: file.type starts with "image/" — reject anything else immediately
  Browser compresses using browser-image-compression
  Target: max 300KB, max 1280px width
  Safety check post-compression: if still > 1MB, reject with "Image is still too large" — do not upload

Step 3 — Upload to R2 (direct, never through server)
  API route generates presigned PUT URL for R2 (server verifies session + rate-limits this endpoint too)
  Browser uploads compressed screenshot directly to R2
  R2 key format: {R2_KEY_PREFIX}screenshots/{userId}-{timestamp}.jpg

Step 4 — Save to MongoDB
  New payment document created with status: "pending" (previous docs for this user, if any, are untouched)
  screenshotKey saved — never store raw screenshot bytes in MongoDB

Step 5 — Emails sent via Resend (fire-and-forget; log failures to Sentry, do not block the response)
  To student: "We received your payment screenshot. We will review within 24 hours."
  To admin:   "New payment submitted by {name}. Review at {adminPanelUrl}"

Step 6 — Admin reviews (/admin/payments)
  Sorted newest first, paginated 25/page
  Shows: name, email, phone, method, transaction ID, amount, submission time
  Screenshot loaded via freshly generated presigned VIEW URL (expires in 2 hours, generated on page load, never cached)
  Admin clicks Approve or Reject (Reject requires a note; Approve note is optional)

Step 7 — On approval
  MongoDB payment.status → "approved", reviewedAt, reviewedBy set
  MongoDB user.status → "paid"
  MongoDB user.accessExpiresAt → now + 1 year
  Email to student: "Your account is now active. Start learning!"

Step 8 — On rejection
  MongoDB payment.status → "rejected", reviewedAt, reviewedBy, adminNote set
  MongoDB user.status → "rejected"
  Email to student:
    IF adminNote is non-empty:
      "We could not verify your payment. Reason: {adminNote}. Please contact us at {SUPPORT_EMAIL} to resolve, or resubmit your payment details."
    IF adminNote is empty:
      "We could not verify your payment. Please contact us at {SUPPORT_EMAIL} to resolve, or resubmit your payment details."
```

**Duplicate submission guard:** while a student has a `pending` payment (latest doc status === "pending"), block access to `/payment` entirely — show `/payment/pending` instead. This prevents spam resubmission while a review is in progress.

---

## 10. Video Access & Presigned URLs

- On `/watch/[courseId]/[videoId]` load, backend checks (in order): session valid → `user.status === "paid"` → `user.accessExpiresAt > now`. Fail any check → 403, redirect to the relevant status page (§7 route guard logic).
- If all checks pass → generate presigned **streaming** URL, `expiresIn: 7200` (2 hours).
- URL used directly in `<video src="...">`. Frontend never receives R2 bucket name or credentials.
- Player must re-request a fresh URL if playback is resumed after the 2-hour window (e.g. long pause) — detect via a 403 on the video element's error event and silently re-fetch.

```javascript
// /api/video/[videoId]
const url = await getSignedUrl(r2Client, new GetObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: videoKey,
}), { expiresIn: 7200 });
```

**Watermarking:** explicitly out of scope for v1. Protection = private bucket + short-lived signed URLs + OPFS blocking local file export. Do not attempt dynamic watermark overlays.

---

## 11. OPFS Video Caching (Offline Access)

OPFS = browser-private storage, invisible to the OS file manager, not copyable/shareable by the user. This is the DRM layer for offline video.

**Presigned URL for OPFS downloads uses a longer expiry than streaming:** `expiresIn: 21600` (6 hours), issued from a separate endpoint (`/api/video/[videoId]/download-url`) distinct from the streaming endpoint, so streaming and download expiries can be tuned independently.

**Before download — storage check:**
```javascript
const estimate = await navigator.storage.estimate();
const freeBytes = estimate.quota - estimate.usage;
if (freeBytes < videoSizeBytes) {
  // "Not enough space. Please delete a cached video to make room."
  return;
}
```

**During download — chunked, resumable:**
- Fetch in chunks using Range headers, update progress bar per chunk.
- If a chunk request fails with 403 (URL expired mid-download): automatically call `/api/video/[videoId]/download-url` for a fresh presigned URL, then resume from the last successfully written byte offset via `Range: bytes={offset}-`. Do not restart from zero.
- If storage fills mid-download: delete the incomplete partial file, show the storage warning, do not leave orphaned partial files in OPFS.
- Support pause and resume via the same Range-header mechanism.

**On completion:**
- Mark video "available offline" in local state (a small IndexedDB or localStorage manifest tracking `{ videoId, sizeBytes, downloadedAt }`).
- Student can watch fully offline from this point.

**Storage management (`/downloads` page):**
- v1 has **no automatic eviction/LRU.** List all cached videos with size + delete button. Student manages space manually.
- If storage is full during a new download attempt, show the existing warning only — do not auto-delete anything.

**iOS Safari:**
- OPFS is capped at ~20% of device storage. Check quota before showing the download option at all; if quota is too low, show: "Your device does not have enough available storage for offline viewing. You can still stream the video." — and hide the download button, don't just disable it.

---

## 12. Screenshot Compression (Client-Side)

```javascript
import imageCompression from 'browser-image-compression';

const handleScreenshotUpload = async (file) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (jpg or png)');
    return;
  }

  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  };

  const compressed = await imageCompression(file, options);

  if (compressed.size > 1 * 1024 * 1024) {
    alert('Image is still too large. Please take a clearer screenshot.');
    return;
  }

  await uploadToR2(compressed);
};
```
Expected result: 3–8MB screenshot → 200–400KB.

---

## 13. Admin Panel

### Students list (`/admin/students`)
- Table: name, email, registration date, status badge, pagination **25/page, offset-based** (`.skip().limit()`), Previous/Next + page numbers.
- Search bar: filter by name or email (case-insensitive regex match is sufficient at this scale; MongoDB text index optional).
- Click a student → `/admin/students/[id]`: full profile + complete payment history (all docs, not just latest) + **"Revoke Access" button** (confirmation modal required) that sets `user.status = "revoked"`. Also allow an admin to **reverse** a revocation back to `"paid"` if `accessExpiresAt` is still in the future.
- Bulk approve: select multiple `pending`-status students' latest payments, approve all in one action (loop server-side, one email per student — do not batch emails into one).

### Payment reviews (`/admin/payments`)
- List of pending payments (latest doc per user, filtered `status === "pending"`), sorted newest first, paginated 25/page.
- Approve / Reject buttons trigger the flows in §9, steps 7–8.
- Reject **requires** a note (form validation, not optional here — contradicts the earlier "optional" framing; a note is required so the templated rejection email in §9 always has something useful to say to the student).

### Course manager (`/admin/courses`)
- Create/edit course metadata, upload thumbnail (presigned URL flow, same pattern as screenshots).
- Upload videos: presigned PUT URL flow, same as screenshots but no compression — warn admin in the UI about file size before upload starts (large files = slow on 3G/weak connections even for the admin).

---

## 14. Email Notifications (Resend)

| Trigger | Recipient | Subject |
|---|---|---|
| Payment submitted | Student | "Payment received" |
| Payment submitted | Admin | "New payment to review" |
| Payment approved | Student | "Account activated" |
| Payment rejected | Student | "Payment not verified" |
| Password reset requested | Student | "Reset your password" |
| Course completed | Student | "Certificate ready" |

All emails: fire-and-forget from the API route (don't await in a way that blocks the HTTP response longer than necessary); log send failures to Sentry rather than surfacing them to the user, since email failure shouldn't block the underlying action (approval, rejection, etc. must still succeed even if the email fails).

---

## 15. Security Implementation

**Admin route protection (middleware):**
```javascript
// middleware.ts
export function middleware(request) {
  const session = getToken({ req: request });
  if (!session || session.role !== 'admin') {
    return NextResponse.redirect('/login');
  }
}
export const config = {
  matcher: ['/admin/:path*']
};
```
Apply the same pattern for student-only routes (`/dashboard`, `/payment`, `/watch/:path*`, `/downloads`) — redirect unauthenticated users to `/login`.

**Brute force protection (Upstash):**
```javascript
const { success } = await ratelimit.limit(email);
if (!success) {
  return Response.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
}
```
Apply rate limiting to: `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, and the presigned-URL generation endpoints (prevents abuse of the upload flow).

**Input sanitization:**
- Sanitize all text inputs before saving to MongoDB (strip `$` and `.` prefixed keys to prevent NoSQL injection, or use a library like `express-mongo-sanitize`).
- Validate every field server-side even when already validated client-side — client validation is a UX convenience only, never a security boundary.

**Secrets:** never hardcoded, always via env vars (§6). `.env.local` must be in `.gitignore` from the very first commit.

---

## 16. Progress Tracking

- Save `watchedSeconds` to MongoDB every 30 seconds during playback (debounced, not on every timeupdate event).
- On video load, fetch the saved `watchedSeconds` for `(userId, courseId, videoId)` and resume from there.
- Course-level progress bar: "3 of 7 videos completed."
- A video is `completed: true` once watched past 90% of its `duration`.
- Use the unique index `(userId, courseId, videoId)` — always upsert, never insert a duplicate.

---

## 17. Course Completion Certificate

- Trigger: all videos in a course are `completed: true` for that user → generate certificate automatically (server-side check after each progress update, or a scheduled check — either is fine, but pick one and be consistent).
- Contents: student name, course name, completion date.
- Generated via `pdf-lib` in a Next.js API route.
- Stored at `{R2_KEY_PREFIX}certificates/{userId}-{courseId}.pdf`.
- Student downloads via a presigned URL — this PDF is the **only** file a student is permitted to save locally.
- Trigger the "Certificate ready" email (§14) at generation time.

---

## 18. PWA Configuration

- Service worker caches the app shell (HTML/CSS/JS) for offline access to the UI itself.
- Videos are **not** cached by the service worker — offline video access is handled exclusively through the manual OPFS flow (§11).
- Push notifications: notify students when a new video is added to a course they're enrolled in (Phase 4 — not required for v1 launch).
- Installable on Android, iOS (Add to Home Screen), desktop. Manifest includes app name, icons, theme color, start URL.

---

## 19. MongoDB Atlas Backup

Weekly export via Vercel Cron (free tier does not include automatic backups):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 0 * * 0"
  }]
}
```
API route exports `users`, `payments`, `courses` collections to JSON, stored at `{R2_KEY_PREFIX}backups/{date}-{collection}.json`. Do **not** back up `passwordResets` (short-lived, low value, contains active reset tokens — a security liability to archive).

---

## 20. Slow Connection Handling (Pakistan Network Conditions)

- All video streaming/downloading uses HTTP Range requests.
- Progress bar shows percentage + estimated time remaining.
- Pause/resume supported via Range headers (§11).
- Compress all thumbnails/images before upload; use Next.js `<Image>` for automatic WebP + lazy loading.
- Test the full payment and video flows on throttled 3G before launch.

---

## 21. Legal Pages (Required Before Launch)

**Terms & Conditions:** what's purchased (1-year access to video content), no credential sharing, no recording/redistribution, access can be revoked for violation.

**Privacy Policy:** data collected (name, email, phone, payment screenshot, transaction ID), storage location (R2, MongoDB), who can see it (admin only), how to request deletion (email {SUPPORT_EMAIL}).

**Refund Policy:** refunds are manual, case-by-case, how to request one, decision timeframe.

Generate a first draft at https://www.termsfeed.com (free), then adapt to match this doc's actual data fields and flows exactly.

---

## 22. Build Order

### Phase 1 — Core
1. Next.js project setup + PWA config
2. MongoDB connection + all collections + indexes (§4)
3. NextAuth.js auth: register, login, roles, session
4. Public course listing/detail pages
5. R2 bucket setup + CORS config (§5) + presigned URL generation
6. Video streaming player for paid users
7. Payment form (with transaction ID/amount fields) + compression + R2 upload
8. Admin panel: students list, payment review, approve/reject
9. Email notifications via Resend
10. Admin + student route middleware protection (§7, §15)
11. Upstash rate limiting on login, register, forgot-password, upload endpoints
12. Environment variables (dev + prod split) + deploy to Vercel

### Phase 2 — Security & Polish
13. Password reset flow (§8)
14. Duplicate-submission guard on `/payment` (§9)
15. OPFS download manager: storage check, chunked download, progress bar
16. Resumable downloads with 403-retry logic (§11)
17. Access revocation (§13)
18. Input sanitization on all API routes
19. Sentry error logging
20. Terms, privacy, refund pages
21. About/contact page
22. Payment pending / rejected / access-ended status pages with route guards

### Phase 3 — Student Experience
23. Progress tracking (30s interval save)
24. Course completion detection
25. PDF certificate generation
26. Student dashboard (courses, progress, certificates)
27. Admin search bar + pagination on students/payments lists
28. MongoDB weekly backup cron job

### Phase 4 — Growth Features
29. Push notifications for new videos
30. Bulk approve in admin panel
31. Access expiry enforcement (scheduled job to flip `paid` → `expired` when `accessExpiresAt` passes) + renewal flow + expiry reminder email
32. Email verification on register (if spam becomes a problem)
33. Referral system
34. Course ratings from paid students

---

## 23. Cost Summary

| Service | Free Tier | When You Pay |
|---|---|---|
| Vercel | 100GB bandwidth/month | Only at scale |
| MongoDB Atlas | 512MB storage | $9/month for 2GB |
| Cloudflare R2 | 10GB storage | $0.015/GB after 10GB |
| Resend | 3000 emails/month | $20/month for 50k |
| Upstash Redis | 10k requests/day | $0.20 per 100k |
| Sentry | 5000 errors/month | $26/month |

**Total cost to launch: $0**
**Total cost at 100 students: ~$0**
**Total cost at 1000 students, 50GB video: ~$1.50/month**

---

## 24. Explicitly Out of Scope for v1

State these plainly so no time is wasted building them prematurely:
- Video watermarking / dynamic session-tagged overlays
- Automatic OPFS storage eviction (LRU or otherwise)
- Email verification on registration
- Admin two-factor authentication
- Automated access-expiry cron enforcement (Phase 4 only — v1 relies on the login-time check `accessExpiresAt > now`, which is sufficient since it's checked on every protected route anyway)
- Public thumbnail access (unless explicitly reconfigured in R2 — default is private like everything else)