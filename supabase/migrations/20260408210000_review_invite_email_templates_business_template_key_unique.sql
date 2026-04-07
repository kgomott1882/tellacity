-- PostgREST upsert requires a unique constraint on the onConflict columns.
create unique index if not exists review_invite_email_templates_business_id_template_key_uidx
  on public.review_invite_email_templates (business_id, template_key);
