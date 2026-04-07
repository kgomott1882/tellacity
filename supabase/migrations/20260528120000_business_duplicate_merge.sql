-- Data fix: reassign dependent rows from duplicate business records to one canonical
-- business per (normalized name, country_code) group.
-- Does NOT delete businesses or reviews; skips updates that would violate uniqueness.
-- Does NOT update business_owners (PK = business_id; merge requires owner merge separately).
--
-- STEP 1 — Inspect duplicate groups (run in SQL editor before/after migrate):
--   WITH ranked AS (
--     SELECT b.id, public.normalize_business_name(b.name) AS nkey,
--       coalesce(nullif(trim(upper(b.country_code)), ''), '__') AS ckey,
--       b.name, b.country_code
--     FROM public.businesses b
--     WHERE length(public.normalize_business_name(b.name)) >= 3
--   )
--   SELECT nkey, ckey, count(*) AS cnt, array_agg(id ORDER BY id) AS business_ids
--   FROM ranked
--   GROUP BY nkey, ckey
--   HAVING count(*) > 1;
--
-- STEP 2 — Canonical per group is chosen inside the DO block as:
--   max published review count, then owner present, then earliest created_at, then id.

-- ── Normalization (reusable for detection / optional future unique index) ─────
CREATE OR REPLACE FUNCTION public.normalize_business_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    lower(trim(coalesce(p_name, ''))),
    '[^a-z0-9]+',
    '',
    'g'
  );
$$;

COMMENT ON FUNCTION public.normalize_business_name(text) IS
  'Lowercase, trim, strip non-alphanumeric for duplicate business grouping.';

-- ── One-off merge (idempotent: only rows still pointing at duplicate ids change) ──
DO $merge$
DECLARE
  n_reviews int := 0;
  n_invites int := 0;
  n_drafts int := 0;
  n_logs int := 0;
  n_locations int := 0;
  n_tmpl int := 0;
  n_members int := 0;
  n_member_inv int := 0;
  n_domain_ver int := 0;
  n_widget int := 0;
  tmpl_key_col text;
