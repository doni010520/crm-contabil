-- GMB Connections (one per tenant)
CREATE TABLE public.gmb_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  google_account_id text,
  google_location_id text,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  office_name_gmb text,
  description text,
  primary_category text,
  secondary_categories text[] DEFAULT '{}',
  services jsonb DEFAULT '[]',
  profile_score integer DEFAULT 0,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  is_new_profile boolean DEFAULT false,
  auto_posts_enabled boolean DEFAULT true,
  auto_reviews_enabled boolean DEFAULT true,
  post_frequency text DEFAULT 'weekly' CHECK (post_frequency IN ('weekly', 'biweekly', 'monthly')),
  post_tone text DEFAULT 'formal' CHECK (post_tone IN ('formal', 'friendly', 'casual')),
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

-- GMB Posts
CREATE TABLE public.gmb_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  google_post_id text,
  content text NOT NULL,
  cta_type text DEFAULT 'none' CHECK (cta_type IN ('learn_more', 'book', 'call', 'none')),
  cta_url text,
  image_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for timestamptz,
  published_at timestamptz,
  generated_by_ai boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- GMB Reviews
CREATE TABLE public.gmb_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  google_review_id text NOT NULL,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  reply text,
  reply_status text DEFAULT 'pending' CHECK (reply_status IN ('pending', 'replied', 'skipped')),
  replied_at timestamptz,
  replied_by text CHECK (replied_by IN ('ai', 'manual')),
  review_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, google_review_id)
);

-- GMB Optimization Log
CREATE TABLE public.gmb_optimization_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('description_updated', 'categories_updated', 'services_added', 'profile_created', 'posts_scheduled', 'review_replied')),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add gmb_connected to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS gmb_connected boolean DEFAULT false;

-- RLS
ALTER TABLE public.gmb_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_optimization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.gmb_connections FOR ALL USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "tenant_isolation" ON public.gmb_posts FOR ALL USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "tenant_isolation" ON public.gmb_reviews FOR ALL USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "tenant_isolation" ON public.gmb_optimization_log FOR ALL USING (tenant_id = auth_user_tenant_id());

-- Indexes
CREATE INDEX idx_gmb_posts_tenant ON public.gmb_posts(tenant_id);
CREATE INDEX idx_gmb_posts_status ON public.gmb_posts(status);
CREATE INDEX idx_gmb_reviews_tenant ON public.gmb_reviews(tenant_id);
CREATE INDEX idx_gmb_reviews_status ON public.gmb_reviews(reply_status);
CREATE INDEX idx_gmb_optimization_log_tenant ON public.gmb_optimization_log(tenant_id);

-- Updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gmb_connections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
