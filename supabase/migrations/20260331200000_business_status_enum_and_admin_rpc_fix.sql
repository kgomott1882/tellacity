-- Admin UI uses status values that must exist on business_status_enum.
-- RPC must cast text -> enum (never COALESCE(text, enum)).

alter type public.business_status_enum add value if not exists 'suspended';
alter type public.business_status_enum add value if not exists 'under_review';

create or replace function public.admin_update_business_status(
  new_status text,
  new_submission_status text,
  target_business_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.businesses b
  set
    status = case
      when new_status is not null and length(trim(new_status)) > 0 then
        trim(new_status)::public.business_status_enum
      else
        b.status
    end,
    submission_status = coalesce(
      nullif(trim(new_submission_status), ''),
      b.submission_status
    )
  where b.id = target_business_id;
end;
$$;

grant execute on function public.admin_update_business_status(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
