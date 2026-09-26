-- Architect 2.0 initial schema. See architecture.md sections 8.6, 10 and 29.

create extension if not exists pgcrypto;

-- Profiles (one row per auth user)

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  mode text not null default 'simple' check (mode in ('simple', 'developer')),
  onboarding jsonb,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  name text not null,
  slug text unique,
  description text,
  stage text not null default 'plan' check (stage in ('plan', 'agents', 'build', 'ship')),
  template text not null default 'vite-react',
  theme jsonb,
  mode_override text check (mode_override in ('simple', 'developer')),
  github_repo text,
  github_branch text default 'main',
  current_snapshot_id uuid,
  public_key text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table project_members (
  project_id uuid references projects on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  primary key (project_id, user_id)
);

create table project_files (
  project_id uuid references projects on delete cascade,
  path text not null,
  content text not null,
  sha text not null,
  updated_at timestamptz default now(),
  primary key (project_id, path)
);

create table snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  parent_id uuid references snapshots,
  message_id uuid,
  summary text,
  manifest jsonb not null,
  healthy boolean not null default false,
  commit_sha text,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

alter table projects
  add constraint projects_current_snapshot_fk
  foreign key (current_snapshot_id) references snapshots (id);

create table file_blobs (
  sha text primary key,
  content text not null
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  kind text not null default 'chat',
  content text,
  parts jsonb,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

alter table snapshots
  add constraint snapshots_message_fk
  foreign key (message_id) references messages (id);

create table plans (
  project_id uuid primary key references projects on delete cascade,
  doc jsonb not null,
  approved_at timestamptz,
  version int not null default 1,
  updated_at timestamptz default now()
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  spec jsonb not null,
  position jsonb,
  created_at timestamptz default now(),
  unique (project_id, name)
);

create table project_env (
  project_id uuid references projects on delete cascade,
  key text not null,
  value_encrypted bytea not null,
  primary key (project_id, key)
);

create table integrations (
  user_id uuid references profiles on delete cascade,
  provider text not null,
  access_token_encrypted bytea,
  account_login text,
  scopes text[],
  meta jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, provider)
);

create table deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  snapshot_id uuid references snapshots,
  provider text not null default 'vercel',
  provider_deployment_id text,
  status text not null default 'queued'
    check (status in ('queued', 'building', 'ready', 'error', 'canceled')),
  url text,
  subdomain text,
  logs text,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

create table usage_events (
  id bigserial primary key,
  user_id uuid not null references profiles on delete cascade,
  project_id uuid references projects on delete set null,
  stage text not null,
  agent_name text,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cached_tokens int not null default 0,
  created_at timestamptz default now()
);

create index usage_events_user_created_idx on usage_events (user_id, created_at desc);
create index messages_project_created_idx on messages (project_id, created_at);
create index projects_owner_idx on projects (owner_id);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  agent_name text not null,
  source text not null check (source in ('test', 'preview', 'deployed')),
  input text,
  output text,
  steps jsonb,
  input_tokens int default 0,
  output_tokens int default 0,
  duration_ms int,
  status text not null default 'ok',
  created_at timestamptz default now()
);

create table knowledge_chunks (
  id bigserial primary key,
  project_id uuid not null references projects on delete cascade,
  file_path text not null,
  agent_name text,
  chunk_index int not null,
  content text not null,
  tsv tsvector generated always as (to_tsvector('english', content)) stored
);

create index knowledge_chunks_tsv_idx on knowledge_chunks using gin (tsv);

-- Triggers

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function handle_new_project();

-- Row level security

create function is_member(p uuid, min_role text default 'viewer')
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from project_members m
    where m.project_id = p
      and m.user_id = auth.uid()
      and case min_role
        when 'viewer' then true
        when 'editor' then m.role in ('editor', 'owner')
        when 'owner' then m.role = 'owner'
        else false
      end
  );
$$;

alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());