BEGIN
  SELECT c.column_name INTO tmpl_key_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'review_invite_email_templates'
    AND c.column_name IN ('template_key', 'type')
  ORDER BY CASE WHEN c.column_name = 'template_key' THEN 0 ELSE 1 END
  LIMIT 1;
  CREATE TEMP TABLE _biz_merge_map (
    canonical_id uuid NOT NULL,
    duplicate_id uuid NOT NULL,
    PRIMARY KEY (duplicate_id)
  ) ON COMMIT DROP;

  INSERT INTO _biz_merge_map (canonical_id, duplicate_id)
  WITH ranked AS (
    SELECT
      b.id,
      public.normalize_business_name(b.name) AS nkey,
      coalesce(nullif(trim(upper(b.country_code)), ''), '__') AS ckey,
      (
        SELECT count(*)::bigint
        FROM public.reviews r
        WHERE r.business_id = b.id
          AND (r.status IS NULL OR r.status = 'published')
      ) AS rev_cnt,
      (b.owner_id IS NOT NULL) AS has_owner,
      b.created_at
    FROM public.businesses b
    WHERE length(public.normalize_business_name(b.name)) >= 3
  ),
  groups AS (
    SELECT
      nkey,
      ckey,
      array_agg(id ORDER BY rev_cnt DESC, has_owner DESC, created_at ASC NULLS LAST, id ASC) AS ids
    FROM ranked
    GROUP BY nkey, ckey
    HAVING count(*) > 1
  ),
  pairs AS (
    SELECT
      ids[1] AS canonical_id,
      unnest(ids[2 : array_length(ids, 1)]) AS duplicate_id
    FROM groups
    WHERE array_length(ids, 1) > 1
  )
  SELECT canonical_id, duplicate_id FROM pairs;

  IF NOT EXISTS (SELECT 1 FROM _biz_merge_map LIMIT 1) THEN
    RAISE NOTICE 'business merge: no duplicate (name, country) groups found (min normalized name length 3).';
  ELSE
    -- reviews: avoid unique clash on (guest_email, business_id) when guest_email is set;
    -- multiple NULL guest emails are allowed on the same business.
    UPDATE public.reviews r
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE r.business_id = m.duplicate_id
      AND (
        r.guest_email IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM public.reviews r2
          WHERE r2.business_id = m.canonical_id
            AND r2.guest_email IS NOT DISTINCT FROM r.guest_email
        )
      );
    GET DIAGNOSTICS n_reviews = ROW_COUNT;

    UPDATE public.review_invites ri
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE ri.business_id = m.duplicate_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.review_invites ri2
        WHERE ri2.business_id = m.canonical_id
          AND ri2.recipient_email IS NOT DISTINCT FROM ri.recipient_email
      );
    GET DIAGNOSTICS n_invites = ROW_COUNT;

    UPDATE public.review_drafts rd
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE rd.business_id = m.duplicate_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.review_drafts rd2
        WHERE rd2.business_id = m.canonical_id
          AND rd2.email IS NOT DISTINCT FROM rd.email
      );
    GET DIAGNOSTICS n_drafts = ROW_COUNT;

    UPDATE public.business_activity_logs bal
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE bal.business_id = m.duplicate_id;
    GET DIAGNOSTICS n_logs = ROW_COUNT;

    UPDATE public.business_locations bl
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE bl.business_id = m.duplicate_id;
    GET DIAGNOSTICS n_locations = ROW_COUNT;

    IF tmpl_key_col IS NOT NULL THEN
      EXECUTE format(
        $tmpl$
        UPDATE public.review_invite_email_templates t
        SET business_id = m.canonical_id
        FROM _biz_merge_map m
        WHERE t.business_id = m.duplicate_id
          AND NOT EXISTS (
            SELECT 1
            FROM public.review_invite_email_templates t2
            WHERE t2.business_id = m.canonical_id
              AND t2.%I IS NOT DISTINCT FROM t.%I
          )
        $tmpl$,
        tmpl_key_col,
        tmpl_key_col
      );
      GET DIAGNOSTICS n_tmpl = ROW_COUNT;
    END IF;

    UPDATE public.business_members bm
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE bm.business_id = m.duplicate_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.business_members bm2
        WHERE bm2.business_id = m.canonical_id
          AND bm2.user_id IS NOT DISTINCT FROM bm.user_id
      );
    GET DIAGNOSTICS n_members = ROW_COUNT;

    IF to_regclass('public.business_member_invites') IS NOT NULL THEN
      UPDATE public.business_member_invites bmi
      SET business_id = m.canonical_id
      FROM _biz_merge_map m
      WHERE bmi.business_id = m.duplicate_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.business_member_invites bmi2
          WHERE bmi2.business_id = m.canonical_id
            AND bmi2.email IS NOT DISTINCT FROM bmi.email
        );
      GET DIAGNOSTICS n_member_inv = ROW_COUNT;
    END IF;

    UPDATE public.business_domain_verifications dv
    SET business_id = m.canonical_id
    FROM _biz_merge_map m
    WHERE dv.business_id = m.duplicate_id;
    GET DIAGNOSTICS n_domain_ver = ROW_COUNT;

    IF to_regclass('public.email_widget_sends') IS NOT NULL THEN
      UPDATE public.email_widget_sends ews
      SET business_id = m.canonical_id
      FROM _biz_merge_map m
      WHERE ews.business_id = m.duplicate_id;
      GET DIAGNOSTICS n_widget = ROW_COUNT;
    END IF;

    RAISE NOTICE 'business merge: reviews=%, invites=%, drafts=%, activity_logs=%, locations=%, email_templates=%, members=%, member_invites=%, domain_ver=%, email_widget_sends=%',
      n_reviews, n_invites, n_drafts, n_logs, n_locations, n_tmpl, n_members, n_member_inv, n_domain_ver, n_widget;
  END IF;
END;
$merge$;

-- Optional hardening (run manually after duplicate business ROWS are removed or merged in businesses):
-- CREATE UNIQUE INDEX idx_businesses_unique_norm_name_country
--   ON public.businesses (
--     public.normalize_business_name(name),
--     coalesce(nullif(trim(upper(country_code)), ''), '__')
--   )
--   WHERE length(public.normalize_business_name(name)) >= 3;
--
-- Verification (run after migrate):
-- SELECT business_id, count(*) FROM public.reviews GROUP BY business_id ORDER BY count(*) DESC;
-- SELECT * FROM public.admin_business_insights WHERE total_reviews > 0;
