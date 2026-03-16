# 🌾 Agral — Farm Management Platform
### Product Specification & Technical Blueprint

---

## 1. Viziunea Produsului

**Agral** este o platformă SaaS B2B dedicată fermierilor români și din spațiul european, care le oferă unelte digitale pentru a gestiona eficient activitățile agricole de-a lungul întregului an agricol. Platforma elimină hârtia, coloanele de Excel și fragmentarea informației prin centralizarea tuturor fluxurilor fermei într-o singură interfață intuitivă.

**Public țintă:**
- Fermieri cu exploatații medii și mari (> 50 ha)
- Administratori de ferme / agronomi
- Cooperative agricole

**Model de monetizare:** Abonament lunar/anual cu mai multe tiere (Starter, Pro, Enterprise)

---

## 2. Module & Funcționalități

### 🗺️ 2.1 Gestionare Parcele (Land Management)
- Hartă interactivă (integrare **OpenLayers** / **Mapbox GL JS** + **LPIS** România)
- Adăugare/editare parcele cu geometrie reală (polygon pe hartă)
- Atribute per parcelă:
  - Denumire, cod cadastral, suprafață (ha)
  - Tip sol, categorie de folosință (arabil, pășune, vie etc.)
  - Proprietar (propriu / arendat)
  - Istoric culturi pe parcele (rotație culturi)
- Import/export **Shapefile, GeoJSON, KML**
- Vizualizare NDVI (indice vegetație via **Sentinel Hub / Planet**)

### 📅 2.2 Planificarea Sezonului Agricol
- Calendar agricol interactiv pe sezoane (primăvară/toamnă)
- Planificare culturi per parcelă (ce cultură, ce soi, suprafață plantată)
- Norme de semănat, fertilizare, irigare — generate pe baza culturii selectate
- Tracking stadii fenologice (BBCH scale)
- Alerte automate pentru lucrări agricole (fertilizare, tratamente fitosanitare)

### 📋 2.3 Contracte de Arendă (Lease Contracts)
- Generare automată contract de arendă conform legislației române (Legea 16/1994 + actualizări)
- Template-uri editabile (Word + PDF export)
- Bază de date proprietari de teren
- Gestionare date contract:
  - Proprietar, CNP/CIF, adresă
  - Parcelă arendată, suprafață, prețul arendei (RON/ha sau kg grâu/ha)
  - Perioadă contract, condiții reînnoire
  - Plăți: scadențe, status plată, generare chitanță
- Calendar scadențe arendă cu notificări
- Semnătură electronică (integrare **DocuSign** sau **semnatura.ro**)

### ☁️ 2.4 Vreme & Prognoze
- Widget vreme curentă per exploatație (locație GPS a fermei)
- Prognoză 7-14 zile (precipitații, temperatură, vânt, umiditate)
- Indici agro-meteorologici: evapotranspirație, frost risk, soil temperature
- Avertizări meteo (înghețuri, grindină, furtuni)
- Istoric meteo pe parcelă (corelat cu producțiile anterioare)
- API recomandat: **Open-Meteo** (gratuit) + **agromonitoring.com** sau **Meteomatics**

### 📰 2.5 Știri Agricole & Subvenții
- Feed agregat știri agricole din surse românești și europene
- Secțiune subvenții:
  - Status campanie APIA curentă
  - Calendar depunere cereri
  - Tipuri de plăți (SAPS, eco-scheme, plăți cuplare etc.)
  - Calculatoare estimare subvenție
- Notificări personalizate pe tipul de cultură al fermei
- RSS + web scraping surse: **Agro-TV, Ferma.ro, APIA.org.ro, Eurostat**

### 💰 2.6 Financiar Simplificat
- Registru cheltuieli per parcelă / sezon (semințe, îngrășăminte, pesticide, motorină)
- Registru venituri (vânzări producție, subvenții)
- Raport profit/pierdere per cultură
- Export contabil (CSV, Excel, PDF)
- Integrare opțională cu **Saga C** (software contabil popular în România)

### 📦 2.7 Stocuri & Depozite
- Gestiune stocuri: semințe, îngrășăminte, pesticide, motorină
- Trasabilitate lot per intrare/ieșire
- Alerte stoc minim
- Jurnalizare operațiuni depozit

### 🚜 2.8 Utilaje & Flotă
- Registru utilaje (tractor, combină, remorcă etc.)
- Fișa utilajului: ore funcționare, revizii, defecțiuni
- Planing lucrări pe utilaje (previne conflicte de programare)
- Consum motorină per utilaj/lucrare

### 👥 2.9 Echipă & Angajați
- Gestionare angajați sezonieri și permanenți
- Pontaj zilnic
- Fișă post, documente angajare
- Calculul salariului simplu (brut → net)

