-- ==========================================
-- TABELA 3: POSTS GERADOS PELO USUÁRIO (HISTÓRICO)
-- ==========================================
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null,
  topic text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativa políticas de segurança (Row Level Security) para essa tabela
alter table public.posts enable row level security;

-- Permite que usuários possam ler os próprios posts
create policy "Users can view own posts" 
on public.posts for select 
using (auth.uid() = user_id);

-- Permite que usuários insiram seus próprios posts
create policy "Users can insert own posts" 
on public.posts for insert 
with check (auth.uid() = user_id);

-- Políticas adicionais EXTREMAMENTE NECESSÁRIAS para que o botão de Apagar Histórico funcione:
create policy "Users can update own posts" 
on public.posts for update 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own posts" 
on public.posts for delete
using (auth.uid() = user_id);

-- ÚNICO E GLOBAL POSTGREST RESET
-- Isso notifica o PostgREST para reler o schema após todas migrações
NOTIFY pgrst, 'reload schema';
