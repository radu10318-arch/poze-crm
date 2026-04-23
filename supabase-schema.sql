-- ============================================================
-- Poze'N Cui CRM — Schema SQL pentru Supabase
-- Rulează în Supabase SQL Editor (în ordinea de mai jos)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS (gestionat de Supabase Auth) ──────────────────────────
-- Supabase creează automat tabelul auth.users
-- Creăm un tabel profiles legat de el

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  business_name text default 'Poze''N Cui',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ─── CLIENTS ─────────────────────────────────────────────────────

create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  client_type text not null default 'persoana_fizica'
    check (client_type in ('persoana_fizica', 'companie')),
  company_name text,
  billing_details text,
  preferred_payment_method text
    check (preferred_payment_method in ('cash', 'transfer', 'card', 'alta')),
  lead_source text
    check (lead_source in ('instagram','facebook','tiktok','google','recomandare','olx','site','alt_canal')),
  tags text[] default '{}',
  pipeline_status text not null default 'lead_nou'
    check (pipeline_status in (
      'lead_nou','in_discutie','oferta_trimisa','oferta_acceptata',
      'contract_semnat','avans_primit','programat','eveniment_realizat',
      'editare_in_curs','galerie_livrata','finalizat'
    )),
  notes text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;
create policy "Users see own clients" on public.clients
  for all using (auth.uid() = user_id);

-- ─── OFFERS ──────────────────────────────────────────────────────

create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  pricing_type text not null
    check (pricing_type in ('per_ora', 'per_serviciu', 'pachet_fix')),
  service_type text not null
    check (service_type in (
      'nunta','botez','cununie_civila','majorat','petrecere_privata',
      'sedinta_foto','corporate','fotografie_produs','imobiliare'
    )),
  description text,
  duration_hours numeric,
  base_price numeric not null default 0,
  extra_options jsonb default '[]',
  total_price numeric not null default 0,
  status text not null default 'draft'
    check (status in ('draft','trimisa','acceptata','respinsa','expirata')),
  valid_until date,
  pdf_url text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offers enable row level security;
create policy "Users see own offers" on public.offers
  for all using (auth.uid() = user_id);

-- ─── EVENTS ──────────────────────────────────────────────────────

create table public.events (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  offer_id uuid references public.offers on delete set null,
  event_type text not null,
  date date not null,
  start_time time not null,
  end_time time,
  location_primary text not null,
  location_secondary text,
  estimated_persons integer,
  contact_person text,
  contact_phone text,
  special_requirements text,
  logistics_notes text,
  duration_estimated numeric,
  delivery_deadline date,
  status text not null default 'programat'
    check (status in ('programat','realizat','anulat')),
  google_calendar_event_id text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;
create policy "Users see own events" on public.events
  for all using (auth.uid() = user_id);

-- ─── PAYMENTS ────────────────────────────────────────────────────

create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  event_id uuid references public.events on delete set null,
  total_amount numeric not null default 0,
  advance_amount numeric default 0,
  advance_paid_at timestamptz,
  remaining_amount numeric not null default 0,
  due_date date,
  payment_method text
    check (payment_method in ('cash','transfer','card','alta')),
  status text not null default 'neplatit'
    check (status in ('neplatit','avans_platit','partial','achitat')),
  notes text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;
create policy "Users see own payments" on public.payments
  for all using (auth.uid() = user_id);

-- ─── PAYMENT RECORDS ─────────────────────────────────────────────

create table public.payment_records (
  id uuid default uuid_generate_v4() primary key,
  payment_id uuid references public.payments on delete cascade not null,
  client_id uuid references public.clients on delete cascade not null,
  amount numeric not null,
  paid_at timestamptz default now(),
  method text not null
    check (method in ('cash','transfer','card','alta')),
  notes text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.payment_records enable row level security;
create policy "Users see own payment records" on public.payment_records
  for all using (auth.uid() = user_id);

-- ─── PIXIESET LINKS ──────────────────────────────────────────────

create table public.pixieset_links (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  event_id uuid references public.events on delete set null,
  link_url text not null,
  password text,
  delivery_date date,
  status text not null default 'nelivrata'
    check (status in ('nelivrata','in_editare','livrata')),
  notes text,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pixieset_links enable row level security;
create policy "Users see own pixieset links" on public.pixieset_links
  for all using (auth.uid() = user_id);

-- ─── DOCUMENTS ───────────────────────────────────────────────────

create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  file_name text not null,
  file_url text not null,
  document_type text not null default 'alt_document'
    check (document_type in ('contract','alt_document')),
  user_id uuid references auth.users on delete cascade not null,
  uploaded_at timestamptz default now()
);

alter table public.documents enable row level security;
create policy "Users see own documents" on public.documents
  for all using (auth.uid() = user_id);

-- ─── TIMELINE ENTRIES ────────────────────────────────────────────

create table public.timeline_entries (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  entry_type text not null,
  description text not null,
  metadata jsonb default '{}',
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.timeline_entries enable row level security;
create policy "Users see own timeline" on public.timeline_entries
  for all using (auth.uid() = user_id);

-- ─── TASKS ───────────────────────────────────────────────────────

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients on delete cascade not null,
  task_type text not null
    check (task_type in ('de_editat','de_trimis_oferta','de_cerut_avans','de_livrat_galerie','alt_task')),
  title text not null,
  due_date date,
  completed boolean default false,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Users see own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- ─── TRIGGERS: updated_at automată ───────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on public.clients
  for each row execute function update_updated_at();
create trigger offers_updated_at before update on public.offers
  for each row execute function update_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function update_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function update_updated_at();
create trigger pixieset_updated_at before update on public.pixieset_links
  for each row execute function update_updated_at();

-- ─── STORAGE BUCKET pentru documente ─────────────────────────────
-- Rulează separat în Supabase Dashboard > Storage:
-- Creează bucket numit "documents" cu acces privat
-- Creează bucket numit "contracts" cu acces privat
