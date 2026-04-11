-- ==========================================
-- TABELA 1: AUTOMAÇÕES DO USUÁRIO (AUTOPILOT / NEWS)
-- ==========================================
create table if not exists public.user_automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  is_active boolean default false,
  news_source text,
  post_style text,
  frequency_days numeric,
  schedule_days text default '1,2,3,4,5',
  posts_per_day integer default 1,
  used_sources_today text default '',
  last_delivered_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id) -- 1 perfil de automação por usuário
);

-- Ativa políticas de segurança (Row Level Security) para essa tabela
alter table public.user_automations enable row level security;

-- Permite que usuários leiam apenas as próprias automações
create policy "Usuários podem ver suas próprias automacoes" 
on public.user_automations for select 
using (auth.uid() = user_id);

-- Permite que usuários atualizem ou insiram as próprias automações (Upsert)
create policy "Usuários podem atualizar ou inserir suas automações" 
on public.user_automations for insert 
with check (auth.uid() = user_id);

create policy "Usuários podem dar update nas automações" 
on public.user_automations for update 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
