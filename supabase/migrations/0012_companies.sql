-- ============================================================================
-- Migration 0012: Companies entity + link contacts/deals to companies
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create companies table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  cnpj              text,
  company_name      text NOT NULL,          -- razao social
  trade_name        text,                   -- nome fantasia
  cnae_code         text,
  cnae_description  text,
  tax_regime        text DEFAULT 'unknown'
                    CHECK (tax_regime IN ('simples','presumido','real','mei','unknown')),
  company_size      text DEFAULT 'unknown'
                    CHECK (company_size IN ('mei','me','epp','medium','large','unknown')),

  -- Address
  address_street       text,
  address_number       text,
  address_complement   text,
  address_neighborhood text,
  address_city         text,
  address_state        text,
  address_zip          text,

  -- Business info
  founding_date     date,
  has_branches      boolean DEFAULT false,
  monthly_revenue   numeric(14,2),
  employee_count    integer,
  monthly_invoices  integer,
  niche             text,

  -- Contact info
  phone   text,
  email   text,
  website text,
  notes   text,

  enriched_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_companies_cnpj   ON companies(tenant_id, cnpj);
CREATE INDEX idx_companies_name   ON companies(tenant_id, company_name);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON companies
  FOR ALL USING (tenant_id = auth_user_tenant_id());

-- updated_at trigger
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Add company_id to contacts
-- ---------------------------------------------------------------------------
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);

-- ---------------------------------------------------------------------------
-- 3. Add company_id to deals
-- ---------------------------------------------------------------------------
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);

-- ---------------------------------------------------------------------------
-- 4. Migrate existing company data from contacts into companies table
-- ---------------------------------------------------------------------------
INSERT INTO companies (tenant_id, cnpj, company_name, trade_name, cnae_code, cnae_description,
  tax_regime, company_size, address_state, address_city, address_street,
  founding_date, has_branches,
  monthly_revenue, employee_count, monthly_invoices, niche, phone, email, enriched_at)
SELECT DISTINCT ON (tenant_id, cnpj)
  tenant_id, cnpj, company_name, trade_name, cnae_code, cnae_description,
  tax_regime, company_size, state, city, address,
  founding_date, has_branches,
  monthly_revenue, employee_count, monthly_invoices, niche, phone, email, enriched_at
FROM contacts
WHERE cnpj IS NOT NULL AND cnpj != '' AND company_name IS NOT NULL AND company_name != ''
ORDER BY tenant_id, cnpj, updated_at DESC;

-- Link contacts back to their company
UPDATE contacts c
SET company_id = co.id
FROM companies co
WHERE c.cnpj = co.cnpj AND c.tenant_id = co.tenant_id
  AND c.cnpj IS NOT NULL AND c.cnpj != '';
