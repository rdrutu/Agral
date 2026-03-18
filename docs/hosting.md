# Ghid de Hosting Gratuit - Agral

Pentru a găzdui aplicația Agral gratuit și cu performanțe premium, recomandăm combinația **Vercel** + **Supabase**.

## 1. Supabase (Baza de date și Autentificare)
Deoarece proiectul folosește deja Supabase în mediul de dezvoltare, trecerea la producție este simplă:
- Creează un proiect nou pe [Supabase](https://supabase.com/).
- Mergi la **Settings > Database** și copiază `Connection string` (Transaction mode).
- Rulează migrarea bazei de date pe noul proiect folosind:
  ```bash
  npx prisma db push
  ```

## 2. Vercel (Frontend și Serverless API)
Vercel este platforma ideală pentru Next.js:
- Conectează-ți depozitul GitHub la [Vercel](https://vercel.com/).
- Adaugă următoarele variabile de mediu în setările proiectului Vercel:
  - `DATABASE_URL`: URL-ul bazei de date Supabase.
  - `DIRECT_URL`: URL-ul direct Supabase (necesar pentru Prisma).
  - `NEXT_PUBLIC_SUPABASE_URL`: URL-ul proiectului Supabase.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Cheia anonimă Supabase.
  - `SUPABASE_SERVICE_ROLE_KEY`: Cheia service role (pentru operațiuni admin).

## 3. Deployment Automat
După ce ai conectat GitHub și ai setat variabilele, fiecare `push` pe ramura `main` va declanșa un build automat:
1. Vercel instalează dependențele.
2. Rulează `npm run build`.
3. Generează clientul Prisma.
4. Publică aplicația pe un domeniu `.vercel.app` gratuit.

> [!TIP]
> Poți conecta un domeniu custom gratuit via Vercel dacă ai unul cumpărat separat. SSL-ul este inclus și automat.
