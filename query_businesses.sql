-- Get schema of raw_businesses
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'raw_businesses'
ORDER BY ordinal_position;

-- Get sample data with counts by niche and city
SELECT 
  niche,
  city,
  COUNT(*) as count,
  COUNT(DISTINCT CASE WHEN website IS NOT NULL THEN id END) as has_website,
  COUNT(DISTINCT CASE WHEN phone IS NOT NULL THEN id END) as has_phone
FROM raw_businesses
WHERE city IN ('Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek')
GROUP BY niche, city
ORDER BY niche, city;
