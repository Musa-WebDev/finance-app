create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plaid_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  access_token text not null, item_id text not null unique, institution_id text, institution_name text,
  transaction_cursor text, created_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, type text not null check (type in ('checking','savings','credit','investment','loan')),
  balance numeric not null default 0, institution text, plaid_account_id text unique, plaid_item_id uuid references public.plaid_items(id) on delete set null,
  currency text not null default 'USD', is_manual boolean not null default true, created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, amount numeric not null, category text, date date not null, account_id uuid references public.accounts(id) on delete set null,
  plaid_transaction_id text unique, notes text, created_at timestamptz not null default now()
);
create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  date date not null, net_worth numeric not null, assets numeric not null, liabilities numeric not null,
  unique(user_id, date)
);
create table public.budget_scenarios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, monthly_income numeric not null default 0, is_active boolean not null default false, notes text,
  created_at timestamptz not null default now()
);
create table public.budget_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  scenario_id uuid not null references public.budget_scenarios(id) on delete cascade, category text not null, label text not null,
  amount numeric not null default 0, type text not null check (type in ('income','expense')),
  frequency text not null check (frequency in ('monthly','weekly','annual')), created_at timestamptz not null default now()
);
create table public.investments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, type text not null, current_value numeric not null default 0, target_value numeric,
  monthly_contribution numeric not null default 0, annual_return_rate numeric not null default 0, start_date date not null,
  target_date date, ticker text, notes text, created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions(user_id, date desc);
create index accounts_user_idx on public.accounts(user_id);
create index budget_scenarios_user_idx on public.budget_scenarios(user_id);
create index budget_items_scenario_idx on public.budget_items(scenario_id);
create index snapshots_user_date_idx on public.net_worth_snapshots(user_id, date desc);

alter table public.users enable row level security;
alter table public.plaid_items enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.budget_scenarios enable row level security;
alter table public.budget_items enable row level security;
alter table public.investments enable row level security;

create policy "users own profile" on public.users for all using (id = auth.uid()) with check (id = auth.uid());
create policy "users own plaid items" on public.plaid_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own accounts" on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own transactions" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own snapshots" on public.net_worth_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own scenarios" on public.budget_scenarios for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own budget items" on public.budget_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own investments" on public.investments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, avatar)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set name = excluded.name, email = excluded.email, avatar = excluded.avatar, updated_at = now();
  return new;
end;
$$;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users for each row execute procedure public.handle_new_user();
