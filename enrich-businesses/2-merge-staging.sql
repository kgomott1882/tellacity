update business_enrichment_staging
set status = 'approved'
where confidence = 'high' and status = 'pending';

update businesses b
set
  description = coalesce(
    case when b.description ilike '%Tellacity%' then null else nullif(trim(b.description), '') end,
    nullif(s.extracted_description, '')
  ),
  address = coalesce(
    case
      when trim(b.address) in (
        'United States', 'United Kingdom', 'India', 'South Africa', 'Canada',
        '-', 'Nationwide', 'Various Locations'
      ) then null
      else nullif(trim(b.address), '')
    end,
    nullif(s.extracted_address, '')
  ),
  phone = coalesce(b.phone, nullif(s.extracted_phone, '')),
  email = coalesce(nullif(trim(b.email), ''), nullif(trim(s.extracted_email), ''))
from business_enrichment_staging s
where s.business_id = b.id and s.status = 'approved';

update business_enrichment_staging
set status = 'merged', reviewed_at = now()
where status = 'approved';