### 📊 2.10 Dashboard & Rapoarte
- KPI farm: ha lucrat, producție estimată vs. reală, cheltuieli vs. buget
- Rapoarte sezon (printabile/exportabile PDF)
- Comparație sezon curent vs. sezoane anterioare
- Heatmap parcele după productivitate

### 🔔 2.11 Notificări & Alerte
- Email + Push notifications (browser/PWA)
- SMS alerts (Twilio / sms.ro) pentru evenimente critice
- Alerte vreme severe, scadențe arendă, lucrări planificate

---

## 3. Planul de Abonament

| Tier | Preț | Limite | Features |
|------|------|--------|----------|
| **Starter** | 49 RON/lună | până la 100 ha, 1 utilizator | Parcele, Sezon, Vreme, Știri |
| **Pro** | 149 RON/lună | până la 500 ha, 3 utilizatori | + Contracte, Financiar, Stocuri |
| **Enterprise** | 399 RON/lună | nelimitat, utilizatori multipli | + Utilaje, Echipă, API access, SLA |
| **Trial** | Gratuit | 30 zile, 50 ha | Toate features Pro |

---

## 4. Stack Tehnic Recomandat

### Frontend
| Tehnologie | Rol | Motivație |
|-----------|-----|-----------|
| **Next.js 14** (App Router) | Framework principal | SSR/SSG, SEO, performance |
| **TypeScript** | Tipizare | Robustețe cod, DX |
| **Tailwind CSS** | Styling | Rapid, consistent |
| **shadcn/ui** | Componente UI | Accesibile, profes. |
| **MapLibre GL JS** | Hărți interactive | Open-source, performant |
| **Recharts / Chart.js** | Grafice/dashboard | Ușor de integrat |
| **React Hook Form + Zod** | Formulare + validare | Type-safe |

### Backend
| Tehnologie | Rol | Motivație |
|-----------|-----|-----------|
| **Node.js + Fastify** (sau Next.js API routes) | API REST/GraphQL | Rapid, ecosistem mare |
| **tRPC** | Type-safe API între FE-BE | DX excelent cu Next.js |
| **Prisma ORM** | Acces baza de date | Type-safe, migrații ușoare |
| **BullMQ + Redis** | Job queues | Notificări async, weather fetch |
| **Resend** | Email transactional | Modern, DX bun |

### Baza de Date — **PostgreSQL + PostGIS** ✅ (RECOMANDAT)

> [!IMPORTANT]
> Pentru o aplicație cu gestionare de suprafețe de teren și hărți, **PostgreSQL cu extensia PostGIS** este alegerea standard în industrie. PostGIS adaugă tipuri de date geografice native (`GEOMETRY`, `GEOGRAPHY`) și funcții spațiale (`ST_Area`, `ST_Intersects`, `ST_Union` etc.) care sunt esențiale pentru parcele.

**De ce PostgreSQL + PostGIS și nu altceva:**
- **vs. MySQL**: PostgreSQL are suport nativ superior pentru JSON, tipuri customizate, și PostGIS nu există pentru MySQL la același nivel
- **vs. MongoDB**: datele agricole sunt relaționale (parcelă → contract → proprietar → plăți); un model document ar complica query-urile
- **vs. SQLite**: nu scalează, lipsă features avansate
- **vs. Supabase** (built pe Postgres): Supabase este o opțiune excelentă ca **BaaS** care include PostgreSQL + PostGIS + Auth + Storage + Realtime, perfect pentru MVP rapid

**Recomandare deployment DB:**
- **MVP / Startup**: **Supabase** (PostgreSQL managed + auth + storage gratuit până la un punct)
- **Scale**: **Neon.tech** (serverless Postgres) sau **AWS RDS PostgreSQL** cu RDS PostGIS extension

### Cache & Queues
- **Redis** (Upstash pentru serverless) — caching date meteo, sesiuni, rate limiting

### Storage
- **AWS S3** / **Supabase Storage** — contracte PDF, documente, shapefile-uri importate

### Auth
- **NextAuth.js v5** sau **Supabase Auth** — email/password + Google OAuth

### Deployment
| Component | Platformă |
|-----------|-----------|
| Frontend/Backend | **Vercel** (Next.js nativ) |
| Database | **Supabase** sau **Neon** |
| Redis | **Upstash** |
| Storage | **Supabase Storage** / **AWS S3** |
| Emails | **Resend** |
| SMS | **sms.ro** / **Twilio** |

---

## 5. Schema Baza de Date (PostgreSQL + PostGIS)

### Core Tables

