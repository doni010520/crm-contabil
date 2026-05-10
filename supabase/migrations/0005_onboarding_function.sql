-- ============================================================
-- Função de onboarding: cria tenant + user owner em uma transação
-- Bypass RLS via SECURITY DEFINER (necessário porque o usuário
-- ainda não tem tenant_id, então as policies bloqueariam o INSERT).
-- ============================================================

CREATE OR REPLACE FUNCTION create_tenant_with_owner(
  p_name text,
  p_slug text,
  p_cnpj text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_tenant_id uuid;
  v_auth_user record;
BEGIN
  SELECT id, email, raw_user_meta_data INTO v_auth_user
  FROM auth.users WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid()) THEN
    RAISE EXCEPTION 'Usuário já possui um escritório cadastrado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug já em uso. Escolha outro identificador.';
  END IF;

  INSERT INTO public.tenants (name, slug, cnpj)
  VALUES (p_name, p_slug, p_cnpj)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.users (tenant_id, email, name, role, auth_id)
  VALUES (
    v_tenant_id,
    v_auth_user.email,
    COALESCE(v_auth_user.raw_user_meta_data->>'name', split_part(v_auth_user.email, '@', 1)),
    'owner',
    auth.uid()
  );

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
