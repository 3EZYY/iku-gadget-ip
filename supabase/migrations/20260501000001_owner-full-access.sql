-- ============================================================
-- Migration: Grant Owner FULL (ALL) access on all tables
-- Owner has absolute control — no row-level filters applied.
-- ============================================================

-- ── journal ──────────────────────────────────────────────────
-- Drop the previous read-only owner policy
DROP POLICY IF EXISTS "Owner can view all journal" ON public.journal;

-- Replace with unrestricted ALL policy
CREATE POLICY "Owner has full access to journal"
  ON public.journal
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ── seller_visits ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can view all seller visits" ON public.seller_visits;

CREATE POLICY "Owner has full access to seller_visits"
  ON public.seller_visits
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ── incentive_config ──────────────────────────────────────────
-- Drop the read-only "everyone" policy and recreate with owner ALL
-- (the existing "Everyone can view incentive config" still covers read for all roles)
CREATE POLICY "Owner has full access to incentive_config"
  ON public.incentive_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ── user_roles ────────────────────────────────────────────────
-- Owner can manage all roles (view, assign, revoke)
CREATE POLICY "Owner has full access to user_roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
