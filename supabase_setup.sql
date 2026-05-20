-- ========================================
-- COPY SEMUA INI KE SQL EDITOR SUPABASE
-- Lalu klik tombol "Run" ▶
-- ========================================

-- 1. Tabel Perusahaan
create table companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- 2. Tabel Saldo Awal
create table opening_balances (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  account_code text not null,
  debit numeric default 0,
  kredit numeric default 0
);

-- 3. Tabel Jurnal
create table journals (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  date date not null,
  description text,
  created_at timestamptz default now()
);

-- 4. Tabel Detail Jurnal (entries per jurnal)
create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  journal_id uuid references journals(id) on delete cascade,
  account_code text not null,
  debit numeric default 0,
  kredit numeric default 0
);

-- 5. Matikan RLS agar semua orang bisa akses
alter table companies enable row level security;
alter table opening_balances enable row level security;
alter table journals enable row level security;
alter table journal_entries enable row level security;

-- Buat policy agar semua orang bisa baca & tulis
create policy "Allow all" on companies for all using (true) with check (true);
create policy "Allow all" on opening_balances for all using (true) with check (true);
create policy "Allow all" on journals for all using (true) with check (true);
create policy "Allow all" on journal_entries for all using (true) with check (true);
