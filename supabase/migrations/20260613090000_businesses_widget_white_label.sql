alter table public.businesses
add column if not exists widget_white_label jsonb not null default '{}'::jsonb;

comment on column public.businesses.widget_white_label is
  'Elite website widget white-label settings (star/text/accent colors, font, showTellacityLogo).';
