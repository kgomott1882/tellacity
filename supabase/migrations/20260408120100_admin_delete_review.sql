-- Admin: permanently delete a review (child rows cascade where FKs allow).

create or replace function public.admin_delete_review(target_review_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.reviews
  where id = target_review_id;
end;
$$;

comment on function public.admin_delete_review(uuid) is
  'Admin: delete a review by id; requires is_current_user_admin().';

grant execute on function public.admin_delete_review(uuid) to authenticated;
