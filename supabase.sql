-- ===== CONFIGURAÇÃO DE BANCO DE DADOS (SUPABASE) =====

-- 1. TABELA DO PILOTO AUTOMÁTICO E SITES
-- Cria a tabela que vai armazenar os canais de notícias, frequências, e o arquétipo escolhido por cada usuário.
create table public.user_automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  is_active boolean default false,
  news_source text,
  post_style text,
  frequency_days numeric,
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


-- =======================================================
-- NOTA IMPORTANTE SOBRE AS CHAVES DA API DA IA:
-- As chaves (OpenAI, Gemini), bem como a vinculação do Telegram, 
-- NÃO PRECISAM DE TABELA. Elas são salvas diretamente pelo 
-- nosso sistema dentro do próprio cadastro do usuário, numa 
-- coluna nativa chamada "raw_user_meta_data" na tabela 
-- "auth.users". É extremamente mais seguro dessa forma!
-- =======================================================

-- ==========================================
-- ATUALIZAÇÃO 2: DIAS DA SEMANA E LIMITES (RODE ESTAS 2 LINHAS)
-- Essa parte atualiza a tabela existente para aceitar "Quais dias postar?" e "Quantos por dia?"
-- ==========================================
ALTER TABLE public.user_automations 
  ADD COLUMN IF NOT EXISTS schedule_days text DEFAULT '1,2,3,4,5',
  ADD COLUMN IF NOT EXISTS posts_per_day integer DEFAULT 1;

-- ==========================================
-- ATUALIZAÇÃO 3: MEMÓRIA DIÁRIA (RODOU ANTES, RODE ESTA)
-- Crie a memória temporária do agregador para não repetir URL no mesmo dia
-- ==========================================
ALTER TABLE public.user_automations 
  ADD COLUMN IF NOT EXISTS used_sources_today text DEFAULT '';
