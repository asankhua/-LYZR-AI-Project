-- Phase 3 ship fields. See architecture.md sections 12.1 and 12.2.

alter table projects add column if not exists github_auto_commit boolean not null default false;
alter table projects add column if not exists code_only boolean not null default false;
alter table projects add column if not exists github_conflict boolean not null default false;
alter table projects add column if not exists github_auto_push_at timestamptz;

alter table deployments add column if not exists promoted_at timestamptz;
