create schema if not exists fintrak;
create extension if not exists "pgcrypto";

create table fintrak.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fintrak.plaid_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  access_token text not null, item_id text not null unique, institution_id text, institution_name text,
  transaction_cursor text, created_at timestamptz not null default now()
);
create table fintrak.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  name text not null, type text not null check (type in ('checking','savings','credit','investment','loan')),
  balance numeric not null default 0, institution text, plaid_account_id text unique, plaid_item_id uuid references fintrak.plaid_items(id) on delete set null,
  currency text not null default 'USD', is_manual boolean not null default true, created_at timestamptz not null default now()
);
create table fintrak.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  name text not null, amount numeric not null, category text, date date not null, account_id uuid references fintrak.accounts(id) on delete set null,
  plaid_transaction_id text unique, notes text, created_at timestamptz not null default now()
);
create table fintrak.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  date date not null, net_worth numeric not null, assets numeric not null, liabilities numeric not null,
  unique(user_id, date)
);
create table fintrak.budget_scenarios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  name text not null, monthly_income numeric not null default 0, is_active boolean not null default false, notes text,
  created_at timestamptz not null default now()
);
create table fintrak.budget_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  scenario_id uuid not null references fintrak.budget_scenarios(id) on delete cascade, category text not null, label text not null,
  amount numeric not null default 0, type text not null check (type in ('income','expense')),
  frequency text not null check (frequency in ('monthly','weekly','annual')), created_at timestamptz not null default now()
);
create table fintrak.investments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references fintrak.users(id) on delete cascade,
  name text not null, type text not null, current_value numeric not null default 0, target_value numeric,
  monthly_contribution numeric not null default 0, annual_return_rate numeric not null default 0, start_date date not null,
  target_date date, ticker text, notes text, created_at timestamptz not null default now()
);

create index transactions_user_date_idx on fintrak.transactions(user_id, date desc);
create index accounts_user_idx on fintrak.accounts(user_id);
create index budget_scenarios_user_idx on fintrak.budget_scenarios(user_id);
create index budget_items_scenario_idx on fintrak.budget_items(scenario_id);
create index snapshots_user_date_idx on fintrak.net_worth_snapshots(user_id, date desc);

alter table fintrak.users enable row level security;
alter table fintrak.plaid_items enable row level security;
alter table fintrak.accounts enable row level security;
alter table fintrak.transactions enable row level security;
alter table fintrak.net_worth_snapshots enable row level security;
alter table fintrak.budget_scenarios enable row level security;
alter table fintrak.budget_items enable row level security;
alter table fintrak.investments enable row level security;

create policy "users own profile" on fintrak.users for all using (id = auth.uid()) with check (id = auth.uid());
create policy "users own plaid items" on fintrak.plaid_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own accounts" on fintrak.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own transactions" on fintrak.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own snapshots" on fintrak.net_worth_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own scenarios" on fintrak.budget_scenarios for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own budget items" on fintrak.budget_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own investments" on fintrak.investments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function fintrak.handle_new_user() returns trigger language plpgsql security definer set search_path = fintrak as $$
begin
  insert into fintrak.users (id, name, email, avatar)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set name = excluded.name, email = excluded.email, avatar = excluded.avatar, updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function fintrak.handle_new_user();
