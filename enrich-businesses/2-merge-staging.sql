update business_enrichment_staging
set status = 'approved'
where confidence = 'high' and status = 'pending';

update businesses b
set
  description = coalesce(b.description, nullif(s.extracted_description, '')),
  address     = coalesce(b.address, nullif(s.extracted_address, '')),
  phone       = coalesce(b.phone, nullif(s.extracted_phone, ''))
from business_enrichment_staging s
where s.business_id = b.id and s.status = 'approved';

update business_enrichment_staging
set status = 'merged', reviewed_at = now()
where status = 'approved';
