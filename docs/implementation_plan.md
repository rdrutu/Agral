# Agral MVP — Implementation Plan

## Overview

Build the Agral MVP: o platformă SaaS pentru fermieri cu **design modern verde**, conturi de utilizator, și funcționalitățile core (dashboard, parcele, vreme). Stack-ul este 100% gratuit prin GitHub Student Pack.

## Free Hosting Stack (GitHub Student)

| Layer | Serviciu | Cost |
|-------|---------|------|
| Frontend + API | **Vercel** (Hobby plan) | Gratuit |
| Database + Auth | **Supabase** (Free tier — 500MB, 50k auth users) | Gratuit |
| Redis cache | **Upstash** (Free — 10k req/zi) | Gratuit |
| Domain | **Namecheap** (GitHub Student — 1 an gratis) | Gratuit |
| Email | **Resend** (3000 email/lună) | Gratuit |

> [!IMPORTANT]
> GitHub Student Pack include credite Railway ($5/lună), Namecheap domain gratuit (.me sau .tech), și Vercel fără restricții de bandwidth pe proiecte personale/student.

## User Review Required

> [!NOTE]
> Vei primi un link Supabase la care va trebui să-ți creezi un proiect gratuit și să-mi dai `SUPABASE_URL` și `SUPABASE_ANON_KEY`. Te voi ghida pas cu pas când ajungem acolo.

## Proposed Changes

---

### Project Scaffold

#### [NEW] `agral/` — Next.js 14 monorepo
- `npx create-next-app@latest agral --typescript --tailwind --app --src-dir`
- Shadcn/ui init
- Structura de foldere: `src/app`, `src/components`, `src/lib`, `src/hooks`

---

### Design System

#### [NEW] `src/app/globals.css`
Paleta verde Agral — accesibilă pentru fermieri vârstnici:
- **Culori primare**: Verde închis `#1a5c2a`, Verde mediu `#2d8a47`, Verde deschis `#4caf74`
- **Background**: Crem cald `#fafaf7` (nu alb pur — mai puțin obositor pentru ochi)
- **Text**: Gri închis `#1c1c1e` — contrast maxim
- **Font**: `Nunito` (Google Fonts) — rotund, prietenos, ușor de citit la orice vârstă
- Butoane mari, padding generos (min 48px height)
- Text minim 16px, headings 20px+
- Iconițe mari + label text (nu doar iconițe)

#### [NEW] `src/components/ui/` — Design system components
Componente customizate peste shadcn: Button, Card, Input, Badge, Alert

---

### Supabase Integration

#### [NEW] `src/lib/supabase/client.ts` — Browser Supabase client
#### [NEW] `src/lib/supabase/server.ts` — Server Supabase client (pentru Server Components)
#### [NEW] `src/middleware.ts` — Protejare rute autentificate
#### [NEW] Database schema SQL (rulat în Supabase SQL editor):
  - Tabel `organizations` 
  - Tabel `profiles` (extinde auth.users)
  - Tabel `parcels`
  - Tabel `seasons`

---

### Pages & Components

#### [NEW] Landing Page (`src/app/page.tsx`)
- Hero cu tagline și CTA "Începe gratuit"
- 3 feature cards (parcele, contracte, vreme)
- Pricing section (3 tiere)
- Footer cu logo Agral

#### [NEW] Auth Pages
- `src/app/(auth)/login/page.tsx` — Login cu email/parolă
- `src/app/(auth)/register/page.tsx` — Register + creare organizație
- `src/app/(auth)/layout.tsx` — Layout split screen (imagine fermă + form)

#### [NEW] App Shell
- `src/app/(app)/layout.tsx` — Sidebar + header (rute protejate)
- `src/components/layout/Sidebar.tsx` — Navigare principală
- `src/components/layout/Header.tsx` — User menu, notificări

#### [NEW] Dashboard (`src/app/(app)/dashboard/page.tsx`)
- KPI cards: Hectare total, Parcele, Sezon activ
- **Weather Widget** (Open-Meteo API — gratuit, fără API key)
- Lista parcele recente
- Sfat agricol al zilei (static pentru MVP)

#### [NEW] Parcele (`src/app/(app)/parcele/page.tsx` + `/parcele/[id]/page.tsx`)
- Listă parcele cu search + filtrare
- Form adăugare/editare parcelă
- Card parcelă cu detalii (suprafață, cultură, status)

---

## Verification Plan

### Automated (Build check)
```bash
cd agral
npm run build
# Trebuie să compile fără erori TypeScript
```

### Browser Testing (via browser subagent)
1. Pornim dev server: `npm run dev` → `http://localhost:3000`
2. Testăm landing page — se afișează corect, CTA funcționează
3. Testăm register flow — creare cont, redirect la dashboard
4. Testăm login/logout
5. Testăm adăugare parcelă
6. Testăm weather widget (se afișează date meteo)
7. Testăm responsive (resize la 375px mobil)

### Manual (User)
1. Deschizi `http://localhost:3000` în browser
2. Click "Înregistrează-te" → completezi form → ești redirecționat la dashboard
3. Verifici că weather widget-ul arată vreme (are nevoie de locație sau București default)
4. Adaugi o parcelă și verifici că apare în listă
