-- Reference number system (Trustpilot-style)
-- Business settings: type and optional custom label
alter table public.businesses
  add column if not exists reference_number_type text default 'generic';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_reference_number_type_check'
  ) then
    alter table public.businesses
      add constraint businesses_reference_number_type_check
      check (reference_number_type in ('order', 'invoice', 'booking', 'customer', 'generic', 'custom'));
  end if;
end $$;

alter table public.businesses
  add column if not exists reference_number_label_custom text;

-- Reviews: optional reference number from reviewer
alter table public.reviews
  add column if not exists reference_number text;

comment on column public.businesses.reference_number_type is 'Label type for reference field: order, invoice, booking, customer, generic, or custom';
comment on column public.businesses.reference_number_label_custom is 'Custom label when reference_number_type = custom';
comment on column public.reviews.reference_number is 'Optional reference number provided by reviewer (e.g. order/invoice id)';
