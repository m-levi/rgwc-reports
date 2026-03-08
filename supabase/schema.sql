-- Clients table
create table if not exists clients (
  id text primary key,
  name text not null,
  subtitle text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-client API credentials (encrypted at application level)
create table if not exists client_credentials (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  provider text not null check (provider in ('shopify', 'klaviyo')),
  credentials text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, provider)
);

-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profiles
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable RLS
alter table clients enable row level security;
alter table client_credentials enable row level security;
alter table profiles enable row level security;

-- RLS policies: authenticated users can read clients
create policy "Authenticated users can read clients"
  on clients for select
  to authenticated
  using (true);

-- Only admins can modify clients
create policy "Admins can insert clients"
  on clients for insert
  to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update clients"
  on clients for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete clients"
  on clients for delete
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can access credentials
create policy "Admins can read credentials"
  on client_credentials for select
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert credentials"
  on client_credentials for insert
  to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update credentials"
  on client_credentials for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete credentials"
  on client_credentials for delete
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Profiles: users can read all profiles, admins can modify
create policy "Authenticated users can read profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Admins can update profiles"
  on profiles for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed the existing client
insert into clients (id, name, subtitle)
values ('rg8k2m', 'RGWC Reports', 'The Really Good Whisky Company')
on conflict (id) do nothing;
