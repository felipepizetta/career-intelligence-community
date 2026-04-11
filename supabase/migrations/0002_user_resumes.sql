-- ==========================================
-- TABELA 2: CURRÍCULOS DO USUÁRIO
-- ==========================================
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ativa a segurança á nível de linha (Row Level Security)
alter table public.resumes enable row level security;

-- Permite que usuários possam ler os próprios currículos
create policy "Users can view their own resumes" 
on public.resumes for select 
using (auth.uid() = user_id);

-- Permite que usuários criem os próprios currículos
create policy "Users can insert their own resumes" 
on public.resumes for insert 
with check (auth.uid() = user_id);

-- Permite que usuários atualizem seus próprios currículos
create policy "Users can update their own resumes" 
on public.resumes for update 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
