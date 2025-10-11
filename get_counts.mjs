import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCounts() {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  console.log('=== GETTING ACCURATE ROW COUNTS ===\n');
  
  // Get count from mv_rb_base
  const { count: mvCount, error: mvError } = await supabase
    .from('mv_rb_base')
    .select('*', { count: 'exact', head: true });
  
  console.log(`mv_rb_base total: ${mvCount || 'Error: ' + mvError?.message}`);
  
  // Get count from raw_businesses
  const { count: rawCount, error: rawError } = await supabase
    .from('raw_businesses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`raw_businesses total: ${rawCount || 'Error: ' + rawError?.message}`);
  
  // Get count from v_rb_base
  const { count: vCount, error: vError } = await supabase
    .from('v_rb_base')
    .select('*', { count: 'exact', head: true });
  
  console.log(`v_rb_base total: ${vCount || 'Error: ' + vError?.message}`);
  
  // Now fetch ALL data in batches from mv_rb_base
  console.log('\n=== FETCHING ALL DATA FROM mv_rb_base ===\n');
  
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('mv_rb_base')
      .select('*')
      .range(from, from + batchSize - 1);
    
    if (error) {
      console.log(`Error fetching batch: ${error.message}`);
      break;
    }
    
    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`Fetched ${data.length} records (total so far: ${allData.length})`);
      from += batchSize;
      
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`\nTotal records fetched: ${allData.length}\n`);
  
  // Filter by target cities
  const filtered = allData.filter(b => {
    const city = b.city;
    return city && targetCities.includes(city);
  });
  
  console.log(`Records in target cities: ${filtered.length}\n`);
  
  // Group by niche
  const nicheGroups = {};
  filtered.forEach(biz => {
    const niche = biz.primary_category || 'Unknown';
    
    if (!nicheGroups[niche]) {
      nicheGroups[niche] = {
        total: 0,
        has_website: 0,
        has_phone: 0,
        cities: new Set()
      };
    }
    
    nicheGroups[niche].total++;
    if (biz.website) nicheGroups[niche].has_website++;
    if (biz.phone) nicheGroups[niche].has_phone++;
    if (biz.city) nicheGroups[niche].cities.add(biz.city);
  });
  
  // Calculate opportunity scores
  const summary = Object.entries(nicheGroups).map(([niche, data]) => ({
    niche,
    total: data.total,
    cities: data.cities.size,
    has_website: data.has_website,
    has_phone: data.has_phone,
    pct_website: ((data.has_website / data.total) * 100).toFixed(1),
    pct_phone: ((data.has_phone / data.total) * 100).toFixed(1),
    missing_website: data.total - data.has_website,
    opportunity_score: Math.round(data.total * (1 - (data.has_website / data.total)) * (data.has_phone / data.total))
  })).sort((a, b) => b.opportunity_score - a.opportunity_score);
  
  console.log('TOP 30 OPPORTUNITIES (by volume × missing_website × has_phone):');
  console.table(summary.slice(0, 30));
  
  // Show user-mentioned niches
  const userNiches = ['cleaning', 'plumb', 'hvac', 'dentist', 'dental', 'contractor', 'fitness', 'gym'];
  const relevant = summary.filter(s => 
    userNiches.some(n => s.niche.toLowerCase().includes(n))
  );
  
  console.log('\n\nUSER-MENTIONED NICHES (Cleaning, Plumbing, HVAC, Dentist, Contractors, Fitness):');
  console.table(relevant);
}

getCounts().catch(console.error);