alter table projects enable row level security;
create policy "members read projects" on projects for select using (is_member(id));
create policy "owner insert projects" on projects for insert with check (owner_id = auth.uid());
create policy "editors update projects" on projects for update using (is_member(id, 'editor'));
create policy "owner delete projects" on projects for delete using (is_member(id, 'owner'));

alter table project_members enable row level security;
create policy "members read membership" on project_members for select using (is_member(project_id));
create policy "owner adds members" on project_members for insert with check (is_member(project_id, 'owner'));
create policy "owner updates members" on project_members for update using (is_member(project_id, 'owner'));
create policy "owner removes members" on project_members for delete using (is_member(project_id, 'owner'));

alter table project_files enable row level security;
create policy "members read files" on project_files for select using (is_member(project_id));
create policy "editors write files" on project_files for insert with check (is_member(project_id, 'editor'));
create policy "editors update files" on project_files for update using (is_member(project_id, 'editor'));
create policy "editors delete files" on project_files for delete using (is_member(project_id, 'editor'));

alter table snapshots enable row level security;
create policy "members read snapshots" on snapshots for select using (is_member(project_id));
create policy "editors write snapshots" on snapshots for insert with check (is_member(project_id, 'editor'));
create policy "editors update snapshots" on snapshots for update using (is_member(project_id, 'editor'));

alter table file_blobs enable row level security;

alter table messages enable row level security;
create policy "members read messages" on messages for select using (is_member(project_id));
create policy "editors write messages" on messages for insert with check (is_member(project_id, 'editor'));

alter table plans enable row level security;
create policy "members read plans" on plans for select using (is_member(project_id));
create policy "editors write plans" on plans for insert with check (is_member(project_id, 'editor'));
create policy "editors update plans" on plans for update using (is_member(project_id, 'editor'));

alter table agents enable row level security;
create policy "members read agents" on agents for select using (is_member(project_id));
create policy "editors write agents" on agents for insert with check (is_member(project_id, 'editor'));
create policy "editors update agents" on agents for update using (is_member(project_id, 'editor'));
create policy "editors delete agents" on agents for delete using (is_member(project_id, 'editor'));

alter table project_env enable row level security;
create policy "editors read env" on project_env for select using (is_member(project_id, 'editor'));
create policy "editors write env" on project_env for insert with check (is_member(project_id, 'editor'));
create policy "editors update env" on project_env for update using (is_member(project_id, 'editor'));
create policy "editors delete env" on project_env for delete using (is_member(project_id, 'editor'));

alter table integrations enable row level security;
create policy "read own integrations" on integrations for select using (user_id = auth.uid());
create policy "write own integrations" on integrations for insert with check (user_id = auth.uid());
create policy "update own integrations" on integrations for update using (user_id = auth.uid());
create policy "delete own integrations" on integrations for delete using (user_id = auth.uid());

alter table deployments enable row level security;
create policy "members read deployments" on deployments for select using (is_member(project_id));
create policy "editors write deployments" on deployments for insert with check (is_member(project_id, 'editor'));
create policy "editors update deployments" on deployments for update using (is_member(project_id, 'editor'));

alter table usage_events enable row level security;
create policy "read own usage" on usage_events for select using (user_id = auth.uid());
create policy "write own usage" on usage_events for insert with check (user_id = auth.uid());

alter table agent_runs enable row level security;
create policy "members read runs" on agent_runs for select using (is_member(project_id));
create policy "editors write runs" on agent_runs for insert with check (is_member(project_id, 'editor'));

alter table knowledge_chunks enable row level security;
create policy "members read chunks" on knowledge_chunks for select using (is_member(project_id));
create policy "editors write chunks" on knowledge_chunks for insert with check (is_member(project_id, 'editor'));

-- Storage buckets

insert into storage.buckets (id, name, public)
values
  ('uploads', 'uploads', false),
  ('exports', 'exports', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users write own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "members read uploads"
  on storage.objects for select
  using (
    bucket_id = 'uploads'
    and is_member(((storage.foldername(name))[1])::uuid)
  );

create policy "editors write uploads"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and is_member(((storage.foldername(name))[1])::uuid, 'editor')
  );
