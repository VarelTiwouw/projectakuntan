-- JALANKAN INI DI SQL EDITOR SUPABASE
-- Tabel untuk menyimpan daftar akun custom

create table accounts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null,
  category text not null,
  normal_balance text not null
);

alter table accounts enable row level security;
create policy "Allow all" on accounts for all using (true) with check (true);
