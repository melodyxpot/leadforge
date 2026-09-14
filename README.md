# LeadForge

Internal B2B prospecting and website-intelligence workspace. Give it a company and quickly decide whether to contact them, why, what to offer, and what to say.

V1 focuses on legitimate, publicly discoverable companies. It is not designed to find underground operators or evade regulation.

## Current status

Phase 1 (foundation) and Phase 2 (lead CRUD) are in place:

- Next.js App Router, TypeScript, Tailwind, shadcn/ui
- Supabase Auth (email/password) and workspace-scoped Postgres with RLS
- Dashboard shell, command palette, Overview, Leads, Add Lead, lead detail

Website crawling, Lighthouse audits, and AI analysis are intentionally not implemented yet.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

3. Apply `supabase/migrations` to your Supabase project.

4. In the Supabase Auth settings, allow email/password. For local daily use, you may disable email confirmation.

5. Install and run:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, then add a lead.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Shortcuts

- `⌘/Ctrl + K` command palette
- `N` new lead
- `/` search
- `Esc` close dialogs
