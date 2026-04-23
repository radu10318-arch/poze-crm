# Poze'N Cui CRM — Ghid de instalare și deployment

---

## Ce ai nevoie înainte să începi

- Un laptop cu internet
- Un cont GitHub (gratuit) → github.com
- Un cont Supabase (gratuit) → supabase.com
- Un cont Vercel (gratuit) → vercel.com
- Node.js instalat pe laptop → nodejs.org (descarcă versiunea LTS)

---

## PASUL 1 — Creează proiectul Supabase

1. Mergi pe **supabase.com** și creează un cont gratuit
2. Click **"New project"**
3. Alege un nume: `poze-crm`
4. Alege o parolă pentru baza de date (salvează-o)
5. Selectează regiunea: **EU West (Frankfurt)** — cea mai apropiată de România
6. Click **"Create new project"** și așteaptă ~2 minute

### 1b. Rulează schema SQL

1. În Supabase, mergi la **SQL Editor** (meniul din stânga)
2. Click **"New query"**
3. Deschide fișierul `supabase-schema.sql` din proiect
4. Copiază tot conținutul și lipește în SQL Editor
5. Click **"Run"** — dacă totul e ok, vei vedea "Success"

### 1c. Creează bucket-urile pentru fișiere

1. Mergi la **Storage** în Supabase
2. Click **"New bucket"**, denumește-l `documents`, dezactivează "Public bucket"
3. Creează al doilea bucket: `contracts`, tot privat

### 1d. Creează primul utilizator

1. Mergi la **Authentication → Users**
2. Click **"Invite user"** sau **"Add user"**
3. Introdu email-ul tău și o parolă puternică
4. Acesta va fi contul tău de admin

### 1e. Copiază cheile API

1. Mergi la **Settings → API**
2. Copiază **Project URL** (arată ca `https://xxxx.supabase.co`)
3. Copiază **anon public key** (șirul lung care începe cu `eyJ...`)
4. Salvează-le undeva — le vei folosi la pasul 3

---

## PASUL 2 — Încarcă codul pe GitHub

1. Mergi pe **github.com** și creează un cont dacă nu ai
2. Click **"New repository"**
3. Denumește-l `poze-crm`
4. Lasă-l **Private** (recomandat pentru CRM intern)
5. Click **"Create repository"**

Pe laptop, deschide **Terminal** (Mac/Linux) sau **Command Prompt** (Windows):

```bash
# Navighează în folderul proiectului
cd poze-crm

# Inițializează Git
git init
git add .
git commit -m "Initial commit - Poze'N Cui CRM"

# Conectează la GitHub (înlocuiește USERNAME cu userul tău GitHub)
git remote add origin https://github.com/USERNAME/poze-crm.git
git branch -M main
git push -u origin main
```

---

## PASUL 3 — Configurează variabilele de mediu local

1. În folderul proiectului, copiază fișierul `.env.example`:
```bash
cp .env.example .env.local
```

2. Deschide `.env.local` cu orice editor de text (Notepad, VS Code etc.)
3. Completează cu valorile din Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## PASUL 4 — Rulează local (opțional, pentru testare)

```bash
# Instalează dependințele
npm install

# Pornește serverul de dezvoltare
npm run dev
```

Deschide în browser: **http://localhost:3000**

Dacă totul funcționează, vei vedea pagina de login. Loghează-te cu credențialele create în Supabase.

---

## PASUL 5 — Deployment pe Vercel (gratuit)

1. Mergi pe **vercel.com** și creează un cont cu GitHub
2. Click **"New Project"**
3. Importă repository-ul `poze-crm` din GitHub
4. La secțiunea **"Environment Variables"**, adaugă:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL-ul din Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = cheia anon din Supabase
5. Click **"Deploy"**

Vercel va construi și deploya aplicația automat. Vei primi un URL de genul:
`https://poze-crm-xxxx.vercel.app`

### 5b. Conectează domeniul tău

1. În Vercel, mergi la proiect → **Settings → Domains**
2. Adaugă `crm.pozeincui.ro` (un subdomain, nu domeniul principal)
3. Vercel îți va da niște recorduri DNS
4. Mergi la provider-ul domeniului tău (unde ai cumpărat pozeincui.ro)
5. Adaugă recordurile CNAME sau A indicate de Vercel
6. Așteaptă 5-30 minute pentru propagarea DNS

Aplicația va fi accesibilă la **crm.pozeincui.ro**

---

## PASUL 6 — Actualizări viitoare

Ori de câte ori vrei să faci o modificare:

```bash
# Fă modificările în cod, apoi:
git add .
git commit -m "Descriere modificare"
git push
```

Vercel detectează automat push-ul și redeploya în 30-60 secunde.

---

## Structura finală a fișierelor

```
poze-crm/
├── app/
│   ├── auth/login/          # Pagina de login
│   ├── dashboard/           # Dashboard principal
│   ├── clienti/             # Lista clienți + profil
│   ├── oferte/              # Oferte + formular nou
│   ├── pipeline/            # Vizualizare kanban
│   ├── financiar/           # Evidență plăți
│   └── api/                 # API routes (backend)
├── components/
│   ├── layout/Sidebar.tsx   # Navigare laterală
│   └── ui/                  # Componente reutilizabile
├── lib/
│   ├── supabase.ts          # Client browser
│   ├── supabase-server.ts   # Client server
│   └── utils.ts             # Utilități, labels, formatare
├── types/index.ts           # Toate tipurile TypeScript
├── supabase-schema.sql      # Schema completă bază de date
├── middleware.ts            # Protecție rute (auth)
└── .env.example             # Template variabile mediu
```

---

## Ce poți adăuga ulterior

1. **Calendar complet** — integrare Google Calendar cu react-big-calendar
2. **Generare PDF oferte** — cu @react-pdf/renderer (schelet deja în package.json)
3. **Upload documente** — Supabase Storage e deja configurat
4. **Formular client nou** — la fel cu formularul de ofertă
5. **Notificări email** — Supabase Edge Functions + Resend (gratuit)
6. **Dark mode** — Tailwind dark: prefix
7. **Export CSV** — simplu, din tabelele existente

---

## Probleme frecvente

**"Cannot find module" la npm install**
→ Asigură-te că ai Node.js 18+ instalat: `node --version`

**"Invalid API key" la login**
→ Verifică că `.env.local` conține cheile corecte din Supabase fără spații extra

**Pagina se încarcă dar nu se văd date**
→ Verifică în Supabase că schema SQL a rulat corect (tabelele există în Table Editor)

**Eroare la deploy pe Vercel**
→ Asigură-te că variabilele de mediu sunt adăugate în Vercel Settings

---

*Poze'N Cui CRM · Built with Next.js + Supabase + Vercel*