```sql
-- Organizații (ferme / exploatații)
organizations
  id (uuid PK)
  name (text)
  cui (text) -- cod fiscal
  address (text)
  county (text)
  lat, lng (decimal)
  subscription_tier (enum: starter|pro|enterprise)
  subscription_status (enum: active|trial|expired)
  created_at, updated_at

-- Utilizatori
users
  id (uuid PK)
  org_id (uuid FK → organizations)
  email (text UNIQUE)
  name (text)
  role (enum: owner|agronomist|worker|viewer)
  avatar_url (text)
  created_at

-- Parcele agricole (cu geometrie spațială!)
parcels
  id (uuid PK)
  org_id (uuid FK)
  name (text)
  cadastral_code (text)
  area_ha (decimal) -- calculat din geometrie
  geometry (GEOMETRY(POLYGON, 4326))  -- PostGIS!
  soil_type (text)
  land_use (enum: arabil|pasune|vie|livada|...)
  ownership (enum: owned|rented)
  notes (text)
  created_at, updated_at

-- Sezoane agricole
seasons
  id (uuid PK)
  org_id (uuid FK)
  name (text) -- ex: "Toamnă 2025 - Primăvară 2026"
  start_date (date)
  end_date (date)
  is_active (bool)

-- Planificarea culturilor
crop_plans
  id (uuid PK)
  season_id (uuid FK)
  parcel_id (uuid FK)
  crop_type (text) -- grâu, porumb, floarea-soarelui etc.
  variety (text)
  sown_area_ha (decimal)
  sown_date (date)
  estimated_harvest_date (date)
  estimated_yield_t_ha (decimal)
  actual_yield_t_ha (decimal)
  status (enum: planned|sown|growing|harvested)

-- Lucrări agricole
field_operations
  id (uuid PK)
  crop_plan_id (uuid FK)
  parcel_id (uuid FK)
  operation_type (enum: arat|semanat|fertilizare|tratament|recoltare|irigare|...)
  scheduled_date (date)
  completed_date (date)
  operator_user_id (uuid FK)
  machine_id (uuid FK)
  inputs_used (jsonb) -- {"produs": "Uree", "cantitate_kg_ha": 200}
  cost (decimal)
  notes (text)

-- Proprietari de teren (pentru arendă)
landowners
  id (uuid PK)
  org_id (uuid FK)
  full_name (text)
  cnp (text ENCRYPTED) -- date sensibile!
  address (text)
  phone (text)
  email (text)
  bank_account (text ENCRYPTED)
  notes (text)

-- Contracte de arendă
lease_contracts
  id (uuid PK)
  org_id (uuid FK)
  landowner_id (uuid FK)
  parcel_id (uuid FK)
  contract_number (text)
  start_date (date)
  end_date (date)
  rent_type (enum: ron_ha|kg_wheat_ha)
  rent_value (decimal)
  payment_frequency (enum: annual|semiannual)
  auto_renew (bool)
  document_url (text) -- PDF în storage
  status (enum: draft|active|expired|terminated)
  created_at, signed_at

-- Plăți arendă
lease_payments
  id (uuid PK)
  contract_id (uuid FK)
  due_date (date)
  amount (decimal)
  paid_date (date)
  payment_method (text)
  receipt_url (text)
  status (enum: pending|paid|overdue)

-- Cheltuieli
expenses
  id (uuid PK)
  org_id (uuid FK)
  season_id (uuid FK)
  parcel_id (uuid FK nullable)
  category (enum: seminte|ingrasaminte|pesticide|carburant|manopera|mecanizare|arenda|altele)
  description (text)
  amount (decimal)
  date (date)
  receipt_url (text)
  supplier (text)

-- Venituri
revenues
  id (uuid PK)
  org_id (uuid FK)
  season_id (uuid FK)
  source (enum: vanzare_productie|subventie|altele)
  crop_type (text)
  quantity_t (decimal)
  unit_price (decimal)
  total_amount (decimal)
  date (date)
  buyer (text)

-- Stocuri
stock_items
  id (uuid PK)
  org_id (uuid FK)
  name (text)
  category (enum: samanta|ingrasamant|pesticid|carburant|altele)
  unit (text) -- kg, litri, tone
  current_quantity (decimal)
  min_alert_quantity (decimal)

stock_transactions
  id (uuid PK)
  stock_item_id (uuid FK)
  transaction_type (enum: intrare|iesire)
  quantity (decimal)
  date (date)
  notes (text)
  operation_id (uuid FK nullable → field_operations)

-- Utilaje
machines
  id (uuid PK)
  org_id (uuid FK)
  name (text)
  type (enum: tractor|combina|remorca|plug|...)
  brand (text)
  model (text)
  year (int)
  plate_number (text)
  engine_hours (decimal)
  fuel_type (enum: motorina|electric)

machine_maintenance
  id (uuid PK)
  machine_id (uuid FK)
  type (enum: revizie|reparatie|ITP)
  date (date)
  cost (decimal)
  description (text)
  next_due_date (date)

-- Angajați
employees
  id (uuid PK)
  org_id (uuid FK)
  name (text)
  cnp (text ENCRYPTED)
  contract_type (enum: permanent|sezonier)
  hire_date (date)
  end_date (date nullable)
  salary_ron (decimal)
  role (text)

-- Notificări
notifications
  id (uuid PK)
  user_id (uuid FK)
  title (text)
  body (text)
  type (enum: meteo|scadenta|lucrare|stoc|sistem)
  read (bool)
  created_at

-- Abonamente & Billing
subscriptions
  id (uuid PK)
  org_id (uuid FK)
  stripe_subscription_id (text)
  tier (enum: starter|pro|enterprise)
  status (enum: trialing|active|past_due|canceled)
  current_period_start (timestamptz)
  current_period_end (timestamptz)
  cancel_at_period_end (bool)
```

