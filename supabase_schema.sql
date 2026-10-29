-- ============================================================
-- DraftSpace — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. PROFILES
--    Auto-created when a new auth user signs up
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text unique not null,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 2. DOCUMENTS
-- ─────────────────────────────────────────────
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'Untitled Document',
  content    jsonb,                        -- rich-text JSON (e.g. TipTap/ProseMirror)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 3. DOCUMENT SHARES
-- ─────────────────────────────────────────────
create table if not exists public.document_shares (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents (id) on delete cascade,
  shared_with   uuid not null references public.profiles (id) on delete cascade,
  permission    text not null default 'view' check (permission in ('view', 'edit')),
  created_at    timestamptz default now() not null,
  unique (document_id, shared_with)
);


-- ─────────────────────────────────────────────
-- 4. AUTO-UPDATE updated_at TIMESTAMPS
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON AUTH SIGNUP
--    Trigger: New Auth User → handle_new_user() → profiles
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles        enable row level security;
alter table public.documents       enable row level security;
alter table public.document_shares enable row level security;


-- ── profiles ──
-- Users can only read and update their own profile
create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- Exact-email lookup (used when sharing a doc by email)
create policy "profiles: email lookup"
  on public.profiles for select
  using (true);   -- filtered to exact match in app query


-- ── documents ──
-- Owners have full access
create policy "documents: owner all"
  on public.documents for all
  using (auth.uid() = owner_id);

-- Shared users can select (view)
create policy "documents: shared select"
  on public.documents for select
  using (
    exists (
      select 1 from public.document_shares ds
      where ds.document_id = documents.id
        and ds.shared_with = auth.uid()
    )
  );

-- Shared users with 'edit' permission can update
create policy "documents: shared edit"
  on public.documents for update
  using (
    exists (
      select 1 from public.document_shares ds
      where ds.document_id = documents.id
        and ds.shared_with = auth.uid()
        and ds.permission = 'edit'
    )
  );


-- ── document_shares ──
-- Only document owners can manage shares
create policy "document_shares: owner all"
  on public.document_shares for all
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_shares.document_id
        and d.owner_id = auth.uid()
    )
  );

-- Shared users can see their own share records
create policy "document_shares: shared select"
  on public.document_shares for select
  using (shared_with = auth.uid());
