-- ============================================================
-- Migration 0014 — Drop meeting_briefings (Diagnósticos)
-- ============================================================
-- A feature de Diagnósticos foi removida do produto. Esta migration
-- limpa a tabela e dados relacionados.
-- ============================================================

drop table if exists public.meeting_briefings cascade;
