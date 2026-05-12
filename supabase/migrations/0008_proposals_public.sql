-- Add public proposal link, view tracking, and digital acceptance to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Proposal views tracking
CREATE TABLE IF NOT EXISTS public.proposal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  ip text,
  user_agent text,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Owner can read views
CREATE POLICY "owner_read_views" ON public.proposal_views FOR SELECT USING (
  proposal_id IN (SELECT id FROM proposals WHERE tenant_id = auth_user_tenant_id())
);

-- Public insert for tracking (the API route handles this)
CREATE POLICY "public_insert_views" ON public.proposal_views FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal ON public.proposal_views(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_token ON public.proposals(public_token);
