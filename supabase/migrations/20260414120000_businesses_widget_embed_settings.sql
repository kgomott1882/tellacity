-- Persist website widget embed preferences (theme per widget type, dashboard preview hex).
-- Used when /widgets/embed receives theme=inherit (e.g. v1.js when data-theme is omitted).

alter table public.businesses
add column if not exists widget_embed_settings jsonb not null default '{}'::jsonb;

comment on column public.businesses.widget_embed_settings is
  'Website widget defaults: themes map (widget type -> minimal|light), advancedEnabled, previewSiteBackgroundHex for dashboard.';