### Indecși importante
```sql
CREATE INDEX idx_parcels_geometry ON parcels USING GIST (geometry);
CREATE INDEX idx_crop_plans_season ON crop_plans (season_id);
CREATE INDEX idx_lease_contracts_org ON lease_contracts (org_id, status);
CREATE INDEX idx_field_operations_date ON field_operations (scheduled_date);
CREATE INDEX idx_expenses_season ON expenses (org_id, season_id);
```

---

## 6. Integrări API Externe

| Serviciu | Scop | Pricing |
|---------|------|---------|
| **Open-Meteo** | Prognoze meteo | Gratuit (open-source) |
| **Sentinel Hub** | Imagini satelitare NDVI | Freemium |
| **LPIS România** | Date oficiale parcele APIA | Public (WMS/WFS) |
| **Stripe** | Plăți abonamente | 1.5% + fees |
| **DocuSign / HelloSign** | Semnătură electronică | Per document |
| **Resend** | Email tranzacțional | 3000 emails/lună gratuit |
| **sms.ro** | SMS notificări | Per SMS (~0.05 RON) |
| **Google Maps API** | Geocoding adrese | Pay-per-use |

---

## 7. Roadmap de Dezvoltare

### Faza 1 — MVP (3-4 luni)
- [ ] Auth & onboarding organizații
- [ ] Gestionare parcele (hartă + CRUD)
- [ ] Planificare sezoane & culturi
- [ ] Widget meteo
- [ ] Dashboard basic
- [ ] Abonamente Stripe (Starter + Pro)

### Faza 2 — Core Business (2-3 luni)
- [ ] Contracte de arendă + generare PDF
- [ ] Gestionare proprietari teren
- [ ] Calendar scadențe + notificări
- [ ] Cheltuieli & venituri simplificate
- [ ] Știri agricole (RSS feed)

### Faza 3 — Advanced (2-3 luni)
- [ ] Stocuri & depozite
- [ ] Utilaje & flotă
- [ ] Angajați & pontaj
- [ ] Imagini satelitare NDVI
- [ ] Export rapoarte PDF/Excel
- [ ] Semnătură electronică

### Faza 4 — Scale (ongoing)
- [ ] App mobilă (PWA sau React Native)
- [ ] API public pentru integrări terțe
- [ ] Integrare APIA (import date parcele din cerere unică)
- [ ] Marketplace inputuri agricole
- [ ] AI recomandări agronomice

---

## 8. Considerații Legale & Securitate

- **GDPR**: CNP-urile și datele personale ale proprietarilor se stochează **criptat** (AES-256 la nivel aplicație sau column-level encryption PostgreSQL)
- **Contracte**: Conformitate cu **Legea 16/1994 privind arenda** și actualizările ulterioare
- **Backup**: Backup automat zilnic al bazei de date (inclus în Supabase/Neon)
- **Audit log**: Toate modificările la contracte și date financiare sunt loggate cu user_id + timestamp
- **Multi-tenancy**: Izolare strictă date pe `org_id` — fiecare query filtrat obligatoriu
- **Rate limiting**: Protecție API împotriva abuzurilor (Redis + middleware)

---

## 9. Structura Proiect (Monorepo)

```
agral/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify API (opțional, dacă nu folosim Next API routes)
├── packages/
│   ├── db/           # Prisma schema + migrations
│   ├── ui/           # Design system / componente shared
│   ├── config/       # Config shared (eslint, ts, etc.)
│   └── types/        # TypeScript types shared
├── docs/             # Documentație internă
└── scripts/          # Scripturi deployment, seed DB
```

---

*Document creat: 16 Martie 2026 | Versiune: 1.0*
