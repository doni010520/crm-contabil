-- ============================================================
-- Migration 0015 — Drop gmb_reviews
-- ============================================================
-- A funcionalidade de avaliações no GMB foi removida do produto.
-- Mantemos apenas as ações de Perfil e Posts.
-- ============================================================

drop table if exists public.gmb_reviews cascade;
