-- Allow admin_update_review_status to update only visibility or only flag when the other arg is NULL.

create or replace function public.admin_update_review_status(
  target_review_id uuid,
  new_status text,
  new_flagged boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  if new_status is not null and new_status not in ('visible', 'hidden') then
    raise exception 'Invalid moderation status';
  end if;

  if new_status is null and new_flagged is null then
    return;
  end if;

  update public.reviews
  set
    visibility_status = case when new_status is null then visibility_status else new_status end,
    flagged = case when new_flagged is null then flagged else new_flagged end
  where id = target_review_id;
end;
$$;

comment on function public.admin_update_review_status(uuid, text, boolean) is
  'Admin: set visibility and/or flagged; pass NULL for the field to leave unchanged.';
