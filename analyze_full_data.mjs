import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllTables() {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  console.log('=== ANALYZING ALL BUSINESS TABLES ===\n');
  
  // Check mv_rb_base
  console.log('1. Checking mv_rb_base (materialized view)...');
  const { data: mvData, error: mvError } = await supabase
    .from('mv_rb_base')
    .select('*');
  
  if (mvError) {
    console.log('   Error:', mvError.message);
  } else {
    console.log(`   Total records: ${mvData?.length || 0}`);
    if (mvData && mvData.length > 0) {
      console.log('   Sample record:', JSON.stringify(mvData[0], null, 2).substring(0, 500) + '...');
      
      // Analyze by niche and city
      const filtered = mvData.filter(b => {
        const city = b.city || b.raw_json?.city;
        return city && targetCities.includes(city);
      });
      console.log(`   Records in target cities: ${filtered.length}\n`);
      
      analyzeByNiche(filtered, 'mv_rb_base');
    }
  }
  
  // Check v_rb_base
  console.log('\n2. Checking v_rb_base (view)...');
  const { data: vData, error: vError } = await supabase
    .from('v_rb_base')
    .select('*');
  
  if (vError) {
    console.log('   Error:', vError.message);
  } else {
    console.log(`   Total records: ${vData?.length || 0}`);
  }
  
  // Check raw_businesses
  console.log('\n3. Checking raw_businesses...');
  const { data: rawData, error: rawError } = await supabase
    .from('raw_businesses')
    .select('*');
  
  if (rawError) {
    console.log('   Error:', rawError.message);
  } else {
    console.log(`   Total records: ${rawData?.length || 0}`);
  }
  
  // Check hydration_candidates
  console.log('\n4. Checking hydration_candidates...');
  const { data: hydrationData, error: hydrationError } = await supabase
    .from('hydration_candidates')
    .select('*');
  
  if (hydrationError) {
    console.log('   Error:', hydrationError.message);
  } else {
    console.log(`   Total records: ${hydrationData?.length || 0}`);
  }
  
  // Check lead_scores
  console.log('\n5. Checking lead_scores...');
  const { data: scoresData, error: scoresError } = await supabase
    .from('lead_scores')
    .select('*');
  
  if (scoresError) {
    console.log('   Error:', scoresError.message);
  } else {
    console.log(`   Total records: ${scoresData?.length || 0}`);
  }
}

function analyzeByNiche(data, tableName) {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  // Group by niche
  const nicheGroups = {};
  data.forEach(biz => {
    const raw = biz.raw_json || biz;
    const niche = biz.primary_category || biz.categoryName || raw.categoryName || biz.category || 'Unknown';
    const city = biz.city || raw.city;
    
    if (!nicheGroups[niche]) {
      nicheGroups[niche] = {
        total: 0,
        has_website: 0,
        has_phone: 0,
        has_email: 0,
        cities: new Set(),
        avg_rating: [],
        review_counts: []
      };
    }
    
    nicheGroups[niche].total++;
    if (biz.website || raw.website) nicheGroups[niche].has_website++;
    if (biz.phone || raw.phone) nicheGroups[niche].has_phone++;
    if (biz.email || raw.email) nicheGroups[niche].has_email++;
    if (city) nicheGroups[niche].cities.add(city);
    if (biz.rating || raw.totalScore) nicheGroups[niche].avg_rating.push(parseFloat(biz.rating || raw.totalScore));
    if (biz.review_count || raw.reviewsCount) nicheGroups[niche].review_counts.push(parseInt(biz.review_count || raw.reviewsCount));
  });
  
  // Calculate summary
  const summary = Object.entries(nicheGroups).map(([niche, data]) => ({
    niche,
    total: data.total,
    cities: data.cities.size,
    has_website: data.has_website,
    has_phone: data.has_phone,
    has_email: data.has_email,
    pct_website: ((data.has_website / data.total) * 100).toFixed(1),
    pct_phone: ((data.has_phone / data.total) * 100).toFixed(1),
    pct_email: ((data.has_email / data.total) * 100).toFixed(1),
    missing_website: data.total - data.has_website,
    avg_rating: data.avg_rating.length ? (data.avg_rating.reduce((a,b) => a+b, 0) / data.avg_rating.length).toFixed(2) : 'N/A',
    avg_reviews: data.review_counts.length ? Math.round(data.review_counts.reduce((a,b) => a+b, 0) / data.review_counts.length) : 'N/A',
    opportunity_score: Math.round(data.total * (1 - (data.has_website / data.total)) * (data.has_phone / data.total))
  })).sort((a, b) => b.opportunity_score - a.opportunity_score);
  
  console.log(`\n   TOP OPPORTUNITIES from ${tableName} (by volume × missing_website × has_phone):`);
  console.table(summary.slice(0, 20));
  
  // Show specific niches mentioned by user
  const userNiches = ['cleaning', 'plumb', 'hvac', 'dentist', 'dental'];
  const relevant = summary.filter(s => 
    userNiches.some(n => s.niche.toLowerCase().includes(n))
  );
  
  if (relevant.length > 0) {
    console.log('\n   USER-MENTIONED NICHES (Cleaning, Plumbing, HVAC, Dentist):');
    console.table(relevant);
  }
}

analyzeAllTables().catch(console.error);
