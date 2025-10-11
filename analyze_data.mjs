import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeData() {
  console.log('Analyzing raw_businesses data...\n');
  
  // Get schema
  const { data: schema, error: schemaError } = await supabase
    .from('raw_businesses')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.error('Error fetching schema:', schemaError);
    return;
  }
  
  if (schema && schema.length > 0) {
    console.log('Schema (sample record):');
    console.log(JSON.stringify(schema[0], null, 2));
    console.log('\n');
  }
  
  // Get all data to analyze
  const { data: allData, error: dataError } = await supabase
    .from('raw_businesses')
    .select('*');
  
  if (dataError) {
    console.error('Error fetching data:', dataError);
    return;
  }
  
  if (!allData || allData.length === 0) {
    console.log('No data found in raw_businesses table');
    return;
  }
  
  console.log(`Total businesses: ${allData.length}\n`);
  
  // Filter by target cities
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  const filtered = allData.filter(b => targetCities.includes(b.city));
  
  console.log(`Businesses in target cities: ${filtered.length}\n`);
  
  // Group by niche and city
  const grouped = {};
  filtered.forEach(biz => {
    const niche = biz.niche || biz.category || biz.type || 'Unknown';
    const city = biz.city;
    const key = `${niche}|${city}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        niche,
        city,
        count: 0,
        has_website: 0,
        has_phone: 0,
        has_email: 0,
        has_booking: 0,
        avg_rating: [],
        review_counts: []
      };
    }
    
    grouped[key].count++;
    if (biz.website || biz.url || biz.domain) grouped[key].has_website++;
    if (biz.phone || biz.phone_number) grouped[key].has_phone++;
    if (biz.email) grouped[key].has_email++;
    if (biz.has_booking || biz.booking_url) grouped[key].has_booking++;
    if (biz.rating) grouped[key].avg_rating.push(parseFloat(biz.rating));
    if (biz.review_count || biz.reviews_count) grouped[key].review_counts.push(parseInt(biz.review_count || biz.reviews_count));
  });
  
  // Calculate summary stats
  const summary = Object.values(grouped).map(g => ({
    niche: g.niche,
    city: g.city,
    count: g.count,
    has_website: g.has_website,
    has_phone: g.has_phone,
    has_email: g.has_email,
    has_booking: g.has_booking,
    pct_website: ((g.has_website / g.count) * 100).toFixed(1),
    pct_phone: ((g.has_phone / g.count) * 100).toFixed(1),
    pct_email: ((g.has_email / g.count) * 100).toFixed(1),
    pct_booking: ((g.has_booking / g.count) * 100).toFixed(1),
    avg_rating: g.avg_rating.length ? (g.avg_rating.reduce((a,b) => a+b, 0) / g.avg_rating.length).toFixed(2) : 'N/A',
    avg_reviews: g.review_counts.length ? Math.round(g.review_counts.reduce((a,b) => a+b, 0) / g.review_counts.length) : 'N/A'
  }));
  
  // Sort by count descending
  summary.sort((a, b) => b.count - a.count);
  
  console.log('Business Analysis by Niche & City:');
  console.table(summary);
  
  // Get niche totals
  const nicheT otals = {};
  summary.forEach(s => {
    if (!nicheTotals[s.niche]) {
      nicheTotals[s.niche] = { 
        count: 0, 
        has_website: 0, 
        has_phone: 0, 
        has_email: 0,
        has_booking: 0,
        cities: new Set()
      };
    }
    nicheTotals[s.niche].count += s.count;
    nicheTotals[s.niche].has_website += s.has_website;
    nicheTotals[s.niche].has_phone += s.has_phone;
    nicheTotals[s.niche].has_email += s.has_email;
    nicheTotals[s.niche].has_booking += s.has_booking;
    nicheTotals[s.niche].cities.add(s.city);
  });
  
  const nicheSummary = Object.entries(nicheTotals).map(([niche, data]) => ({
    niche,
    total_count: data.count,
    cities: data.cities.size,
    has_website: data.has_website,
    has_phone: data.has_phone,
    has_email: data.has_email,
    has_booking: data.has_booking,
    pct_website: ((data.has_website / data.count) * 100).toFixed(1),
    pct_phone: ((data.has_phone / data.count) * 100).toFixed(1),
    pct_email: ((data.has_email / data.count) * 100).toFixed(1),
    pct_booking: ((data.has_booking / data.count) * 100).toFixed(1),
    opportunity_score: (data.count * (100 - (data.has_booking / data.count) * 100) / 100).toFixed(0)
  })).sort((a, b) => b.opportunity_score - a.opportunity_score);
  
  console.log('\n\nNiche Summary (sorted by opportunity score):');
  console.table(nicheSummary);
}

analyzeData().catch(console.error);
