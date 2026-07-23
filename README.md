# PashtoSkills — Learn Online Skills in Pashto

PashtoSkills is a premium, offline-first online educational platform designed to teach high-income online skills entirely in the Pashto language.

## Key Features

1. **Secure Streaming:** Videos are served via short-lived signed URLs. Nothing is permanently downloadable to the user's device directly.
2. **Offline-First (PWA):** Users can securely cache videos for offline viewing using our custom Service Worker setup.
3. **Role-Based Workflows:** Separate dashboards for Admins and Students.
4. **Course-Specific Payments:** Automatic dynamic pricing for individual courses.

## Tech Stack

- Next.js (App Router)
- React 19
- MongoDB + Mongoose
- NextAuth for Authentication
- Cloudflare R2 for Secure Video & Image Storage
- Tailwind CSS

## Development

```bash
pnpm install
pnpm dev
```
