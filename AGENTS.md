<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sistema de Gastos — Repo Guide

## Commands
- `npm run dev` — dev server at `localhost:3000`
- `npm run build` — compile + typecheck (one command, no separate typecheck)
- `npm run lint` — ESLint
- No tests installed

## Quirks (Next.js 16 + shadcn v4)
- `/src/proxy.ts` exports `proxy`, not `middleware`; edge runtime not supported
- Tailwind v4: CSS uses `@import "tailwindcss"` (no `@tailwind` directives)
- shadcn style is `base-nova` uses `@base-ui/react` (not Radix) — import from `@/components/ui/`
- `shadcn` is a runtime dep (v4.8.0), add components via `npx shadcn@latest add <name>`
- `next-themes` wired with `<ThemeProvider attribute="class">` — toggle in sidebar

## Supabase
- Browser: `src/lib/supabase/client.ts` (named function, `"use client"`)
- Server: `src/lib/supabase/server.ts` (`cookies()` from `next/headers`)
- Auth callback (`src/app/auth/callback/route.ts`) — cookies now properly set on response
- Schema in `supabase/schema.sql` — run in Supabase SQL Editor after project creation
- Profile auto-created on signup via DB trigger (`handle_new_user()`)
- **DB trigger** `on_transaction_budget_sync` auto-updates `budgets.spent_amount` on transaction INSERT/UPDATE/DELETE
- Storage: `receipts` bucket (user-scoped folders), upload via `POST /api/upload`
- `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture
- **All pages are `"use client"`** individual files under `src/app/`; each imports `DashboardLayout` wrapper — no shared page layout
- Sidebar nav: Dashboard, Transacciones, Análisis, Cuentas, Presupuestos, Metas, Perfil
- Mutations via **Server Actions** in `src/lib/server/actions/` — imports from `@/lib/server/actions/<resource>`
- File upload via API route `src/app/api/upload/route.ts`
- Financial logic in `src/lib/finance/` (helpers, calculations, rules, analysis)
- UI components in `src/components/ui/` (shadcn)
- `src/components/finance/` — contains `Alerts.tsx`
- Recharts for charts; Sonner for toasts; Lucide for icons

## Conventions
- Response language: Spanish
- Currency: `S/ 1,250.00` via `formatCurrency()` in `src/lib/finance/helpers.ts`
- Categories: `CATEGORIES` constant in `src/types/database.ts` (15 items)
- Budget status: `getBudgetStatus()` from `src/lib/finance/rules.ts`
- Zod validation with inline errors on all forms
